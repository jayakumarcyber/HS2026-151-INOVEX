import axios from 'axios';
import {
  HealthResponse,
  DocumentItem,
  DocumentUploadResponse,
  DocumentListResponse,
  DocumentProcessResponse,
  IndexStatusResponse,
  IndexingResponse,
  SearchRequest,
  SearchResponse,
  AskRequest,
  AskResponse,
} from '../types';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30s timeout for processing large PDFs & model loads
});

export const apiService = {
  /**
   * Check backend service health and measure roundtrip latency.
   */
  async checkHealth(): Promise<{ data: HealthResponse; latencyMs: number }> {
    const startTime = performance.now();
    const response = await apiClient.get<HealthResponse>('/health');
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      data: response.data,
      latencyMs,
    };
  },

  /**
   * Upload a PDF document to the backend.
   */
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<DocumentUploadResponse>(
      '/api/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Fetch all uploaded document metadata.
   */
  async getDocuments(): Promise<DocumentItem[]> {
    const response = await apiClient.get<DocumentListResponse>('/api/documents');
    return response.data.documents || [];
  },

  /**
   * Trigger page-by-page text extraction for an uploaded document.
   */
  async processDocument(documentId: string): Promise<DocumentProcessResponse> {
    const response = await apiClient.post<DocumentProcessResponse>(
      `/api/documents/${documentId}/process`
    );
    return response.data;
  },

  /**
   * Delete an uploaded document and its artifacts.
   */
  async deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/documents/${documentId}`
    );
    return response.data;
  },

  /**
   * Fetch current FAISS vector index status.
   */
  async getIndexStatus(): Promise<IndexStatusResponse> {
    const response = await apiClient.get<IndexStatusResponse>('/api/index/status');
    return response.data;
  },

  /**
   * Build or rebuild FAISS vector index.
   */
  async triggerIndexing(): Promise<IndexingResponse> {
    const response = await apiClient.post<IndexingResponse>('/api/index');
    return response.data;
  },

  /**
   * Perform vector similarity retrieval.
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await apiClient.post<SearchResponse>('/api/search', request);
    return response.data;
  },

  /**
   * Execute document-grounded RAG question answering.
   */
  async askQuestion(request: AskRequest): Promise<AskResponse> {
    const response = await apiClient.post<AskResponse>('/api/ask', request);
    return response.data;
  },
};

export default apiService;
