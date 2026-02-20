export interface Note {
  id: string;
  title: string;
  body: string;
  is_inspiration: boolean;
  is_analyzed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlannerItem {
  id: string;
  title: string;
  body: string;
  date: string;
  time: string | null;
  view_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Inspiration {
  id: string;
  note_id: string;
  category: string;
  ai_confidence: number;
  created_at: string;
}

export interface InspirationCategory {
  id: string;
  name: string;
  status: 'active' | 'pending_approval';
  discovered_by: 'user' | 'ai';
  created_at: string;
}

export interface Link {
  id: string;
  note_id: string;
  planner_item_id: string;
  created_at: string;
}

export interface CreateNoteRequest {
  title: string;
  body: string;
}

export interface UpdateNoteRequest {
  title?: string;
  body?: string;
  is_inspiration?: boolean;
  is_analyzed?: boolean;
}

export interface CreatePlannerItemRequest {
  title: string;
  body: string;
  date: string;
  time?: string;
  view_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface UpdatePlannerItemRequest {
  title?: string;
  body?: string;
  date?: string;
  time?: string;
  view_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status?: 'pending' | 'completed';
}

export interface CategorizeResponse {
  category: string;
  confidence: number;
  is_new_category: boolean;
  category_id?: string;
  inspiration_id?: string;
  reasoning?: string;
  status: 'created' | 'pending_approval';
}

export interface PlannerSuggestion {
  title: string;
  body: string;
  date: string;
  time: string | null;
  view_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface TranslateResponse {
  suggestions: PlannerSuggestion[];
}

export interface ClassifyResponse {
  classification: 'inspiration' | 'task';
  confidence: number;
  reasoning: string;
}

export interface InspirationsGrouped {
  [category: string]: Array<Note & { inspiration_id: string; ai_confidence: number }>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export type ApiResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: ApiError;
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  state: LoadingState;
  data: T | null;
  error: ApiError | null;
}