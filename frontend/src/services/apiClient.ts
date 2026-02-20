import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config';
import { ApiError, ApiResponse } from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError): ApiError {
    if (error.response?.data) {
      const data = error.response.data as any;
      if (data.code && data.message) {
        return {
          code: data.code,
          message: data.message,
          details: data.details,
        };
      }
    }

    if (error.response) {
      return {
        code: `http_${error.response.status}`,
        message: error.message || 'An error occurred',
        details: error.response.data,
      };
    }

    if (error.request) {
      return {
        code: 'network_error',
        message: 'Network error - please check your connection',
      };
    }

    return {
      code: 'unknown_error',
      message: error.message || 'An unexpected error occurred',
    };
  }

  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(url, { params });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }

  async delete<T = void>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(url);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as ApiError };
    }
  }
}

export const apiClient = new ApiClient();