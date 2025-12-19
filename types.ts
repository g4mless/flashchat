export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
  images?: string[]; // base64 strings
  groundingMetadata?: any;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentModelId: string;
  error: string | null;
}