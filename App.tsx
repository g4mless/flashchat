import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GeminiService } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ModelSelector from './components/ModelSelector';
import { ChatMessage as ChatMessageType, Role } from './types';
import { DEFAULT_MODEL_ID, AVAILABLE_MODELS } from './constants';
import { Zap, Trash2, Globe } from 'lucide-react';

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  // Initialize state from localStorage
  const [messages, setMessages] = useState<ChatMessageType[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat_messages');
      try {
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to parse chat history", e);
        return [];
      }
    }
    return [];
  });

  const [currentModelId, setCurrentModelId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selected_model_id') || DEFAULT_MODEL_ID;
    }
    return DEFAULT_MODEL_ID;
  });

  const [isGroundingEnabled, setIsGroundingEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('grounding_enabled') === 'true';
    }
    return false;
  });

  const [isLoading, setIsLoading] = useState(false);
  
  // Use a ref for the service to persist it across renders without causing re-renders itself
  const geminiServiceRef = useRef<GeminiService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize service on mount
  useEffect(() => {
    geminiServiceRef.current = new GeminiService(currentModelId);
    geminiServiceRef.current.setGrounding(isGroundingEnabled);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save messages to localStorage (quota likely exceeded)", e);
    }
  }, [messages]);

  // Handle Grounding Toggle
  const toggleGrounding = () => {
    const newValue = !isGroundingEnabled;
    setIsGroundingEnabled(newValue);
    localStorage.setItem('grounding_enabled', String(newValue));
    if (geminiServiceRef.current) {
      geminiServiceRef.current.setGrounding(newValue);
    }
  };

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleModelChange = (newId: string) => {
    setCurrentModelId(newId);
    localStorage.setItem('selected_model_id', newId);
    
    if (geminiServiceRef.current) {
      geminiServiceRef.current.updateModel(newId);
    }
    
    setMessages(prev => [
      ...prev,
      {
        id: uuidv4(),
        role: Role.MODEL,
        text: `Switched to **${AVAILABLE_MODELS.find(m => m.id === newId)?.name}**.`,
        timestamp: Date.now()
      }
    ]);
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem('chat_messages');
    if (geminiServiceRef.current) {
      geminiServiceRef.current.updateModel(currentModelId);
    }
  };

  const handleSendMessage = async (text: string, files: File[]) => {
    if (!geminiServiceRef.current) return;

    setIsLoading(true);

    try {
      // Process images
      const base64Images = await Promise.all(files.map(fileToBase64));
      
      // Create user message
      const userMessage: ChatMessageType = {
        id: uuidv4(),
        role: Role.USER,
        text: text,
        timestamp: Date.now(),
        images: base64Images
      };

      setMessages(prev => [...prev, userMessage]);

      // Create placeholder for model response
      const modelMessageId = uuidv4();
      const modelMessagePlaceholder: ChatMessageType = {
        id: modelMessageId,
        role: Role.MODEL,
        text: '', // Empty initially
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMessagePlaceholder]);

      // Prepare image parts for the service if any
      const imageParts = base64Images.map(base64 => ({
        inlineData: {
          data: base64.split(',')[1], // Remove data URL prefix
          mimeType: base64.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
        }
      }));

      const stream = geminiServiceRef.current.sendMessageStream(text, imageParts.length ? imageParts : undefined);
      
      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk.text;
        const metadata = chunk.groundingMetadata;
        
        setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId 
            ? { ...msg, text: fullText, groundingMetadata: metadata || msg.groundingMetadata }
            : msg
        ));
      }

    } catch (error: any) {
      console.error('Error generating response:', error);
      // Update the placeholder with error
      setMessages(prev => prev.map(msg => {
         if (msg.role === Role.MODEL && msg.text === '' && prev[prev.length - 1].id === msg.id) {
            return { ...msg, text: "Sorry, something went wrong. Please try again.", isError: true };
         }
         return msg;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex flex-col h-screen bg-background text-text overflow-hidden font-sans">
      
      {/* Header */}
      <header className="flex-none h-16 border-b border-secondary/50 flex items-center justify-between px-4 md:px-8 z-20 bg-background/80 backdrop-blur-lg sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Zap className="text-white fill-current" size={18} />
          </div>
          <h1 className="text-lg font-bold text-gray-100 tracking-tight hidden md:block">
            Flash Chat
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Grounding Toggle */}
          <button
            onClick={toggleGrounding}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-sm font-medium ${
              isGroundingEnabled 
                ? 'bg-blue-900/30 border-blue-500/50 text-blue-400' 
                : 'bg-surface border-secondary text-muted hover:text-text'
            }`}
            title="Toggle Google Search Grounding"
          >
            <Globe size={14} className={isGroundingEnabled ? 'text-blue-400' : 'text-muted'} />
            <span className="hidden sm:inline">Search</span>
            {isGroundingEnabled && <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
          </button>

          <div className="h-6 w-px bg-secondary mx-1" />

          <ModelSelector 
            currentModelId={currentModelId}
            onModelChange={handleModelChange}
            disabled={isLoading}
          />
          
          <button 
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className={`p-2 rounded-full transition-colors ${
              messages.length === 0 
                ? 'text-secondary cursor-not-allowed' 
                : 'text-muted hover:text-red-400 hover:bg-secondary cursor-pointer'
            }`}
            title="Clear Chat History"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center text-muted">
              <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mb-6">
                <SparklesIcon className="w-10 h-10 text-primary opacity-80" />
              </div>
              <h2 className="text-3xl font-semibold text-text mb-3">{getGreeting()}</h2>
              <p className="max-w-md text-sm md:text-base mb-2">
                Start a conversation with Google's most capable models. 
                Upload images or ask complex questions to get started.
              </p>
              
              <p className="text-xs text-muted/50 mb-8 max-w-sm mx-auto">
                Gemini may display inaccurate info, including about people, so double-check its responses.
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                 <span className="px-3 py-1 bg-secondary rounded-full text-xs font-mono">Gemini 2.0 Flash</span>
                 <span className="px-3 py-1 bg-secondary rounded-full text-xs font-mono">Gemini 3 Flash</span>
                 {isGroundingEnabled && <span className="px-3 py-1 bg-blue-900/20 border border-blue-800 rounded-full text-xs font-mono text-blue-400">Search Enabled</span>}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 z-20 bg-gradient-to-t from-background via-background to-transparent">
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </footer>

    </div>
  );
};

// Simple Icon component for the empty state
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

export default App;