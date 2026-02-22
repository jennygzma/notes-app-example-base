import axios, { AxiosError, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config';
import { ErrorResponse } from '../types';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ErrorResponse>) => {
    // If the error has a response from the server, use that
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    
    // Otherwise create a generic error
    const genericError: ErrorResponse = {
      error: 'Network Error',
      details: error.message || 'An unexpected error occurred',
    };
    return Promise.reject(genericError);
  }
);

// Typed API client
export const apiClient = {
  // Original methods returning data directly
  get: <T>(url: string, params?: any): Promise<T> =>
    axiosInstance.get<T>(url, { params }).then((res) => res.data),

  post: <T>(url: string, data?: any): Promise<T> =>
    axiosInstance.post<T>(url, data).then((res) => res.data),

  put: <T>(url: string, data?: any): Promise<T> =>
    axiosInstance.put<T>(url, data).then((res) => res.data),

  patch: <T>(url: string, data?: any): Promise<T> =>
    axiosInstance.patch<T>(url, data).then((res) => res.data),

  delete: <T>(url: string): Promise<T> =>
    axiosInstance.delete<T>(url).then((res) => res.data),

  // Raw methods returning full AxiosResponse
  getRaw: <T>(url: string, config?: any): Promise<AxiosResponse<T>> =>
    axiosInstance.get<T>(url, config),

  postRaw: <D, T>(url: string, data?: D, config?: any): Promise<AxiosResponse<T>> =>
    axiosInstance.post<T>(url, data, config),

  putRaw: <D, T>(url: string, data?: D, config?: any): Promise<AxiosResponse<T>> =>
    axiosInstance.put<T>(url, data, config),

  patchRaw: <D, T>(url: string, data?: D, config?: any): Promise<AxiosResponse<T>> =>
    axiosInstance.patch<T>(url, data, config),

  deleteRaw: <T>(url: string, config?: any): Promise<AxiosResponse<T>> =>
    axiosInstance.delete<T>(url, config),
};
