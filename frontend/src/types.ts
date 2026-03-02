// ==================== Base Models ====================

export interface NoteActivity {
  type: 'created' | 'updated' | 'moved';
  timestamp: string;
  details?: Record<string, any>;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  is_inspiration: boolean;
  is_analyzed: boolean;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  activity_history: NoteActivity[];
}

export interface DayActivities {
  date: string;
  created: Note[];
  updated: Note[];
  moved: Note[];
}

export interface Folder {
  id: string;
  name: string;
  description: string | null;
  color: string;
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

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  google_task_id: string | null;
  updated_at: string;
  last_synced_at: string | null;
}

export interface CreateTaskRequest {
  title: string;
  completed?: boolean;
  due_date?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  completed?: boolean;
  due_date?: string;
}

export interface SyncAction {
  action: 'create' | 'update' | 'delete';
  task: Task;
  source: 'local' | 'google';
  reason: string;
}

export interface SyncConflict {
  task_id: string;
  local_task: Task;
  google_task: Task;
  local_updated_at: string;
  google_updated_at: string;
}

export interface SyncPreviewResponse {
  actions: SyncAction[];
  conflicts: SyncConflict[];
  summary: { [key: string]: number };
}

export interface SyncResolution {
  task_id: string;
  resolution: 'use_local' | 'use_google' | 'skip';
}

export interface SyncExecuteResponse {
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: string[];
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