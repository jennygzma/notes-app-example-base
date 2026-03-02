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
  Folder,
  CreateFolderRequest,
  UpdateFolderRequest,
  DayActivities,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  SyncPreviewResponse,
  SyncResolution,
  SyncExecuteResponse,
} from '../types';

// ============================================================================
// NOTES API
// ============================================================================

export const notesApi = {
  getAll: (): Promise<Note[]> => 
    apiClient.get<Note[]>('/api/notes/'),
  
  create: (data: CreateNoteRequest): Promise<Note> => 
    apiClient.post<Note>('/api/notes/', data),
  
  getById: (id: string): Promise<Note> => 
    apiClient.get<Note>(`/api/notes/${id}/`),
  
  update: (id: string, data: UpdateNoteRequest): Promise<Note> => 
    apiClient.put<Note>(`/api/notes/${id}/`, data),
  
  delete: (id: string): Promise<void> => 
    apiClient.delete(`/api/notes/${id}/`),
  
  getLinks: (id: string): Promise<PlannerItem[]> => 
    apiClient.get<PlannerItem[]>(`/api/notes/${id}/links/`),
  
  markAnalyzed: (id: string): Promise<Note> => 
    apiClient.patch<Note>(`/api/notes/${id}/`, { is_analyzed: true }),
  
  organizePreview: (): Promise<any> => 
    apiClient.post<any>('/api/notes/organize/preview/', {}),
  
  organizeApply: (plan: any): Promise<any> => 
    apiClient.post<any>('/api/notes/organize/apply/', plan),
  
  bulkMove: (noteIds: string[], folderId: string | null): Promise<{ updated: number }> => 
    apiClient.post<{ updated: number }>('/api/notes/bulk-move/', { note_ids: noteIds, folder_id: folderId }),
  
  getActivityByDate: (date: string): Promise<DayActivities> => 
    apiClient.get<DayActivities>('/api/notes/activities/', { date }),
};

// ============================================================================
// PLANNER API
// ============================================================================

export const plannerApi = {
  getItems: (params?: PlannerFilters): Promise<PlannerItem[]> => 
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

// ============================================================================
// INSPIRATIONS API
// ============================================================================

export const inspirationsApi = {
  getAll: (): Promise<InspirationsGrouped> => 
    apiClient.get<InspirationsGrouped>('/api/inspirations/'),
  
  getByNoteId: (noteId: string): Promise<Array<{ category: string; ai_confidence: number; inspiration_id: string }>> => 
    apiClient.get<Array<{ category: string; ai_confidence: number; inspiration_id: string }>>(`/api/inspirations/note/${noteId}/`),
  
  categorize: (noteId: string): Promise<CategorizeResponse> => 
    apiClient.post<CategorizeResponse>('/api/inspirations/categorize/', { note_id: noteId }),
  
  getCategories: (): Promise<InspirationCategory[]> => 
    apiClient.get<InspirationCategory[]>('/api/inspirations/categories/'),
  
  getPendingCategories: (): Promise<InspirationCategory[]> => 
    apiClient.get<InspirationCategory[]>('/api/inspirations/categories/pending/'),
  
  approveCategory: (categoryId: string, noteId?: string): Promise<any> => 
    apiClient.post(`/api/inspirations/categories/${categoryId}/approve/`, { note_id: noteId }),
  
  rejectCategory: (categoryId: string): Promise<void> => 
    apiClient.delete(`/api/inspirations/categories/${categoryId}/reject/`),
  
  deleteInspiration: (inspirationId: string): Promise<void> => 
    apiClient.delete(`/api/inspirations/${inspirationId}/`),
};

// ============================================================================
// LINKS API
// ============================================================================

export const linksApi = {
  create: (noteId: string, plannerItemId: string): Promise<Link> => 
    apiClient.post<Link>('/api/links/', { 
      note_id: noteId, 
      planner_item_id: plannerItemId 
    }),
  
  delete: (id: string): Promise<void> => 
    apiClient.delete(`/api/links/${id}/`),
};

// ============================================================================
// AI API
// ============================================================================

export const aiApi = {
  classify: (noteId: string): Promise<ClassifyResponse> =>
    apiClient.post<ClassifyResponse>('/api/ai/classify/', { note_id: noteId }),
  
  translate: (noteId: string): Promise<TranslateResponse> => 
    apiClient.post<TranslateResponse>('/api/ai/translate/', { note_id: noteId }),
};

// ============================================================================
// FOLDERS API
// ============================================================================

export const foldersApi = {
  getAll: (): Promise<Folder[]> => 
    apiClient.get<Folder[]>('/api/folders/'),
  
  create: (data: CreateFolderRequest): Promise<Folder> => 
    apiClient.post<Folder>('/api/folders/', data),
  
  getById: (id: string): Promise<Folder> => 
    apiClient.get<Folder>(`/api/folders/${id}/`),
  
  update: (id: string, data: UpdateFolderRequest): Promise<Folder> => 
    apiClient.put<Folder>(`/api/folders/${id}/`, data),
  
  delete: (id: string): Promise<void> => 
    apiClient.delete(`/api/folders/${id}/`),
};

// ============================================================================
// CHAT API
// ============================================================================

export const chatApi = {
  sendMessage: (message: string, conversationId?: string): Promise<any> => 
    apiClient.post<any>('/api/chat/', { message, conversation_id: conversationId }),
  
  getConversations: (): Promise<any[]> => 
    apiClient.get<any[]>('/api/chat/conversations/'),
  
  getConversation: (id: string): Promise<any> => 
    apiClient.get<any>(`/api/chat/conversations/${id}/`),
  
  deleteConversation: (id: string): Promise<void> => 
    apiClient.delete(`/api/chat/conversations/${id}/`),
};

// ============================================================================
// TASKS API
// ============================================================================

export const taskApi = {
  getAll: (): Promise<Task[]> => 
    apiClient.get<{ tasks: Task[] }>('/api/tasks/').then(res => res.tasks),
  
  create: (data: CreateTaskRequest): Promise<Task> => 
    apiClient.post<Task>('/api/tasks/', data),
  
  update: (id: string, data: UpdateTaskRequest): Promise<Task> => 
    apiClient.put<Task>(`/api/tasks/${id}/`, data),
  
  delete: (id: string): Promise<void> => 
    apiClient.delete(`/api/tasks/${id}/`),
  
  syncPreview: (): Promise<SyncPreviewResponse> => 
    apiClient.get<SyncPreviewResponse>('/api/tasks/sync/preview/'),
  
  syncExecute: (resolutions: SyncResolution[]): Promise<SyncExecuteResponse> => 
    apiClient.post<SyncExecuteResponse>('/api/tasks/sync/execute/', { resolutions }),
  
  syncStatus: (): Promise<{ connected: boolean }> => 
    apiClient.get<{ connected: boolean }>('/api/tasks/sync/status/'),
};
