"""Repository layer for data access abstraction using SQLAlchemy."""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session as DBSession
from datetime import datetime
from uuid import uuid4

# Import domain models
from .models import Session, User

# Import database models
from models.db_models import SessionModel, UserModel


class BaseRepository(ABC):
    """Base repository interface."""
    
    def __init__(self, db_session: DBSession):
        self.db = db_session
    
    @abstractmethod
    def find_by_id(self, entity_id: str) -> Optional[Any]:
        """Find an entity by ID."""
        pass
    
    @abstractmethod
    def find_all(self) -> List[Any]:
        """Find all entities."""
        pass
    
    @abstractmethod
    def save(self, entity: Any) -> Any:
        """Save an entity."""
        pass
    
    @abstractmethod
    def delete(self, entity_id: str) -> bool:
        """Delete an entity by ID."""
        pass


class SessionRepository(BaseRepository):
    """Repository for Session entities."""
    
    def find_by_id(self, session_id: str) -> Optional[Session]:
        """Find a session by ID."""
        db_session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if db_session:
            return self._to_domain_model(db_session)
        return None
    
    def find_all(self) -> List[Session]:
        """Find all sessions."""
        db_sessions = self.db.query(SessionModel).all()
        return [self._to_domain_model(db_session) for db_session in db_sessions]
    
    def save(self, session: Session) -> Session:
        """Save a session."""
        db_session = self.db.query(SessionModel).filter(SessionModel.id == session.id).first()
        
        if db_session:
            # Update existing session
            for field, value in session.dict().items():
                if hasattr(db_session, field):
                    setattr(db_session, field, value)
            db_session.updated_date = datetime.utcnow()
        else:
            # Create new session
            db_session = SessionModel(**session.dict())
            self.db.add(db_session)
        
        self.db.commit()
        self.db.refresh(db_session)
        return self._to_domain_model(db_session)
    
    def delete(self, session_id: str) -> bool:
        """Delete a session by ID."""
        db_session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if db_session:
            self.db.delete(db_session)
            self.db.commit()
            return True
        return False
    
    def _to_domain_model(self, db_session: SessionModel) -> Session:
        """Convert database model to domain model."""
        return Session(
            id=db_session.id,
            title=db_session.title,
            description=db_session.description,
            instruction=db_session.instruction,
            droid_type=db_session.droid_type,
            status=db_session.status,
            context_entity=db_session.context_entity,
            is_pinned=db_session.is_pinned,
            access_level=db_session.access_level,
            user_id=db_session.user_id,
            created_date=db_session.created_date,
            updated_date=db_session.updated_date,
            messages=db_session.messages or [],
            timeline=db_session.timeline or [],
            artifacts=db_session.artifacts or [],
            event_history=db_session.event_history or [],
            data=db_session.data or {}
        )


class UserRepository(BaseRepository):
    """Repository for User entities."""
    
    def find_by_id(self, user_id: str) -> Optional[User]:
        """Find a user by ID."""
        db_user = self.db.query(UserModel).filter(UserModel.id == user_id).first()
        if db_user:
            return self._to_domain_model(db_user)
        return None
    
    def find_all(self) -> List[User]:
        """Find all users."""
        db_users = self.db.query(UserModel).all()
        return [self._to_domain_model(db_user) for db_user in db_users]
    
    def save(self, user: User) -> User:
        """Save a user."""
        db_user = self.db.query(UserModel).filter(UserModel.id == user.id).first()
        
        if db_user:
            # Update existing user
            for field, value in user.dict().items():
                if hasattr(db_user, field):
                    setattr(db_user, field, value)
            db_user.updated_date = datetime.utcnow()
        else:
            # Create new user
            db_user = UserModel(**user.dict())
            self.db.add(db_user)
        
        self.db.commit()
        self.db.refresh(db_user)
        return self._to_domain_model(db_user)
    
    def delete(self, user_id: str) -> bool:
        """Delete a user by ID."""
        db_user = self.db.query(UserModel).filter(UserModel.id == user_id).first()
        if db_user:
            self.db.delete(db_user)
            self.db.commit()
            return True
        return False
    
    def _to_domain_model(self, db_user: UserModel) -> User:
        """Convert database model to domain model."""
        return User(
            id=db_user.id,
            username=db_user.username,
            email=db_user.email,
            first_name=db_user.first_name,
            last_name=db_user.last_name,
            is_active=db_user.is_active,
            created_date=db_user.created_date,
            updated_date=db_user.updated_date
        )