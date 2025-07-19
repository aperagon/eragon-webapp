"""Async repository layer managing database interactions with SQLAlchemy."""

from typing import Optional, List, Type, TypeVar
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from .models import Session, User
from models.db_models import SessionModel, UserModel

T = TypeVar('T')


class AsyncBaseRepository:
    """Base async repository with common CRUD operations."""
    
    def __init__(self, db_session: AsyncSession, model_class: Type[T], db_model_class: Type[T]):
        self.db_session = db_session
        self.model_class = model_class
        self.db_model_class = db_model_class
    
    async def _to_domain(self, db_obj):
        """Convert database model to domain model."""
        if not db_obj:
            return None
        return self.model_class(**db_obj.__dict__)
    
    async def _to_db(self, domain_obj):
        """Convert domain model to database model."""
        return self.db_model_class(**domain_obj.dict())
    
    async def save(self, obj: T) -> T:
        """Save or update an object."""
        # Check if object already exists
        existing = await self.db_session.execute(
            select(self.db_model_class).where(self.db_model_class.id == obj.id)
        )
        existing_obj = existing.scalar_one_or_none()
        
        if existing_obj:
            # Update existing object
            for key, value in obj.dict().items():
                if hasattr(existing_obj, key):
                    setattr(existing_obj, key, value)
            # Update the updated_date field
            if hasattr(existing_obj, 'updated_date'):
                existing_obj.updated_date = datetime.utcnow()
            db_obj = existing_obj
        else:
            # Create new object
            db_obj = await self._to_db(obj)
            self.db_session.add(db_obj)
        
        await self.db_session.commit()
        await self.db_session.refresh(db_obj)
        return await self._to_domain(db_obj)
    
    async def find_by_id(self, id: str) -> Optional[T]:
        """Find object by ID."""
        result = await self.db_session.execute(
            select(self.db_model_class).where(self.db_model_class.id == id)
        )
        db_obj = result.scalar_one_or_none()
        return await self._to_domain(db_obj)
    
    async def find_all(self) -> List[T]:
        """Find all objects."""
        result = await self.db_session.execute(select(self.db_model_class))
        db_objs = result.scalars().all()
        return [await self._to_domain(obj) for obj in db_objs]
    
    async def delete(self, id: str) -> bool:
        """Delete object by ID."""
        result = await self.db_session.execute(
            select(self.db_model_class).where(self.db_model_class.id == id)
        )
        db_obj = result.scalar_one_or_none()
        if db_obj:
            await self.db_session.delete(db_obj)
            await self.db_session.commit()
            return True
        return False


class AsyncSessionRepository(AsyncBaseRepository):
    """Repository for managing Session entities."""
    
    def __init__(self, db_session: AsyncSession):
        super().__init__(db_session, Session, SessionModel)


class AsyncUserRepository(AsyncBaseRepository):
    """Repository for managing User entities."""
    
    def __init__(self, db_session: AsyncSession):
        super().__init__(db_session, User, UserModel)