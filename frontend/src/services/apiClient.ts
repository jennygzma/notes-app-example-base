import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../config';
import { ApiError, ApiResponse } from '../types';

/**
 * Typed API Client
 * Wraps axios with proper type inference and consistent error handling
 */
class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Response interceptor for consistent error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: AxiosError<ApiError>): Promise<never> {
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        error: error.response.data?.error || 'An error occurred',
        details: error.response.data?.details || error.message,
      };
      return Promise.reject(apiError);
    } else if (error.request) {
      // Request made but no response received
      const apiError: ApiError = {
        error: 'Network error',
        details: 'No response received from server',
      };
      return Promise.reject(apiError);
    } else {
      // Error in request setup
      const apiError: ApiError = {
        error: 'Request error',
        details: error.message,
      };
      return Promise.reject(apiError);
    }
  }

  /**
   * Wrap response in ApiResponse type
   */
  private wrapResponse<T>(data: T): ApiResponse<T> {
    return { data };
  }

  /**
   * Wrap error in ApiResponse type
   */
  private wrapError(error: ApiError): ApiResponse<never> {
    return { error };
  }

  /**
   * GET request with type safety
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return this.wrapResponse(response.data);
    } catch (error) {
      return this.wrapError(error as ApiError);
    }
  }

  /**
   * POST request with type safety
   */
  async post<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<TResponse>> {
    try {
      const response: AxiosResponse<TResponse> = await this.client.post(url, data, config);
      return this.wrapResponse(response.data);
    } catch (error) {
      return this.wrapError(error as ApiError);
    }
  }

  /**
   * PUT request with type safety
   */
  async put<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<TResponse>> {
    try {
      const response: AxiosResponse<TResponse> = await this.client.put(url, data, config);
      return this.wrapResponse(response.data);
    } catch (error) {
      return this.wrapError(error as ApiError);
    }
  }

  /**
   * PATCH request with type safety
   */
  async patch<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<TResponse>> {
    try {
      const response: AxiosResponse<TResponse> = await this.client.patch(url, data, config);
      return this.wrapResponse(response.data);
    } catch (error) {
      return this.wrapError(error as ApiError);
    }
  }

  /**
   * DELETE request with type safety
   */
  async delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return this.wrapResponse(response.data);
    } catch (error) {
      return this.wrapError(error as ApiError);
    }
  }

  /**
   * GET request that returns raw axios response (for legacy compatibility)
   */
  getRaw<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  /**
   * POST request that returns raw axios response (for legacy compatibility)
   */
  postRaw<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<TResponse>> {
    return this.client.post(url, data, config);
  }

  /**
   * PUT request that returns raw axios response (for legacy compatibility)
   */
  putRaw<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<TResponse>> {
    return this.client.put(url, data, config);
  }

  /**
   * PATCH request that returns raw axios response (for legacy compatibility)
   */
  patchRaw<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<TResponse>> {
    return this.client.patch(url, data, config);
  }

  /**
   * DELETE request that returns raw axios response (for legacy compatibility)
   */
  deleteRaw(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<void>> {
    return this.client.delete(url, config);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export class for testing/mocking
export default ApiClient;