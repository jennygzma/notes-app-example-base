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
}

export interface CreatePlannerItemRequest {
  title: string;
  body: string;
  date: string;
  time?: string;
  view_type: 'weekly' | 'monthly';
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

export interface TranslateResponse {
  suggestions: Array<{
    title: string;
    body: string;
    date: string;
    time: string | null;
    view_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }>;
}

export interface InspirationsGrouped {
  [category: string]: Array<Note & { inspiration_id: string; ai_confidence: number }>;
}

export type DateISO = string;

export interface ErrorResponse {
  error: string;
  details?: Array<{
    type: string;
    loc: Array<string | number>;
    msg: string;
    input: any;
  }>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ErrorResponse;
  status: number;
}

export type ApiState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ErrorResponse };

export interface UpdatePlannerItemRequest {
  title?: string;
  body?: string;
  date?: string;
  time?: string;
  view_type?: 'weekly' | 'monthly';
  status?: 'pending' | 'completed';
}

export interface CreateLinkRequest {
  note_id: string;
  planner_item_id: string;
}

export interface ClassifyResponse {
  is_inspiration: boolean;
  confidence: number;
  reasoning?: string;
}
