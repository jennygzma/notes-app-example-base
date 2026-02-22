import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ErrorResponse } from '../types';
import { API_BASE_URL } from '../config';

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
      (error) => this.handleError(error)
    );
  }

  private handleError(error: AxiosError<ErrorResponse>): Promise<never> {
    const errorResponse: ErrorResponse = {
      error: error.message,
      details: error.response?.data?.details,
    };
    return Promise.reject(errorResponse);
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url);
      return {
        data: response.data,
        error: undefined,
        status: response.status,
      };
    } catch (error) {
      return {
        data: undefined,
        error: error as ErrorResponse,
        status: (error as any)?.response?.status || 500,
      };
    }
  }

  async post<TReq, TRes>(url: string, data: TReq): Promise<ApiResponse<TRes>> {
    try {
      const response: AxiosResponse<TRes> = await this.client.post(url, data);
      return {
        data: response.data,
        error: undefined,
        status: response.status,
      };
    } catch (error) {
      return {
        data: undefined,
        error: error as ErrorResponse,
        status: (error as any)?.response?.status || 500,
      };
    }
  }

  async put<TReq, TRes>(url: string, data: TReq): Promise<ApiResponse<TRes>> {
    try {
      const response: AxiosResponse<TRes> = await this.client.put(url, data);
      return {
        data: response.data,
        error: undefined,
        status: response.status,
      };
    } catch (error) {
      return {
        data: undefined,
        error: error as ErrorResponse,
        status: (error as any)?.response?.status || 500,
      };
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url);
      return {
        data: response.data,
        error: undefined,
        status: response.status,
      };
    } catch (error) {
      return {
        data: undefined,
        error: error as ErrorResponse,
        status: (error as any)?.response?.status || 500,
      };
    }
  }

  async patch<TReq, TRes>(url: string, data: TReq): Promise<ApiResponse<TRes>> {
    try {
      const response: AxiosResponse<TRes> = await this.client.patch(url, data);
      return {
        data: response.data,
        error: undefined,
        status: response.status,
      };
    } catch (error) {
      return {
        data: undefined,
        error: error as ErrorResponse,
        status: (error as any)?.response?.status || 500,
      };
    }
  }
}

export const apiClient = new ApiClient();