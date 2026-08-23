import axios from 'axios';
import { HealthResponse } from '../types';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
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
   * Generic get helper for future phase routes
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await apiClient.get<T>(endpoint);
    return response.data;
  },

  /**
   * Generic post helper for future phase routes
   */
  async post<T, B = unknown>(endpoint: string, body: B): Promise<T> {
    const response = await apiClient.post<T>(endpoint, body);
    return response.data;
  },
};

export default apiService;
