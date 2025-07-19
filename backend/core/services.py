"""Service layer managing domain business logic with SQLAlchemy."""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session as DBSession
from .models import Session, User
from .repositories import SessionRepository, UserRepository


class UserService:
    """Service class for managing users."""
    
    def __init__(self, db_session: DBSession):
        self.repository = UserRepository(db_session)
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Retrieve a user by ID."""
        return self.repository.find_by_id(user_id)
    
    def create_user(self, user: User) -> User:
        """Create a new user."""
        return self.repository.save(user)
    
    def update_user(self, user_id: str, data: Dict) -> Optional[User]:
        """Update an existing user."""
        user = self.repository.find_by_id(user_id)
        if not user:
            return None
        for key, value in data.items():
            setattr(user, key, value)
        return self.repository.save(user)


class SessionService:
    """Service class for managing sessions."""
    
    def __init__(self, db_session: DBSession):
        self.repository = SessionRepository(db_session)
    
    def get_session_by_id(self, session_id: str) -> Optional[Session]:
        """Retrieve a session by ID."""
        return self.repository.find_by_id(session_id)
    
    def create_session(self, session: Session) -> Session:
        """Create a new session."""
        return self.repository.save(session)
    
    def update_session(self, session_id: str, data: Dict) -> Optional[Session]:
        """Update an existing session."""
        session = self.repository.find_by_id(session_id)
        if not session:
            return None
        for key, value in data.items():
            setattr(session, key, value)
        return self.repository.save(session)
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        return self.repository.delete(session_id)
