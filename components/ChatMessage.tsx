import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AlertCircle, ExternalLink, Search } from 'lucide-react';
import { ChatMessage as ChatMessageType, Role } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === Role.MODEL;
  const isError = message.isError;
  const isThinking = isModel && !message.text && !isError;

  // Extract grounding chunks if available
  const groundingChunks = message.groundingMetadata?.groundingChunks || [];
  const webSources = groundingChunks
    .filter((chunk: any) => chunk.web)
    .map((chunk: any) => chunk.web);

  return (
    <div className={`flex w-full mb-6 ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] flex-col ${isModel ? 'items-start' : 'items-end'}`}>
        
        {/* Message Bubble or Text Area */}
        <div className={`overflow-hidden ${
          isError 
            ? 'px-4 py-3 rounded-2xl bg-red-900/20 border border-red-800 text-red-200' 
            : isModel 
              ? 'bg-transparent text-gray-100 px-0' 
              : 'px-4 py-3 rounded-2xl shadow-sm bg-secondary text-gray-100' 
        }`}>
          
          {/* Image Attachments */}
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.images.map((img, idx) => (
                <img 
                  key={idx} 
                  src={img} 
                  alt="User upload" 
                  className="max-w-full h-auto max-h-64 rounded-lg object-cover border border-white/10"
                />
              ))}
            </div>
          )}

          {isError ? (
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <p>{message.text}</p>
            </div>
          ) : isThinking ? (
            <div className="flex items-center gap-1 h-6 px-1">
              <span className="w-1.5 h-1.5 bg-muted/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-muted/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-muted/60 rounded-full animate-bounce"></span>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-sm leading-relaxed font-normal">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg !my-2 !bg-[#0a0a0a] text-xs md:text-sm border border-secondary"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={`${className} bg-black/20 px-1 py-0.5 rounded font-mono text-xs`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-4 rounded-lg border border-secondary">
                      <table className="w-full text-left border-collapse bg-surface/50 min-w-full" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => (
                    <thead className="bg-secondary/50 text-gray-200" {...props} />
                  ),
                  th: ({node, ...props}) => (
                    <th className="px-4 py-3 text-sm font-semibold border-b border-secondary whitespace-nowrap" {...props} />
                  ),
                  td: ({node, ...props}) => (
                    <td className="px-4 py-3 text-sm border-b border-secondary/50" {...props} />
                  ),
                  tr: ({node, ...props}) => (
                    <tr className="hover:bg-white/5 transition-colors" {...props} />
                  )
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources / Grounding Data */}
        {isModel && webSources.length > 0 && (
          <div className="mt-2 text-xs max-w-full">
            <div className="flex items-center gap-1.5 text-muted mb-1.5">
              <Search size={12} />
              <span className="font-medium uppercase tracking-wider opacity-70">Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {webSources.map((source: any, idx: number) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 bg-surface border border-secondary hover:border-primary/50 rounded-md text-muted hover:text-primary transition-colors truncate max-w-[200px]"
                >
                  <span className="truncate">{source.title || source.uri}</span>
                  <ExternalLink size={10} className="flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ChatMessage;