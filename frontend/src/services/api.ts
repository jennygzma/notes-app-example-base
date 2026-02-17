import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  PlannerItem,
  CreatePlannerItemRequest,
  InspirationCategory,
  CategorizeResponse,
  TranslateResponse,
  InspirationsGrouped,
  Link,
  Settings,
  Theme
} from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const notesApi = {
  getAll: () => api.get<Note[]>('/api/notes/'),
  
  create: (data: CreateNoteRequest) => api.post<Note>('/api/notes/', data),
  
  getById: (id: string) => api.get<Note>(`/api/notes/${id}/`),
  
  update: (id: string, data: UpdateNoteRequest) => api.put<Note>(`/api/notes/${id}/`, data),
  
  delete: (id: string) => api.delete(`/api/notes/${id}/`),
  
  getLinks: (id: string) => api.get<PlannerItem[]>(`/api/notes/${id}/links/`),
  
  markAnalyzed: (id: string) => api.patch<Note>(`/api/notes/${id}/`, { is_analyzed: true }),
};

export const plannerApi = {
  getItems: (params?: {
    date_start?: string;
    date_end?: string;
    view_type?: string;
    status?: string;
  }) => api.get<PlannerItem[]>('/api/planner/items/', { params }),
  
  create: (data: CreatePlannerItemRequest) => api.post<PlannerItem>('/api/planner/items/', data),
  
  getById: (id: string) => api.get<PlannerItem>(`/api/planner/items/${id}/`),
  
  update: (id: string, data: Partial<CreatePlannerItemRequest>) => 
    api.put<PlannerItem>(`/api/planner/items/${id}/`, data),
  
  delete: (id: string) => api.delete(`/api/planner/items/${id}/`),
  
  toggleComplete: (id: string) => api.patch<PlannerItem>(`/api/planner/items/${id}/complete/`),
  
  getLinks: (id: string) => api.get<Note[]>(`/api/planner/items/${id}/links/`),
};

export const inspirationsApi = {
  getAll: () => api.get<InspirationsGrouped>('/api/inspirations/'),
  
  getByNoteId: (noteId: string) => 
    api.get<Array<{ category: string; ai_confidence: number; inspiration_id: string }>>(`/api/inspirations/note/${noteId}/`),
  
  categorize: (noteId: string) => 
    api.post<CategorizeResponse>('/api/inspirations/categorize/', { note_id: noteId }),
  
  getCategories: () => api.get<InspirationCategory[]>('/api/inspirations/categories/'),
  
  getPendingCategories: () => api.get<InspirationCategory[]>('/api/inspirations/categories/pending/'),
  
  approveCategory: (categoryId: string, noteId?: string) => 
    api.post(`/api/inspirations/categories/${categoryId}/approve/`, { note_id: noteId }),
  
  rejectCategory: (categoryId: string) => api.delete(`/api/inspirations/categories/${categoryId}/reject/`),
  
  deleteInspiration: (inspirationId: string) => api.delete(`/api/inspirations/${inspirationId}/`),
};

export const linksApi = {
  create: (noteId: string, plannerItemId: string) => 
    api.post<Link>('/api/links/', { note_id: noteId, planner_item_id: plannerItemId }),
  
  delete: (id: string) => api.delete(`/api/links/${id}/`),
};

export const aiApi = {
  classify: (noteId: string) =>
    api.post<{ classification: 'inspiration' | 'task'; confidence: number; reasoning: string }>('/api/ai/classify/', { note_id: noteId }),
  
  translate: (noteId: string) => 
    api.post<TranslateResponse>('/api/ai/translate/', { note_id: noteId }),
};

export const settingsApi = {
  getSettings: () => api.get<Settings>('/api/settings/'),
  
  setActiveTheme: (themeId: string) => 
    api.put<Settings>('/api/settings/active/', { theme_id: themeId }),
  
  createTheme: (theme: Theme) => 
    api.post<{ theme_id: string }>('/api/settings/themes/', theme),
  
  updateTheme: (themeId: string, theme: Theme) => 
    api.put<Settings>(`/api/settings/themes/${themeId}/`, theme),
  
  deleteTheme: (themeId: string) => 
    api.delete(`/api/settings/themes/${themeId}/`),
  
  resetToDefault: () => 
    api.post<Settings>('/api/settings/reset/'),
};
