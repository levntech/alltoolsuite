// utils/apiClient.ts
// Centralized API client for making HTTP requests

import axios, { AxiosError } from 'axios';
import { createLogger, transports, format } from 'winston';

// Logger setup
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

interface ApiResponse<T> {
  data: T;
  status: number;
}

class ApiClient {
  private baseURL: string;
  private apiKey?: string;
  private lastApiCall: number = 0;
  private readonly RATE_LIMIT_MS: number = 1000; // 1 second rate limit
  private readonly MAX_RETRIES: number = 3;

  constructor(baseURL: string = '/api', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.lastApiCall < this.RATE_LIMIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, this.RATE_LIMIT_MS - (now - this.lastApiCall)));
    }
    this.lastApiCall = Date.now();
  }

  async post<T>(url: string, data: FormData): Promise<ApiResponse<T>> {
    await this.enforceRateLimit();

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post<T>(`${this.baseURL}${url}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return {
          data: response.data,
          status: response.status,
        };
      } catch (error: any) {
        const axiosError = error as AxiosError;
        logger.error(`API POST request failed: ${url} (Attempt ${attempt}/${this.MAX_RETRIES})`, {
          error: axiosError.message,
          status: axiosError.response?.status,
        });

        if (attempt === this.MAX_RETRIES) {
          const errorMessage =
            axiosError.response?.data && typeof axiosError.response.data === 'object' && 'error' in axiosError.response.data
              ? (axiosError.response.data as { error?: string }).error
              : undefined;
          throw new Error(errorMessage || axiosError.message || 'Unknown API error');
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }

  async get<T>(url: string, params: Record<string, any> = {}): Promise<ApiResponse<T>> {
    await this.enforceRateLimit();

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get<T>(`${this.baseURL}${url}`, {
          params: this.apiKey ? { ...params, access_key: this.apiKey } : params,
        });
        return {
          data: response.data,
          status: response.status,
        };
      } catch (error: any) {
        const axiosError = error as AxiosError;
        logger.error(`API GET request failed: ${url} (Attempt ${attempt}/${this.MAX_RETRIES})`, {
          error: axiosError.message,
          status: axiosError.response?.status,
        });

        if (attempt === this.MAX_RETRIES) {
          const errorMessage =
            axiosError.response?.data && typeof axiosError.response.data === 'object' && 'error' in axiosError.response.data
              ? (axiosError.response.data as { error?: string }).error
              : undefined;
          throw new Error(errorMessage || axiosError.message || 'Unknown API error');
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }
}

export const apiClient = new ApiClient(); // For audio tools (POST requests)
export const exchangeRateApiClient = new ApiClient(
  'https://v6.exchangerate-api.com/v6',
  process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || 'YOUR_API_KEY_HERE' // Replace with your ExchangeRate-API key or use env variable
);