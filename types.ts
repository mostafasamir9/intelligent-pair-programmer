export interface File {
  id: string;
  name: string;
  language: string;
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  DIFF = 'DIFF'
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface AnalysisIssue {
  line?: number;
  message: string;
  suggestion?: string;
  severity: 'error' | 'warning' | 'info';
}