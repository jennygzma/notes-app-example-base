from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator


class RequestModel(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
        str_strip_whitespace=True,
        populate_by_name=True
    )


class ResponseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        validate_assignment=True
    )


ViewType = Literal['daily', 'weekly', 'monthly', 'yearly']
Status = Literal['pending', 'completed']
CategoryStatus = Literal['active', 'pending_approval']
DiscoveredBy = Literal['user', 'ai']


class CreateNoteRequest(RequestModel):
    title: str = Field(min_length=1)
    body: str = Field(default='')


class UpdateNoteRequest(RequestModel):
    title: Optional[str] = Field(None, min_length=1)
    body: Optional[str] = None
    is_inspiration: Optional[bool] = None
    is_analyzed: Optional[bool] = None


class CreatePlannerItemRequest(RequestModel):
    title: str = Field(min_length=1)
    body: str = Field(default='')
    date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: Optional[str] = None
    view_type: ViewType


class UpdatePlannerItemRequest(RequestModel):
    title: Optional[str] = Field(None, min_length=1)
    body: Optional[str] = None
    date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: Optional[str] = None
    view_type: Optional[ViewType] = None
    status: Optional[Status] = None


class CategorizeNoteRequest(RequestModel):
    note_id: str = Field(min_length=1)


class TranslateNoteRequest(RequestModel):
    note_id: str = Field(min_length=1)


class ClassifyNoteRequest(RequestModel):
    note_id: str = Field(min_length=1)


class CreateLinkRequest(RequestModel):
    note_id: str = Field(min_length=1)
    planner_item_id: str = Field(min_length=1)


class NoteResponse(ResponseModel):
    id: str
    title: str
    body: str
    is_inspiration: bool
    is_analyzed: bool
    created_at: str
    updated_at: str


class PlannerItemResponse(ResponseModel):
    id: str
    title: str
    body: str
    date: str
    time: Optional[str]
    view_type: ViewType
    status: Status
    created_at: str
    updated_at: str


class InspirationResponse(ResponseModel):
    id: str
    note_id: str
    category: str
    ai_confidence: float
    created_at: str


class CategoryResponse(ResponseModel):
    id: str
    name: str
    status: CategoryStatus
    discovered_by: DiscoveredBy
    created_at: str


class LinkResponse(ResponseModel):
    id: str
    note_id: str
    planner_item_id: str
    created_at: str


class ErrorResponse(ResponseModel):
    code: str
    message: str
    details: Optional[dict] = None


class CategorizeResponse(ResponseModel):
    category: str
    confidence: float
    is_new_category: bool
    category_id: Optional[str] = None
    inspiration_id: Optional[str] = None
    reasoning: Optional[str] = None
    status: Literal['created', 'pending_approval']


class PlannerSuggestion(ResponseModel):
    title: str
    body: str
    date: str
    time: Optional[str]
    view_type: ViewType


class TranslateResponse(ResponseModel):
    suggestions: List[PlannerSuggestion]


class ClassifyResponse(ResponseModel):
    classification: Literal['inspiration', 'task']
    confidence: float
    reasoning: str


class Note(ResponseModel):
    id: str
    title: str
    body: str
    is_inspiration: bool
    is_analyzed: bool
    created_at: str
    updated_at: str


class PlannerItem(ResponseModel):
    id: str
    title: str
    body: str
    date: str
    time: Optional[str]
    view_type: ViewType
    status: Status
    created_at: str
    updated_at: str


class Inspiration(ResponseModel):
    id: str
    note_id: str
    category: str
    ai_confidence: float
    created_at: str


class Category(ResponseModel):
    id: str
    name: str
    status: CategoryStatus
    discovered_by: DiscoveredBy
    created_at: str


class Link(ResponseModel):
    id: str
    note_id: str
    planner_item_id: str
    created_at: str