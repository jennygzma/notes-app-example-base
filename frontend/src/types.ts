// ==================== Base Models ====================

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  note_count?: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  folder_id?: string | null;
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

export interface CreateNoteRequest {
  title: string;
  body?: string;
  folder_id?: string | null;
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

export interface PlannerFilters {
  date_start?: string;
  date_end?: string;
  view_type?: string;
  status?: string;
}

export interface ProposedFolder {
  name: string;
  description?: string;
  color?: string;
  note_ids: string[];
}

export interface ExistingFolderAssignment {
  folder_id: string;
  note_ids: string[];
}

export interface OrganizePreviewResponse {
  total_notes: number;
  batches_processed: number;
  proposed_folders: ProposedFolder[];
  existing_folder_assignments: ExistingFolderAssignment[];
  message?: string;
}

export interface OrganizePlan {
  proposed_folders: ProposedFolder[];
  existing_folder_assignments: ExistingFolderAssignment[];
}

export interface ApplyOrganizationResponse {
  folders_created: number;
  notes_organized: number;
  created_folders: Folder[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  reasoning?: ChatReasoning;
  citations?: ChatCitation[];
}

export interface ChatReasoning {
  folder_selection: string;
  selected_folder_ids: string[];
  folders_searched: Array<{ id: string; name: string }>;
  notes_searched: number;
}

export interface ChatCitation {
  note_id: string;
  note_title: string;
  excerpt: string;
}

export interface ChatResponse {
  answer: string;
  cited_note_ids: string[];
  confidence: number;
  has_sufficient_info: boolean;
  reasoning: ChatReasoning;
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