from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime


# ============================================================================
# DATA MODELS (Internal Types)
# ============================================================================

class Note(BaseModel):
    id: str
    title: str
    body: str
    is_inspiration: bool = False
    is_analyzed: bool = False
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PlannerItem(BaseModel):
    id: str
    title: str
    body: str
    date: str
    time: Optional[str] = None
    view_type: Literal['daily', 'weekly', 'monthly', 'yearly']
    status: Literal['pending', 'completed'] = 'pending'
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class Inspiration(BaseModel):
    id: str
    note_id: str
    category: str
    ai_confidence: float = Field(..., ge=0.0, le=1.0)
    created_at: str

    class Config:
        from_attributes = True


class Category(BaseModel):
    id: str
    name: str
    status: Literal['active', 'pending_approval']
    discovered_by: Literal['user', 'ai']
    created_at: str

    class Config:
        from_attributes = True


class Link(BaseModel):
    id: str
    note_id: str
    planner_item_id: str
    created_at: str

    class Config:
        from_attributes = True


# ============================================================================
# REQUEST SCHEMAS (Input Validation)
# ============================================================================

class CreateNoteRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    body: str = Field(default="")


class UpdateNoteRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    body: Optional[str] = None
    is_inspiration: Optional[bool] = None
    is_analyzed: Optional[bool] = None


class CreatePlannerItemRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    body: str
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    view_type: Literal['daily', 'weekly', 'monthly', 'yearly']


class UpdatePlannerItemRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    body: Optional[str] = None
    date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    view_type: Optional[Literal['daily', 'weekly', 'monthly', 'yearly']] = None
    status: Optional[Literal['pending', 'completed']] = None


class CategorizeNoteRequest(BaseModel):
    note_id: str


class TranslateNoteRequest(BaseModel):
    note_id: str


class ClassifyNoteRequest(BaseModel):
    note_id: str


class CreateLinkRequest(BaseModel):
    note_id: str
    planner_item_id: str


# ============================================================================
# RESPONSE SCHEMAS (Output Serialization)
# ============================================================================

class NoteResponse(BaseModel):
    id: str
    title: str
    body: str
    is_inspiration: bool
    is_analyzed: bool
    created_at: str
    updated_at: str


class PlannerItemResponse(BaseModel):
    id: str
    title: str
    body: str
    date: str
    time: Optional[str]
    view_type: str
    status: str
    created_at: str
    updated_at: str


class InspirationResponse(BaseModel):
    id: str
    note_id: str
    category: str
    ai_confidence: float
    created_at: str


class CategoryResponse(BaseModel):
    id: str
    name: str
    status: str
    discovered_by: str
    created_at: str


class LinkResponse(BaseModel):
    id: str
    note_id: str
    planner_item_id: str
    created_at: str


class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None


class CategorizeResponse(BaseModel):
    category: str
    confidence: float
    is_new_category: bool
    category_id: Optional[str] = None
    inspiration_id: Optional[str] = None
    reasoning: Optional[str] = None
    status: Literal['created', 'pending_approval']


class TranslateSuggestion(BaseModel):
    title: str
    body: str
    date: str
    time: Optional[str]
    view_type: Literal['daily', 'weekly', 'monthly', 'yearly']


class TranslateResponse(BaseModel):
    suggestions: List[TranslateSuggestion]


class ClassifyResponse(BaseModel):
    classification: Literal['inspiration', 'task']
    confidence: float
    reasoning: str


class ApproveCategoryResponse(BaseModel):
    category: CategoryResponse
    inspiration: Optional[InspirationResponse] = None


# ============================================================================
# EXTENDED RESPONSE SCHEMAS (With Nested Data)
# ============================================================================

class NoteWithInspirationDetails(NoteResponse):
    inspiration_id: str
    ai_confidence: float