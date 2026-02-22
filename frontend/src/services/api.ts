import { apiClient } from './apiClient';
import { API_BASE_URL } from '../config';
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
  InspirationsGrouped,
  Link,
  CreateLinkRequest,
  ClassifyResponse,
  ApiResponse,
} from '../types';

export const notesApi = {
  getAll: (): Promise<ApiResponse<Note[]>> => 
    apiClient.get<Note[]>('/api/notes/'),
  
  create: (data: CreateNoteRequest): Promise<ApiResponse<Note>> => 
    apiClient.post<CreateNoteRequest, Note>('/api/notes/', data),
  
  getById: (id: string): Promise<ApiResponse<Note>> => 
    apiClient.get<Note>(`/api/notes/${id}/`),
  
  update: (id: string, data: UpdateNoteRequest): Promise<ApiResponse<Note>> => 
    apiClient.put<UpdateNoteRequest, Note>(`/api/notes/${id}/`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> => 
    apiClient.delete<void>(`/api/notes/${id}/`),
  
  getLinks: (id: string): Promise<ApiResponse<PlannerItem[]>> => 
    apiClient.get<PlannerItem[]>(`/api/notes/${id}/links/`),
  
  markAnalyzed: (id: string): Promise<ApiResponse<Note>> => 
    apiClient.patch<{ is_analyzed: boolean }, Note>(`/api/notes/${id}/`, { is_analyzed: true }),
};

export const plannerApi = {
  getItems: (params?: {
    date_start?: string;
    date_end?: string;
    view_type?: string;
    status?: string;
  }): Promise<ApiResponse<PlannerItem[]>> => {
    const queryString = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return apiClient.get<PlannerItem[]>(`/api/planner/items/${queryString}`);
  },
  
  create: (data: CreatePlannerItemRequest): Promise<ApiResponse<PlannerItem>> => 
    apiClient.post<CreatePlannerItemRequest, PlannerItem>('/api/planner/items/', data),
  
  getById: (id: string): Promise<ApiResponse<PlannerItem>> => 
    apiClient.get<PlannerItem>(`/api/planner/items/${id}/`),
  
  update: (id: string, data: UpdatePlannerItemRequest): Promise<ApiResponse<PlannerItem>> => 
    apiClient.put<UpdatePlannerItemRequest, PlannerItem>(`/api/planner/items/${id}/`, data),
  
  delete: (id: string): Promise<ApiResponse<void>> => 
    apiClient.delete<void>(`/api/planner/items/${id}/`),
  
  toggleComplete: (id: string): Promise<ApiResponse<PlannerItem>> => 
    apiClient.patch<{}, PlannerItem>(`/api/planner/items/${id}/complete/`, {}),
  
  getLinks: (id: string): Promise<ApiResponse<Note[]>> => 
    apiClient.get<Note[]>(`/api/planner/items/${id}/links/`),
};

export const inspirationsApi = {
  getAll: (): Promise<ApiResponse<InspirationsGrouped>> => 
    apiClient.get<InspirationsGrouped>('/api/inspirations/'),
  
  getByNoteId: (noteId: string): Promise<ApiResponse<Array<{ category: string; ai_confidence: number; inspiration_id: string }>>> => 
    apiClient.get<Array<{ category: string; ai_confidence: number; inspiration_id: string }>>(`/api/inspirations/note/${noteId}/`),
  
  categorize: (noteId: string): Promise<ApiResponse<CategorizeResponse>> => 
    apiClient.post<{ note_id: string }, CategorizeResponse>('/api/inspirations/categorize/', { note_id: noteId }),
  
  getCategories: (): Promise<ApiResponse<InspirationCategory[]>> => 
    apiClient.get<InspirationCategory[]>('/api/inspirations/categories/'),
  
  getPendingCategories: (): Promise<ApiResponse<InspirationCategory[]>> => 
    apiClient.get<InspirationCategory[]>('/api/inspirations/categories/pending/'),
  
  approveCategory: (categoryId: string, noteId?: string): Promise<ApiResponse<any>> => 
    apiClient.post<{ note_id?: string }, any>(`/api/inspirations/categories/${categoryId}/approve/`, { note_id: noteId }),
  
  rejectCategory: (categoryId: string): Promise<ApiResponse<void>> => 
    apiClient.delete<void>(`/api/inspirations/categories/${categoryId}/reject/`),
  
  deleteInspiration: (inspirationId: string): Promise<ApiResponse<void>> => 
    apiClient.delete<void>(`/api/inspirations/${inspirationId}/`),
};

export const linksApi = {
  create: (noteId: string, plannerItemId: string): Promise<ApiResponse<Link>> => 
    apiClient.post<CreateLinkRequest, Link>('/api/links/', { note_id: noteId, planner_item_id: plannerItemId }),
  
  delete: (id: string): Promise<ApiResponse<void>> => 
    apiClient.delete<void>(`/api/links/${id}/`),
};

export const aiApi = {
  classify: (noteId: string): Promise<ApiResponse<ClassifyResponse>> =>
    apiClient.post<{ note_id: string }, ClassifyResponse>('/api/ai/classify/', { note_id: noteId }),
  
  translate: (noteId: string): Promise<ApiResponse<TranslateResponse>> => 
    apiClient.post<{ note_id: string }, TranslateResponse>('/api/ai/translate/', { note_id: noteId }),
};