"""Database models using SQLAlchemy for ORM."""

from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class UserModel(Base):
    """User database model."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, unique=True, index=True)
    username = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("SessionModel", back_populates="user")


class SessionModel(Base):
    """Session database model."""
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, unique=True, index=True)
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    instruction = Column(String, nullable=True)
    droid_type = Column(String, default="auto")
    status = Column(String, default="running")
    context_entity = Column(String, nullable=True)
    is_pinned = Column(Boolean, default=False)
    access_level = Column(String, default="public")
    user_id = Column(String, ForeignKey("users.id"))
    user = relationship("UserModel", back_populates="sessions")
    messages = Column(JSON, default=list)
    timeline = Column(JSON, default=list)
    artifacts = Column(JSON, default=list)
    event_history = Column(JSON, default=list)
    data = Column(JSON, default=dict)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
