"""Async service layer managing domain business logic with SQLAlchemy."""

from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from .models import Session, User
from .repositories_async import AsyncSessionRepository, AsyncUserRepository


class AsyncUserService:
    """Async service class for managing users."""
    
    def __init__(self, db_session: AsyncSession):
        self.repository = AsyncUserRepository(db_session)
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Retrieve a user by ID."""
        return await self.repository.find_by_id(user_id)
    
    async def create_user(self, user: User) -> User:
        """Create a new user."""
        return await self.repository.save(user)
    
    async def update_user(self, user_id: str, data: Dict) -> Optional[User]:
        """Update an existing user."""
        user = await self.repository.find_by_id(user_id)
        if not user:
            return None
        for key, value in data.items():
            setattr(user, key, value)
        return await self.repository.save(user)


class AsyncSessionService:
    """Async service class for managing sessions."""
    
    def __init__(self, db_session: AsyncSession):
        self.repository = AsyncSessionRepository(db_session)
    
    async def get_session_by_id(self, session_id: str) -> Optional[Session]:
        """Retrieve a session by ID."""
        return await self.repository.find_by_id(session_id)
    
    async def create_session(self, session: Session) -> Session:
        """Create a new session."""
        return await self.repository.save(session)
    
    async def update_session(self, session_id: str, data: Dict) -> Optional[Session]:
        """Update an existing session."""
        session = await self.repository.find_by_id(session_id)
        if not session:
            return None
        for key, value in data.items():
            setattr(session, key, value)
        return await self.repository.save(session)
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        return await self.repository.delete(session_id)