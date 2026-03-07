from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Literal, Dict
from datetime import datetime


# ==================== Base Models ====================

class NoteActivity(BaseModel):
    type: Literal['created', 'updated', 'moved']
    timestamp: str
    details: Optional[dict] = {}


class Note(BaseModel):
    id: str
    title: str
    body: str
    is_inspiration: bool
    is_analyzed: bool
    folder_id: Optional[str] = None
    created_at: str
    updated_at: str
    activity_history: List[NoteActivity] = []


class NoteVersion(BaseModel):
    id: str
    note_id: str
    version_number: int
    title: str
    body: str
    created_at: str


class Folder(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#808080"
    created_at: str
    updated_at: str


class PlannerItem(BaseModel):
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
    id: str
    note_id: str
    category: str
    ai_confidence: float = Field(ge=0.0, le=1.0)
    created_at: str


class Category(BaseModel):
    id: str
    name: str
    status: Literal['active', 'pending_approval']
    discovered_by: Literal['user', 'ai']
    created_at: str


class Link(BaseModel):
    id: str
    note_id: str
    planner_item_id: str
    created_at: str


class ConversationMessage(BaseModel):
    role: Literal['user', 'assistant']
    content: str
    timestamp: str
    metadata: Optional[dict] = None


class Conversation(BaseModel):
    id: str
    messages: List[ConversationMessage]
    created_at: str
    updated_at: str


# ==================== Request Schemas ====================

class StrictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CreateNoteRequest(StrictRequest):
    title: str = Field(min_length=1, max_length=500)
    body: str = Field(default="")


class UpdateNoteRequest(StrictRequest):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    body: Optional[str] = None


class PatchNoteRequest(StrictRequest):
    is_analyzed: Optional[bool] = None
    is_inspiration: Optional[bool] = None


class CreatePlannerItemRequest(StrictRequest):
    title: str = Field(min_length=1, max_length=500)
    body: str
    date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    view_type: Literal['daily', 'weekly', 'monthly', 'yearly']


class UpdatePlannerItemRequest(StrictRequest):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    body: Optional[str] = None
    date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    time: Optional[str] = Field(None, pattern=r'^\d{2}:\d{2}$')
    view_type: Optional[Literal['daily', 'weekly', 'monthly', 'yearly']] = None
    status: Optional[Literal['pending', 'completed']] = None


class CategorizeNoteRequest(StrictRequest):
    note_id: str


class TranslateNoteRequest(StrictRequest):
    note_id: str


class ClassifyNoteRequest(StrictRequest):
    note_id: str


class CreateLinkRequest(StrictRequest):
    note_id: str
    planner_item_id: str


class ApproveCategoryRequest(StrictRequest):
    note_id: Optional[str] = None


class CreateFolderRequest(StrictRequest):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    color: Optional[str] = "#808080"


class UpdateFolderRequest(StrictRequest):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    color: Optional[str] = None


class ChatMessageRequest(StrictRequest):
    message: str = Field(min_length=1, max_length=5000)
    conversation_id: Optional[str] = None


class OrganizationFolderPlan(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    note_ids: List[str] = []


class OrganizationAssignmentPlan(BaseModel):
    folder_id: str
    note_ids: List[str] = []


class OrganizationPlanRequest(StrictRequest):
    new_folders: List[OrganizationFolderPlan] = []
    existing_assignments: List[OrganizationAssignmentPlan] = []


class BulkMoveRequest(StrictRequest):
    note_ids: List[str]
    folder_id: Optional[str] = None


class Task(BaseModel):
    id: str
    title: str
    completed: bool
    due_date: Optional[str] = None
    google_task_id: Optional[str] = None
    updated_at: str
    last_synced_at: Optional[str] = None


class CreateTaskRequest(StrictRequest):
    title: str = Field(min_length=1, max_length=500)
    completed: bool = False
    due_date: Optional[str] = None


class UpdateTaskRequest(StrictRequest):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    completed: Optional[bool] = None
    due_date: Optional[str] = None


class SyncAction(BaseModel):
    action: Literal['create', 'update', 'delete']
    task: Task
    source: Literal['local', 'google']
    reason: str


class SyncConflict(BaseModel):
    task_id: str
    local_task: Task
    google_task: Task
    local_updated_at: str
    google_updated_at: str


class SyncPreviewResponse(BaseModel):
    actions: List['SyncAction']
    conflicts: List['SyncConflict']
    summary: Dict[str, int]


class SyncResolution(BaseModel):
    task_id: str
    resolution: Literal['use_local', 'use_google', 'skip']


class SyncExecuteRequest(StrictRequest):
    resolutions: List[SyncResolution]


class SyncExecuteResponse(BaseModel):
    created: int
    updated: int
    deleted: int
    skipped: int
    errors: List[str]


# ==================== Response Schemas ====================

class NoteResponse(Note):
    pass


class NoteListResponse(BaseModel):
    notes: List[Note]


class NoteVersionResponse(NoteVersion):
    pass


class NoteVersionListResponse(BaseModel):
    items: List[NoteVersion]


class SearchResult(BaseModel):
    id: str
    note_id: str
    title: str
    body: str
    is_version_history: bool
    version_number: Optional[int] = None
    created_at: str


class SearchResultsResponse(BaseModel):
    items: List[SearchResult]


class DiffChunk(BaseModel):
    type: Literal['unchanged', 'added', 'removed']
    content: str
    paragraph_index: int


class DiffResponse(BaseModel):
    items: List[DiffChunk]


class RevertRequest(StrictRequest):
    version_id: str
    paragraph_indices: Optional[List[int]] = None


class PlannerItemResponse(PlannerItem):
    pass


class PlannerItemListResponse(BaseModel):
    items: List[PlannerItem]


class InspirationResponse(Inspiration):
    pass


class CategoryResponse(Category):
    pass


class CategoryListResponse(BaseModel):
    categories: List[Category]


class LinkResponse(Link):
    pass


class TaskResponse(Task):
    pass


class TaskListResponse(BaseModel):
    tasks: List[Task]


class FolderListResponse(BaseModel):
    folders: List[Folder]


class ConversationListResponse(BaseModel):
    conversations: List[Conversation]

class NoteActivitiesResponse(BaseModel):
    date: str
    created: List[Note]
    updated: List[Note]
    moved: List[Note]


class OrganizationPreviewResponse(BaseModel):
    message: Optional[str] = None
    new_folders: List[OrganizationFolderPlan] = []
    existing_assignments: List[OrganizationAssignmentPlan] = []


class OrganizationApplyResponse(BaseModel):
    created_folders: int
    updated_notes: int
    folders: List[Folder]


class BulkMoveResponse(BaseModel):
    updated: int


class ChatReasoning(BaseModel):
    folders_considered: int
    folders_selected: int
    notes_searched: int
    notes_cited: int


class ChatResponse(BaseModel):
    answer: str
    conversation_id: str
    reasoning: ChatReasoning
    citations: List[dict]
    confidence: float


class InspirationByNoteEntry(BaseModel):
    category: str
    ai_confidence: float
    inspiration_id: str


class InspirationByNoteResponse(BaseModel):
    inspirations: List[InspirationByNoteEntry]


class SyncStatusResponse(BaseModel):
    connected: bool


class OAuthResponse(BaseModel):
    access_token: str
    expires_at: str


class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None


# ==================== AI Response Schemas ====================

class ClassifyResponse(BaseModel):
    classification: Literal['inspiration', 'task']
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str


class TranslateSuggestion(BaseModel):
    title: str
    body: str
    date: str
    time: Optional[str] = None
    view_type: Literal['daily', 'weekly', 'monthly', 'yearly']


class TranslateResponse(BaseModel):
    suggestions: List[TranslateSuggestion]


class CategorizeResponse(BaseModel):
    category: str
    confidence: float = Field(ge=0.0, le=1.0)
    is_new_category: bool
    category_id: Optional[str] = None
    inspiration_id: Optional[str] = None
    reasoning: Optional[str] = None
    status: Literal['created', 'pending_approval']


class ApproveCategoryResponse(BaseModel):
    category: Category
    inspiration: Optional[Inspiration] = None


# ==================== Grouped Response Schemas ====================

class NoteWithInspiration(Note):
    inspiration_id: str
    ai_confidence: float


class InspirationsByCategory(BaseModel):
    category: str
    notes: List[NoteWithInspiration]


class InspirationsGroupedResponse(BaseModel):
    data: dict[str, List[NoteWithInspiration]]


class NoteInspirationsResponse(BaseModel):
    inspirations: List[Inspiration]
