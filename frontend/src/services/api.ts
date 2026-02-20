import { apiClient } from './apiClient';
import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  PlannerItem,
  CreatePlannerItemRequest,
  UpdatePlannerItemRequest,
  InspirationCategory,
  CategorizeResponse,
  TranslateResponse,
  ClassifyResponse,
  InspirationsGrouped,
  Link,
  ApiResponse,
} from '../types';

export const notesApi = {
  getAll: async (): Promise<ApiResponse<Note[]>> => {
    return apiClient.get<Note[]>('/api/notes/');
  },
  
  create: async (data: CreateNoteRequest): Promise<ApiResponse<Note>> => {
    return apiClient.post<Note>('/api/notes/', data);
  },
  
  getById: async (id: string): Promise<ApiResponse<Note>> => {
    return apiClient.get<Note>(`/api/notes/${id}/`);
  },
  
  update: async (id: string, data: UpdateNoteRequest): Promise<ApiResponse<Note>> => {
    return apiClient.put<Note>(`/api/notes/${id}/`, data);
  },
  
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api/notes/${id}/`);
  },
  
  getLinks: async (id: string): Promise<ApiResponse<PlannerItem[]>> => {
    return apiClient.get<PlannerItem[]>(`/api/notes/${id}/links/`);
  },
  
  markAnalyzed: async (id: string): Promise<ApiResponse<Note>> => {
    return apiClient.patch<Note>(`/api/notes/${id}/`, { is_analyzed: true });
  },
};

export const plannerApi = {
  getItems: async (params?: {
    date_start?: string;
    date_end?: string;
    view_type?: string;
    status?: string;
  }): Promise<ApiResponse<PlannerItem[]>> => {
    return apiClient.get<PlannerItem[]>('/api/planner/items/', params);
  },
  
  create: async (data: CreatePlannerItemRequest): Promise<ApiResponse<PlannerItem>> => {
    return apiClient.post<PlannerItem>('/api/planner/items/', data);
  },
  
  getById: async (id: string): Promise<ApiResponse<PlannerItem>> => {
    return apiClient.get<PlannerItem>(`/api/planner/items/${id}/`);
  },
  
  update: async (id: string, data: UpdatePlannerItemRequest): Promise<ApiResponse<PlannerItem>> => {
    return apiClient.put<PlannerItem>(`/api/planner/items/${id}/`, data);
  },
  
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api/planner/items/${id}/`);
  },
  
  toggleComplete: async (id: string): Promise<ApiResponse<PlannerItem>> => {
    return apiClient.patch<PlannerItem>(`/api/planner/items/${id}/complete/`);
  },
  
  getLinks: async (id: string): Promise<ApiResponse<Note[]>> => {
    return apiClient.get<Note[]>(`/api/planner/items/${id}/links/`);
  },
};

export const inspirationsApi = {
  getAll: async (): Promise<ApiResponse<InspirationsGrouped>> => {
    return apiClient.get<InspirationsGrouped>('/api/inspirations/');
  },
  
  getByNoteId: async (noteId: string): Promise<ApiResponse<Array<{ category: string; ai_confidence: number; inspiration_id: string }>>> => {
    return apiClient.get(`/api/inspirations/note/${noteId}/`);
  },
  
  categorize: async (noteId: string): Promise<ApiResponse<CategorizeResponse>> => {
    return apiClient.post<CategorizeResponse>('/api/inspirations/categorize/', { note_id: noteId });
  },
  
  getCategories: async (): Promise<ApiResponse<InspirationCategory[]>> => {
    return apiClient.get<InspirationCategory[]>('/api/inspirations/categories/');
  },
  
  getPendingCategories: async (): Promise<ApiResponse<InspirationCategory[]>> => {
    return apiClient.get<InspirationCategory[]>('/api/inspirations/categories/pending/');
  },
  
  approveCategory: async (categoryId: string, noteId?: string): Promise<ApiResponse<any>> => {
    return apiClient.post(`/api/inspirations/categories/${categoryId}/approve/`, { note_id: noteId });
  },
  
  rejectCategory: async (categoryId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api/inspirations/categories/${categoryId}/reject/`);
  },
  
  deleteInspiration: async (inspirationId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api/inspirations/${inspirationId}/`);
  },
};

export const linksApi = {
  create: async (noteId: string, plannerItemId: string): Promise<ApiResponse<Link>> => {
    return apiClient.post<Link>('/api/links/', { note_id: noteId, planner_item_id: plannerItemId });
  },
  
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/api/links/${id}/`);
  },
};

export const aiApi = {
  classify: async (noteId: string): Promise<ApiResponse<ClassifyResponse>> => {
    return apiClient.post<ClassifyResponse>('/api/ai/classify/', { note_id: noteId });
  },
  
  translate: async (noteId: string): Promise<ApiResponse<TranslateResponse>> => {
    return apiClient.post<TranslateResponse>('/api/ai/translate/', { note_id: noteId });
  },
};