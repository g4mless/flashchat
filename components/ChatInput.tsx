import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, ImagePlus, X, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string, images: File[]) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && images.length === 0) || isLoading) return;

    onSend(text, images);
    setText('');
    setImages([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Limit to 3 images for simplicity
      setImages(prev => [...prev, ...newFiles].slice(0, 3));
    }
    // Reset value so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="relative flex flex-col bg-surface border border-secondary rounded-2xl shadow-lg transition-colors focus-within:border-primary/50">
        
        {/* Image Previews */}
        {images.length > 0 && (
          <div className="flex gap-3 p-3 pb-0 overflow-x-auto">
            {images.map((file, idx) => (
              <div key={idx} className="relative group flex-shrink-0">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="preview" 
                  className="w-16 h-16 object-cover rounded-lg border border-secondary"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 text-muted hover:text-text hover:bg-secondary/50 rounded-lg transition-colors disabled:opacity-50"
            title="Add image"
          >
            <ImagePlus size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            multiple
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Gemini anything..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-text placeholder-muted resize-none focus:outline-none py-2 max-h-[200px]"
            style={{ minHeight: '24px' }}
          />

          <button
            onClick={() => handleSubmit()}
            disabled={(!text.trim() && images.length === 0) || isLoading}
            className={`p-2 rounded-lg transition-all duration-200 ${
              (!text.trim() && images.length === 0) || isLoading
                ? 'bg-secondary text-muted cursor-not-allowed'
                : 'bg-primary text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <SendHorizontal size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;