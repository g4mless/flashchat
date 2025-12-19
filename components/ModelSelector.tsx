import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, Check } from 'lucide-react';
import { AVAILABLE_MODELS } from '../constants';

interface ModelSelectorProps {
  currentModelId: string;
  onModelChange: (modelId: string) => void;
  disabled: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModelId, onModelChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === currentModelId);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 bg-surface border border-secondary hover:border-primary/50 rounded-full px-4 py-1.5 transition-all outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <Sparkles size={14} className="text-primary" />
        <span className="text-sm font-medium text-text min-w-[100px] text-left">
          {currentModel?.name || 'Select Model'}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-secondary rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = model.id === currentModelId;
            return (
              <button
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between group transition-colors hover:bg-secondary
                  ${isSelected ? 'text-primary bg-primary/5' : 'text-gray-300'}
                `}
              >
                <div className="flex flex-col">
                   <span className="font-medium">{model.name}</span>
                </div>
                {isSelected && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;