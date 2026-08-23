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

export type DocumentProcessingStatus = 'uploaded' | 'processing' | 'processed' | 'failed';

export interface DocumentItem {
  document_id: string;
  filename: string;
  file_size: number;
  upload_timestamp: string;
  file_type?: string | null;
  pages?: number | null;
  status: DocumentProcessingStatus;
  error_message?: string | null;
}

export interface DocumentUploadResponse {
  success: boolean;
  document_id: string;
  filename: string;
  status: DocumentProcessingStatus;
  message?: string;
}

export interface DocumentListResponse {
  documents: DocumentItem[];
}

export interface DocumentProcessResponse {
  success: boolean;
  document_id: string;
  status: DocumentProcessingStatus;
  pages: number;
  message: string;
}

export interface IndexStatusResponse {
  is_indexed: boolean;
  documents_count: number;
  chunks_count: number;
  embedding_dimension: number;
  embedding_model: string;
  status: string;
}

export interface IndexingResponse {
  success: boolean;
  documents: number;
  chunks: number;
  embedding_dimension: number;
  status: string;
  message: string;
}

export interface SearchRequest {
  query: string;
  top_k?: number;
}

export interface SearchResultItem {
  chunk_id: string;
  document_id: string;
  document_name: string;
  file_type?: string;
  page: number;
  section_label?: string;
  text: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}

export interface SourceCitation {
  document: string;
  page: number;
  section_label?: string;
  chunk_id: string;
  score: number;
}

export interface AskRequest {
  question: string;
  language?: string;
  is_summary?: boolean;
}

export interface AskResponse {
  answer: string;
  known: boolean;
  grounded: boolean;
  response_type?: string;
  sources: SourceCitation[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  known?: boolean;
  response_type?: string;
  citations?: SourceCitation[];
}
