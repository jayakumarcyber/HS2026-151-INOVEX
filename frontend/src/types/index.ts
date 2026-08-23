export interface HealthResponse {
  status: string;
  service: string;
}

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

export interface HealthState {
  status: ConnectionStatus;
  data: HealthResponse | null;
  latencyMs: number | null;
  errorMessage: string | null;
  lastChecked: Date | null;
}

export interface DocumentItem {
  id: string;
  name: string;
  sizeBytes: number;
  uploadedAt: string;
  chunksCount?: number;
  status: 'indexed' | 'processing' | 'failed';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  citations?: Array<{
    documentId: string;
    documentName: string;
    pageOrSection: string;
    excerpt: string;
  }>;
}
