export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppState {
  UPLOAD_NOTES = 'UPLOAD_NOTES',
  CHATTING = 'CHATTING',
}

export interface NoteContext {
  content: string;
  fileName: string;
}

export interface NoteItem {
  type: 'text' | 'file';
  content: string;
  mimeType: string;
  fileName?: string;
}

export type NoteData = NoteItem[];