export interface Folder {
  id: string;
  name: string;
  color?: string;
  created_at: string;
  note_count?: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  is_inspiration: boolean;
  is_analyzed: boolean;
  created_at: string;
  updated_at: string;
  folder_ids?: string[];
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
