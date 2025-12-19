import { ModelConfig } from './types';

// Defining the models requested. 
// Note: "Gemini 2.5 Flash" in the context of latest updates often refers to the Gemini 3 Flash Preview 
// or specific 2.5 endpoint. Per instructions, we use the specific available preview tags.
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    description: 'Fast and efficient (Experimental)'
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Latest generation, high speed & reasoning'
  }
];

export const DEFAULT_MODEL_ID = 'gemini-3-flash-preview';

export const SYSTEM_INSTRUCTION = `You are a helpful, clever, and concise AI assistant running on Google's Gemini models. 
Format your responses using clean Markdown. Use headings, lists, and code blocks where appropriate to make information readable.`;