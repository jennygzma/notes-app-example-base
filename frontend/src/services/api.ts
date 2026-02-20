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
  PlannerFilters,
} from '../types';
import { AxiosResponse } from 'axios';

// ============================================================================
// NOTES API
// ============================================================================

export const notesApi = {
  getAll: (): Promise<AxiosResponse<Note[]>> => 
    apiClient.getRaw<Note[]>('/api/notes/'),
  
  create: (data: CreateNoteRequest): Promise<AxiosResponse<Note>> => 
    apiClient.postRaw<CreateNoteRequest, Note>('/api/notes/', data),
  
  getById: (id: string): Promise<AxiosResponse<Note>> => 
    apiClient.getRaw<Note>(`/api/notes/${id}/`),
  
  update: (id: string, data: UpdateNoteRequest): Promise<AxiosResponse<Note>> => 
    apiClient.putRaw<UpdateNoteRequest, Note>(`/api/notes/${id}/`, data),
  
  delete: (id: string): Promise<AxiosResponse<void>> => 
    apiClient.deleteRaw(`/api/notes/${id}/`),
  
  getLinks: (id: string): Promise<AxiosResponse<PlannerItem[]>> => 
    apiClient.getRaw<PlannerItem[]>(`/api/notes/${id}/links/`),
  
  markAnalyzed: (id: string): Promise<AxiosResponse<Note>> => 
    apiClient.patchRaw<{ is_analyzed: boolean }, Note>(`/api/notes/${id}/`, { is_analyzed: true }),
};

// ============================================================================
// PLANNER API
// ============================================================================

export const plannerApi = {
  getItems: (params?: PlannerFilters): Promise<AxiosResponse<PlannerItem[]>> => 
    apiClient.getRaw<PlannerItem[]>('/api/planner/items/', { params }),
  
  create: (data: CreatePlannerItemRequest): Promise<AxiosResponse<PlannerItem>> => 
    apiClient.postRaw<CreatePlannerItemRequest, PlannerItem>('/api/planner/items/', data),
  
  getById: (id: string): Promise<AxiosResponse<PlannerItem>> => 
    apiClient.getRaw<PlannerItem>(`/api/planner/items/${id}/`),
  
  update: (id: string, data: UpdatePlannerItemRequest): Promise<AxiosResponse<PlannerItem>> => 
    apiClient.putRaw<UpdatePlannerItemRequest, PlannerItem>(`/api/planner/items/${id}/`, data),
  
  delete: (id: string): Promise<AxiosResponse<void>> => 
    apiClient.deleteRaw(`/api/planner/items/${id}/`),
  
  toggleComplete: (id: string): Promise<AxiosResponse<PlannerItem>> => 
    apiClient.patchRaw<undefined, PlannerItem>(`/api/planner/items/${id}/complete/`),
  
  getLinks: (id: string): Promise<AxiosResponse<Note[]>> => 
    apiClient.getRaw<Note[]>(`/api/planner/items/${id}/links/`),
};

// ============================================================================
// INSPIRATIONS API
// ============================================================================

export const inspirationsApi = {
  getAll: (): Promise<AxiosResponse<InspirationsGrouped>> => 
    apiClient.getRaw<InspirationsGrouped>('/api/inspirations/'),
  
  getByNoteId: (noteId: string): Promise<AxiosResponse<Array<{ category: string; ai_confidence: number; inspiration_id: string }>>> => 
    apiClient.getRaw<Array<{ category: string; ai_confidence: number; inspiration_id: string }>>(`/api/inspirations/note/${noteId}/`),
  
  categorize: (noteId: string): Promise<AxiosResponse<CategorizeResponse>> => 
    apiClient.postRaw<{ note_id: string }, CategorizeResponse>('/api/inspirations/categorize/', { note_id: noteId }),
  
  getCategories: (): Promise<AxiosResponse<InspirationCategory[]>> => 
    apiClient.getRaw<InspirationCategory[]>('/api/inspirations/categories/'),
  
  getPendingCategories: (): Promise<AxiosResponse<InspirationCategory[]>> => 
    apiClient.getRaw<InspirationCategory[]>('/api/inspirations/categories/pending/'),
  
  approveCategory: (categoryId: string, noteId?: string): Promise<AxiosResponse<any>> => 
    apiClient.postRaw(`/api/inspirations/categories/${categoryId}/approve/`, { note_id: noteId }),
  
  rejectCategory: (categoryId: string): Promise<AxiosResponse<void>> => 
    apiClient.deleteRaw(`/api/inspirations/categories/${categoryId}/reject/`),
  
  deleteInspiration: (inspirationId: string): Promise<AxiosResponse<void>> => 
    apiClient.deleteRaw(`/api/inspirations/${inspirationId}/`),
};

// ============================================================================
// LINKS API
// ============================================================================

export const linksApi = {
  create: (noteId: string, plannerItemId: string): Promise<AxiosResponse<Link>> => 
    apiClient.postRaw<{ note_id: string; planner_item_id: string }, Link>('/api/links/', { 
      note_id: noteId, 
      planner_item_id: plannerItemId 
    }),
  
  delete: (id: string): Promise<AxiosResponse<void>> => 
    apiClient.deleteRaw(`/api/links/${id}/`),
};

// ============================================================================
// AI API
// ============================================================================

export const aiApi = {
  classify: (noteId: string): Promise<AxiosResponse<ClassifyResponse>> =>
    apiClient.postRaw<{ note_id: string }, ClassifyResponse>('/api/ai/classify/', { note_id: noteId }),
  
  translate: (noteId: string): Promise<AxiosResponse<TranslateResponse>> => 
    apiClient.postRaw<{ note_id: string }, TranslateResponse>('/api/ai/translate/', { note_id: noteId }),
};