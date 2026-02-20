// ============================================================================
// CORE ENTITY TYPES (Match Backend Schemas)
// ============================================================================

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

// ============================================================================
// REQUEST TYPES
// ============================================================================

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

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface CategorizeResponse {
  category: string;
  confidence: number;
  is_new_category: boolean;
  category_id?: string;
  inspiration_id?: string;
  reasoning?: string;
  status: 'created' | 'pending_approval';
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

export interface ClassifyResponse {
  classification: 'inspiration' | 'task';
  confidence: number;
  reasoning: string;
}

export interface ApproveCategoryResponse {
  category: InspirationCategory;
  inspiration?: Inspiration;
}

export interface InspirationsGrouped {
  [category: string]: Array<Note & { inspiration_id: string; ai_confidence: number }>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  error: string;
  details?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// API STATE UTILITY TYPES
// ============================================================================

export type ApiState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// Helper type for axios response wrapper
export interface AxiosApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// ============================================================================
// UTILITY TYPES FOR API OPERATIONS
// ============================================================================

export type AsyncApiResult<T> = Promise<ApiResponse<T>>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

// ============================================================================
// EXTENDED TYPES (For UI-specific use cases)
// ============================================================================

export interface NoteWithLinks extends Note {
  linked_planner_items?: PlannerItem[];
}

export interface PlannerItemWithLinks extends PlannerItem {
  linked_notes?: Note[];
}

export interface NoteWithInspiration extends Note {
  inspiration_id: string;
  ai_confidence: number;
  category?: string;
}

// ============================================================================
// FILTER/SORT TYPES
// ============================================================================

export interface PlannerFilters {
  date_start?: string;
  date_end?: string;
  view_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status?: 'pending' | 'completed';
}

export type NoteSortField = 'title' | 'created_at' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: NoteSortField;
  direction: SortDirection;
}