"""
Pydantic schemas for request validation and response serialization.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime


# ==================== Base Models ====================

class Note(BaseModel):
    """Note data model"""
    id: str
    title: str
    body: str
    is_inspiration: bool
    is_analyzed: bool
    created_at: str
    updated_at: str


class PlannerItem(BaseModel):
    """Planner item data model"""
    id: str
    title: str
    body: str
    date: str
    time: Optional[str] = None
    view_type: Literal['daily', 'weekly', 'monthly', 'yearly']
    status: Literal['pending', 'completed']
    created_at: str
    updated_at: str


class Inspiration(BaseModel):
    """Inspiration data model"""
    id: str
    note_id: str
    category: str
    ai_confidence: float = Field(ge=0.0, le=1.0)
    created_at: str


class Category(BaseModel):
    """Inspiration category data model"""
    id: str
    name: str
    status: Literal['active', 'pending_approval']
    discovered_by: Literal['user', 'ai']
    created_at: str


class Link(BaseModel):
    """Note-to-planner-item link data model"""
    id: str
    note_id: str
    planner_item_id: str
    created_at: str


# ==================== Request Schemas ====================

class CreateNoteRequest(BaseModel):
    """Request schema for creating a note"""
    title: str = Field(min_length=1, max_length=500)
    body: str = Field(default="")


class UpdateNoteRequest(BaseModel):
    """Request schema for updating a note"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    body: Optional[str] = None


class PatchNoteRequest(BaseModel):
    """Request schema for patching note fields"""
    is_analyzed: Optional[bool] = None
    is_inspiration: Optional[bool] = None


class CreatePlannerItemRequest(BaseModel):
    """Request schema for creating a planner item"""
    title: str = Field(min_length=1, max_length=500)
    body: str
    date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    view_type: Literal['daily', 'weekly', 'monthly', 'yearly']


class UpdatePlannerItemRequest(BaseModel):
    """Request schema for updating a planner item"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    body: Optional[str] = None
    date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    view_type: Optional[Literal['daily', 'weekly', 'monthly', 'yearly']] = None
    status: Optional[Literal['pending', 'completed']] = None


class CategorizeNoteRequest(BaseModel):
    """Request schema for categorizing a note"""
    note_id: str


class TranslateNoteRequest(BaseModel):
    """Request schema for translating a note to planner items"""
    note_id: str


class ClassifyNoteRequest(BaseModel):
    """Request schema for classifying a note"""
    note_id: str


class CreateLinkRequest(BaseModel):
    """Request schema for creating a note-planner link"""
    note_id: str
    planner_item_id: str


class ApproveCategoryRequest(BaseModel):
    """Request schema for approving a category"""
    note_id: Optional[str] = None


# ==================== Response Schemas ====================

class NoteResponse(Note):
    """Response schema for note"""
    pass


class NoteListResponse(BaseModel):
    """Response schema for list of notes"""
    notes: List[Note]


class PlannerItemResponse(PlannerItem):
    """Response schema for planner item"""
    pass


class PlannerItemListResponse(BaseModel):
    """Response schema for list of planner items"""
    items: List[PlannerItem]


class InspirationResponse(Inspiration):
    """Response schema for inspiration"""
    pass


class CategoryResponse(Category):
    """Response schema for category"""
    pass


class CategoryListResponse(BaseModel):
    """Response schema for list of categories"""
    categories: List[Category]


class LinkResponse(Link):
    """Response schema for link"""
    pass


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    details: Optional[str] = None


# ==================== AI Response Schemas ====================

class ClassifyResponse(BaseModel):
    """Response schema for note classification"""
    classification: Literal['inspiration', 'task']
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str


class TranslateSuggestion(BaseModel):
    """Single planner item suggestion"""
    title: str
    body: str
    date: str
    time: Optional[str] = None
    view_type: Literal['daily', 'weekly', 'monthly', 'yearly']


class TranslateResponse(BaseModel):
    """Response schema for note translation to planner items"""
    suggestions: List[TranslateSuggestion]


class CategorizeResponse(BaseModel):
    """Response schema for note categorization"""
    category: str
    confidence: float = Field(ge=0.0, le=1.0)
    is_new_category: bool
    category_id: Optional[str] = None
    inspiration_id: Optional[str] = None
    reasoning: Optional[str] = None
    status: Literal['created', 'pending_approval']


class ApproveCategoryResponse(BaseModel):
    """Response schema for approving a category"""
    category: Category
    inspiration: Optional[Inspiration] = None


# ==================== Grouped Response Schemas ====================

class NoteWithInspiration(Note):
    """Note with inspiration metadata"""
    inspiration_id: str
    ai_confidence: float


class InspirationsByCategory(BaseModel):
    """Grouped inspirations by category"""
    category: str
    notes: List[NoteWithInspiration]


class InspirationsGroupedResponse(BaseModel):
    """Response schema for grouped inspirations"""
    data: dict[str, List[NoteWithInspiration]]


class NoteInspirationsResponse(BaseModel):
    """Response schema for inspirations of a specific note"""
    inspirations: List[Inspiration]