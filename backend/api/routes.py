from typing import List, Dict, Any, Optional
from uuid import uuid4
from datetime import datetime
import json

from fastapi import APIRouter, HTTPException, Query, Body
from fastapi.responses import StreamingResponse

from api.schemas import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    BaseResponse,
    UserResponse,
    UserUpdate,
    OpportunityResponse,
)
from utils.tools import query_salesforce
from agents.account_intel import get_account_intel
from agents.crm import get_crm_response
from database_async import get_async_db
from core.services_async import AsyncSessionService, AsyncUserService
from core.models import Session, User
from pydantic import BaseModel
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


# Request models
class CRMWorkflowRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class AccountIntelRequest(BaseModel):
    account: Optional[str] = None
    query: str
    session_id: Optional[str] = None

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _now():
    return datetime.utcnow()


def _serialize_session(sess: Session) -> SessionResponse:
    """Convert domain model to API schema."""
    return SessionResponse(**sess.dict())


# ---------------------------------------------------------------------------
# Session endpoints
# ---------------------------------------------------------------------------

@router.post("/sessions/", response_model=SessionResponse)
async def create_session(session: SessionCreate, db: AsyncSession = Depends(get_async_db)):
    try:
        session_service = AsyncSessionService(db)
        domain_session = Session(**session.model_dump())
        created_session = await session_service.create_session(domain_session)
        return SessionResponse(**created_session.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/", response_model=List[SessionResponse])
async def list_sessions(
    sort: str = Query("-updated_date", description="Sort order"),
    limit: int = Query(50, description="Number of results to return"),
    db: AsyncSession = Depends(get_async_db)
):
    try:
        session_service = AsyncSessionService(db)
        all_sessions = await session_service.repository.find_all()
        reverse = sort.startswith("-")
        sort_key = sort.lstrip("-")
        
        # Sort sessions
        if sort_key == "updated_date":
            sorted_sessions = sorted(all_sessions, key=lambda s: s.updated_date, reverse=reverse)
        else:
            sorted_sessions = sorted(all_sessions, key=lambda s: getattr(s, sort_key, _now()), reverse=reverse)
        
        return [_serialize_session(s) for s in sorted_sessions[:limit]]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/filter/", response_model=List[SessionResponse])
async def filter_sessions(id: Optional[str] = Query(None), db: AsyncSession = Depends(get_async_db)):
    try:
        session_service = AsyncSessionService(db)
        if id:
            sess = await session_service.get_session_by_id(id)
            if not sess:
                return []
            return [_serialize_session(sess)]
        all_sessions = await session_service.repository.find_all()
        return [_serialize_session(s) for s in all_sessions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_async_db)):
    session_service = AsyncSessionService(db)
    sess = await session_service.get_session_by_id(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return _serialize_session(sess)


@router.put("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(session_id: str, session: SessionUpdate, db: AsyncSession = Depends(get_async_db)):
    try:
        session_service = AsyncSessionService(db)
        updated = await session_service.update_session(session_id, session.model_dump(exclude_none=True))
        if not updated:
            raise HTTPException(status_code=404, detail="Session not found")
        return _serialize_session(updated)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}", response_model=BaseResponse)
async def delete_session(session_id: str, db: AsyncSession = Depends(get_async_db)):
    try:
        session_service = AsyncSessionService(db)
        deleted = await session_service.repository.delete(session_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Session not found")
        return BaseResponse(success=True, message="Session deleted successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Session Messages
# ---------------------------------------------------------------------------

class MessageSendRequest(BaseModel):
    content: str
    message_type: str = "user"
    metadata: Optional[Dict[str, Any]] = None

class MessageSendResponse(BaseResponse):
    message_id: str
    session_id: str
    message: Dict[str, Any]

@router.post("/sessions/{session_id}/messages", response_model=MessageSendResponse)
async def send_message_to_session(session_id: str, message: MessageSendRequest, db: AsyncSession = Depends(get_async_db)):
    session_service = AsyncSessionService(db)
    sess = await session_service.get_session_by_id(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    msg_id = sess.add_message(message.message_type, message.content, message.metadata)
    updated_session = await session_service.update_session(session_id, {"messages": sess.messages, "updated_date": _now()})
    
    msg_record = {
        "id": msg_id,
        "type": message.message_type,
        "content": message.content,
        "timestamp": _now().isoformat(),
        "metadata": message.metadata or {},
    }

    return MessageSendResponse(success=True, message_id=msg_id, session_id=session_id, message=msg_record)


@router.get("/sessions/{session_id}/messages", response_model=List[Dict[str, Any]])
async def get_session_messages(session_id: str, db: AsyncSession = Depends(get_async_db)):
    session_service = AsyncSessionService(db)
    sess = await session_service.get_session_by_id(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess.messages


# Share settings
@router.put("/sessions/{session_id}/share", response_model=SessionResponse)
async def update_session_share_settings(session_id: str, access_level: str = Body(..., embed=True), db: AsyncSession = Depends(get_async_db)):
    if access_level not in {"private", "public"}:
        raise HTTPException(status_code=400, detail="Invalid access level")
    
    session_service = AsyncSessionService(db)
    updated = await session_service.update_session(session_id, {"access_level": access_level, "updated_date": _now()})
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return _serialize_session(updated)


# ---------------------------------------------------------------------------
# Account intel & CRM – unchanged (they stream data)
# ---------------------------------------------------------------------------

@router.get("/accounts/names", response_model=List[str])
async def get_account_names():
    try:
        result = await query_salesforce("SELECT Name FROM Account", format_data=False)
        records = getattr(result, "data", [])
        return [rec.get("Name") for rec in records if "Name" in rec]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/opportunities/names", response_model=List[str])
async def get_opportunity_names():
    try:
        result = await query_salesforce("SELECT Name FROM Opportunity", format_data=False)
        records = getattr(result, "data", [])
        return [rec.get("Name") for rec in records if "Name" in rec]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/contacts/names", response_model=List[str])
async def get_contact_names():
    try:
        result = await query_salesforce("SELECT Name FROM Contact", format_data=False)
        records = getattr(result, "data", [])
        return [rec.get("Name") for rec in records if "Name" in rec]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/products/names", response_model=List[str])
async def get_product_names():
    try:
        result = await query_salesforce("SELECT Name FROM Product2", format_data=False)
        records = getattr(result, "data", [])
        return [rec.get("Name") for rec in records if "Name" in rec]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/leads/names", response_model=List[str])
async def get_lead_names():
    try:
        result = await query_salesforce("SELECT Name FROM Lead", format_data=False)
        records = getattr(result, "data", [])
        return [rec.get("Name") for rec in records if "Name" in rec]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accounts/intel")
async def account_intel(request: AccountIntelRequest):
    try:
        stream = get_account_intel(request.account, request.query, request.session_id)

        async def async_generator():
            async for item in stream:
                yield json.dumps(item) + "\n"

        return StreamingResponse(async_generator(), media_type="application/x-ndjson")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crm/workflow")
async def crm_workflow(request: CRMWorkflowRequest):
    try:
        stream = get_crm_response(request.query, request.session_id)

        async def async_generator():
            async for item in stream:
                yield json.dumps(item) + "\n"

        return StreamingResponse(async_generator(), media_type="application/x-ndjson")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Opportunities (stub)
# ---------------------------------------------------------------------------

@router.get("/opportunities/", response_model=List[OpportunityResponse])
async def list_opportunities():
    # Currently returns empty list – implementation left as exercise.
    return []


@router.get("/opportunities/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity(opportunity_id: str):
    raise HTTPException(status_code=404, detail="Opportunity not implemented")


# ---------------------------------------------------------------------------
# Users – using SQLite instead of in-memory storage
# ---------------------------------------------------------------------------
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"

async def _get_or_create_default_user(db: AsyncSession) -> User:
    """Get or create the default user."""
    user_service = AsyncUserService(db)
    user = await user_service.get_user_by_id(DEFAULT_USER_ID)
    if not user:
        user = User(
            id=DEFAULT_USER_ID,
            username="testuser",
            email="test@example.com",
            first_name="Test",
            last_name="User",
            created_date=_now(),
            updated_date=_now(),
        )
        user = await user_service.create_user(user)
    return user


@router.get("/users/me", response_model=UserResponse)
async def get_current_user(db: AsyncSession = Depends(get_async_db)):
    user = await _get_or_create_default_user(db)
    return UserResponse(**user.dict())


@router.put("/users/me", response_model=UserResponse)
async def update_current_user(user_update: UserUpdate, db: AsyncSession = Depends(get_async_db)):
    user_service = AsyncUserService(db)
    user = await _get_or_create_default_user(db)
    
    update_data = {}
    if user_update.email is not None:
        update_data["email"] = user_update.email
    if user_update.first_name is not None:
        update_data["first_name"] = user_update.first_name
    if user_update.last_name is not None:
        update_data["last_name"] = user_update.last_name
    
    if update_data:
        update_data["updated_date"] = _now()
        updated_user = await user_service.update_user(user.id, update_data)
        return UserResponse(**updated_user.dict())
    
    return UserResponse(**user.dict())


@router.post("/users/logout", response_model=BaseResponse)
async def logout_user():
    return BaseResponse(success=True, message="User logged out successfully") 