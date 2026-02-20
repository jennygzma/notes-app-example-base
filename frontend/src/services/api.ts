import { apiClient } from './apiClient';
import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  PatchNoteRequest,
  PlannerItem,
  CreatePlannerItemRequest,
  UpdatePlannerItemRequest,
  InspirationCategory,
  CategorizeResponse,
  TranslateResponse,
  ClassifyResponse,
  InspirationsGrouped,
  Link,
  Inspiration,
  ApproveCategoryResponse,
} from '../types';

/**
 * Notes API
 */
export const notesApi = {
  getAll: (): Promise<Note[]> => 
    apiClient.get<Note[]>('/api/notes/'),
  
  create: (data: CreateNoteRequest): Promise<Note> => 
    apiClient.post<Note>('/api/notes/', data),
  
  getById: (id: string): Promise<Note> => 
    apiClient.get<Note>(`/api/notes/${id}/`),
  
  update: (id: string, data: UpdateNoteRequest): Promise<Note> => 
    apiClient.put<Note>(`/api/notes/${id}/`, data),
  
  patch: (id: string, data: PatchNoteRequest): Promise<Note> => 
    apiClient.patch<Note>(`/api/notes/${id}/`, data),
  
  delete: (id: string): Promise<void> => 
    apiClient.delete(`/api/notes/${id}/`),
  
  getLinks: (id: string): Promise<PlannerItem[]> => 
    apiClient.get<PlannerItem[]>(`/api/notes/${id}/links/`),
  
  markAnalyzed: (id: string): Promise<Note> => 
    apiClient.patch<Note>(`/api/notes/${id}/`, { is_analyzed: true }),
};

/**
 * Planner API
 */
export const plannerApi = {
  getItems: (params?: {
    date_start?: string;
    date_end?: string;
    view_type?: string;
    status?: string;
  }): Promise<PlannerItem[]> => 
    apiClient.get<PlannerItem[]>('/api/planner/items/', params),
  
  create: (data: CreatePlannerItemRequest): Promise<PlannerItem> => 
    apiClient.post<PlannerItem>('/api/planner/items/', data),
  
  getById: (id: string): Promise<PlannerItem> => 
    apiClient.get<PlannerItem>(`/api/planner/items/${id}/`),
  
  update: (id: string, data: UpdatePlannerItemRequest): Promise<PlannerItem> => 
    apiClient.put<PlannerItem>(`/api/planner/items/${id}/`, data),
  
  delete: (id: string): Promise<void> => 
    apiClient.delete(`/api/planner/items/${id}/`),
  
  toggleComplete: (id: string): Promise<PlannerItem> => 
    apiClient.patch<PlannerItem>(`/api/planner/items/${id}/complete/`),
  
  getLinks: (id: string): Promise<Note[]> => 
    apiClient.get<Note[]>(`/api/planner/items/${id}/links/`),
};

/**
 * Inspirations API
 */
export const inspirationsApi = {
  getAll: (): Promise<InspirationsGrouped> => 
    apiClient.get<InspirationsGrouped>('/api/inspirations/'),
  
  getByNoteId: (noteId: string): Promise<Inspiration[]> => 
    apiClient.get<Inspiration[]>(`/api/inspirations/note/${noteId}/`),
  
  categorize: (noteId: string): Promise<CategorizeResponse> => 
    apiClient.post<CategorizeResponse>('/api/inspirations/categorize/', { note_id: noteId }),
  
  getCategories: (): Promise<InspirationCategory[]> => 
    apiClient.get<InspirationCategory[]>('/api/inspirations/categories/'),
  
  getPendingCategories: (): Promise<InspirationCategory[]> => 
    apiClient.get<InspirationCategory[]>('/api/inspirations/categories/pending/'),
  
  approveCategory: (categoryId: string, noteId?: string): Promise<ApproveCategoryResponse> => 
    apiClient.post<ApproveCategoryResponse>(
      `/api/inspirations/categories/${categoryId}/approve/`, 
      { note_id: noteId }
    ),
  
  rejectCategory: (categoryId: string): Promise<void> => 
    apiClient.delete(`/api/inspirations/categories/${categoryId}/reject/`),
  
  deleteInspiration: (inspirationId: string): Promise<void> => 
    apiClient.delete(`/api/inspirations/${inspirationId}/`),
};

/**
 * Links API
 */
export const linksApi = {
  create: (noteId: string, plannerItemId: string): Promise<Link> => 
    apiClient.post<Link>('/api/links/', { 
      note_id: noteId, 
      planner_item_id: plannerItemId 
    }),
  
  delete: (id: string): Promise<void> => 
    apiClient.delete(`/api/links/${id}/`),
};

/**
 * AI API
 */
export const aiApi = {
  classify: (noteId: string): Promise<ClassifyResponse> =>
    apiClient.post<ClassifyResponse>('/api/ai/classify/', { note_id: noteId }),
  
  translate: (noteId: string): Promise<TranslateResponse> => 
    apiClient.post<TranslateResponse>('/api/ai/translate/', { note_id: noteId }),
};