from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


# Base schemas
class BaseResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None


# Message schemas
class ConversationMessage(BaseModel):
    message_type: str = Field(..., description="Type of message: user, assistant, system")
    content: str
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime


class TimelineStep(BaseModel):
    step: str
    status: str = Field(..., description="Status: running, completed, failed, needs_input")
    timestamp: datetime
    tool_calls: Optional[List[Dict[str, Any]]] = None


class Artifact(BaseModel):
    type: str = Field(..., description="Type of artifact: brief, table, email, chart, file")
    title: str
    content: str
    metadata: Optional[Dict[str, Any]] = None


# Session schemas
class SessionBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instruction: Optional[str] = None
    droid_type: Optional[str] = Field(default="auto", description="Type of AI assistant")
    status: Optional[str] = Field(default="running", description="Session status")
    context_entity: Optional[str] = None
    is_pinned: Optional[bool] = False
    access_level: Optional[str] = Field(default="public", description="Access level: private or public")
    messages: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    timeline: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    artifacts: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    event_history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    data: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    """Update schema without defaults to avoid overwriting existing values"""
    title: Optional[str] = None
    description: Optional[str] = None
    instruction: Optional[str] = None
    droid_type: Optional[str] = None
    status: Optional[str] = None
    context_entity: Optional[str] = None
    is_pinned: Optional[bool] = None
    access_level: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None
    timeline: Optional[List[Dict[str, Any]]] = None
    artifacts: Optional[List[Dict[str, Any]]] = None
    event_history: Optional[List[Dict[str, Any]]] = None
    data: Optional[Dict[str, Any]] = None


class SessionResponse(SessionBase):
    id: str
    user_id: Optional[str] = None
    created_date: datetime
    updated_date: datetime

    class Config:
        from_attributes = True


# Account schemas
class AccountBase(BaseModel):
    name: str
    industry: Optional[str] = None
    revenue: Optional[int] = None
    employees: Optional[int] = None


class AccountResponse(AccountBase):
    id: str
    created_date: datetime
    updated_date: datetime

    class Config:
        from_attributes = True


# Opportunity schemas
class OpportunityBase(BaseModel):
    name: str
    amount: Optional[Decimal] = None
    stage: Optional[str] = None
    close_date: Optional[datetime] = None
    account_id: str


class OpportunityResponse(OpportunityBase):
    id: str
    created_date: datetime
    updated_date: datetime

    class Config:
        from_attributes = True


# User schemas
class UserBase(BaseModel):
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserResponse(UserBase):
    id: str
    created_date: datetime
    updated_date: datetime

    class Config:
        from_attributes = True


# Integration schemas
class LLMInvokeRequest(BaseModel):
    prompt: str
    response_json_schema: Optional[Dict[str, Any]] = None
    model: Optional[str] = None
    temperature: Optional[float] = None


class LLMInvokeResponse(BaseModel):
    success: bool
    response: Any
    used_model: Optional[str] = None
    error: Optional[str] = None


class EmailSendRequest(BaseModel):
    to: str
    subject: str
    body: str
    from_email: Optional[str] = None


class EmailSendResponse(BaseModel):
    success: bool
    message_id: Optional[str] = None
    status: Optional[str] = None
    recipient: Optional[str] = None
    subject: Optional[str] = None
    error: Optional[str] = None


class FileUploadResponse(BaseModel):
    success: bool
    file_id: Optional[str] = None
    filename: Optional[str] = None
    size: Optional[int] = None
    url: Optional[str] = None
    error: Optional[str] = None 