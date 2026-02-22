// ==================== Base Models ====================

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

// ==================== Request Types ====================

export interface CreateNoteRequest {
  title: string;
  body?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  body?: string;
}

export interface PatchNoteRequest {
  is_analyzed?: boolean;
  is_inspiration?: boolean;
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

export interface CategorizeNoteRequest {
  note_id: string;
}

export interface TranslateNoteRequest {
  note_id: string;
}

export interface ClassifyNoteRequest {
  note_id: string;
}

export interface CreateLinkRequest {
  note_id: string;
  planner_item_id: string;
}

export interface ApproveCategoryRequest {
  note_id?: string;
}

// ==================== Response Types ====================

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface ClassifyResponse {
  classification: 'inspiration' | 'task';
  confidence: number;
  reasoning: string;
}

export interface TranslateSuggestion {
  title: string;
  body: string;
  date: string;
  time: string | null;
  view_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface TranslateResponse {
  suggestions: TranslateSuggestion[];
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

export interface ApproveCategoryResponse {
  category: InspirationCategory;
  inspiration?: Inspiration;
}

// ==================== Grouped Response Types ====================

export interface NoteWithInspiration extends Note {
  inspiration_id: string;
  ai_confidence: number;
}

export interface InspirationsGrouped {
  [category: string]: NoteWithInspiration[];
}

// ==================== API Response Wrappers ====================

export interface ApiResponse<T> {
  data: T;
  error?: ErrorResponse;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ErrorResponse | null;
}