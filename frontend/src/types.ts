// ==================== Base Models ====================

export interface Note {
  id: string;
  title: string;
  body: string;
  is_inspiration: boolean;
  is_analyzed: boolean;
  folder_id: string | null;
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

export interface Folder {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface FolderWithCount extends Folder {
  note_count: number;
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

export interface CreateFolderRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface PlannerFilters {
  date_start?: string;
  date_end?: string;
  view_type?: string;
  status?: string;
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

export interface FoldersResponse {
  folders: FolderWithCount[];
  unorganized_count: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    reasoning?: ChatReasoning;
    citations?: string[];
    has_complete_answer?: boolean;
    confidence?: string;
  };
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatCitation {
  note_id: string;
  title: string;
  excerpt: string;
}

export interface ChatReasoning {
  folders_considered: Array<{ id: string; name: string }>;
  folders_selected: Array<{ id: string; name: string }>;
  folder_selection_reasoning: { [folder_id: string]: string };
  notes_searched: number;
  notes_cited: number;
}

export interface ChatResponse {
  answer: string;
  conversation_id: string;
  reasoning: ChatReasoning;
  citations: ChatCitation[];
  confidence: string;
  has_complete_answer: boolean;
}

export interface SendMessageRequest {
  message: string;
  conversation_id?: string;
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