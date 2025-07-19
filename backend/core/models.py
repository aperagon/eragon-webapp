"""Core domain models."""

from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class BaseEntity(BaseModel):
    """Base entity with common fields."""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_date: datetime = Field(default_factory=datetime.utcnow)
    updated_date: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        orm_mode = True


class User(BaseEntity):
    """User domain model."""
    
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username


class Session(BaseEntity):
    """Session domain model."""
    
    title: Optional[str] = None
    description: Optional[str] = None
    instruction: Optional[str] = None
    droid_type: str = "auto"
    status: str = "running"
    context_entity: Optional[str] = None
    is_pinned: bool = False
    access_level: str = "public"
    user_id: Optional[str] = None
    
    # Complex fields
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    artifacts: List[Dict[str, Any]] = Field(default_factory=list)
    event_history: List[Dict[str, Any]] = Field(default_factory=list)
    data: Dict[str, Any] = Field(default_factory=dict)
    
    def add_message(self, message_type: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Add a message to the session."""
        message_id = str(uuid4())
        message = {
            "id": message_id,
            "type": message_type,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        self.messages.append(message)
        self.updated_date = datetime.utcnow()
        return message_id
    
    def add_artifact(self, artifact_type: str, title: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Add an artifact to the session."""
        artifact_id = str(uuid4())
        artifact = {
            "id": artifact_id,
            "type": artifact_type,
            "title": title,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        self.artifacts.append(artifact)
        self.updated_date = datetime.utcnow()
        return artifact_id


class Account(BaseEntity):
    """Account domain model."""
    
    name: str
    industry: Optional[str] = None
    revenue: Optional[int] = None
    employees: Optional[int] = None
    website: Optional[str] = None
    description: Optional[str] = None
    
    # Location fields
    billing_street: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_postal_code: Optional[str] = None
    billing_country: Optional[str] = None
    
    # Additional fields
    phone: Optional[str] = None
    fax: Optional[str] = None
    account_type: Optional[str] = None
    account_source: Optional[str] = None
    rating: Optional[str] = None
    
    @property
    def billing_address(self) -> str:
        """Get formatted billing address."""
        parts = [
            self.billing_street,
            self.billing_city,
            self.billing_state,
            self.billing_postal_code,
            self.billing_country
        ]
        return ", ".join(part for part in parts if part)


class Opportunity(BaseEntity):
    """Opportunity domain model."""
    
    name: str
    account_id: str
    stage_name: str
    close_date: Optional[datetime] = None
    amount: Optional[float] = None
    probability: Optional[float] = None
    
    # Additional fields
    description: Optional[str] = None
    lead_source: Optional[str] = None
    opportunity_type: Optional[str] = None
    next_step: Optional[str] = None
    
    # Calculated fields
    expected_revenue: Optional[float] = None
    is_closed: bool = False
    is_won: bool = False
    
    @property
    def calculated_expected_revenue(self) -> Optional[float]:
        """Calculate expected revenue based on amount and probability."""
        if self.amount is not None and self.probability is not None:
            return self.amount * (self.probability / 100)
        return None


class Contact(BaseEntity):
    """Contact domain model."""
    
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    account_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    
    # Additional fields
    title: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    
    # Address fields
    mailing_street: Optional[str] = None
    mailing_city: Optional[str] = None
    mailing_state: Optional[str] = None
    mailing_postal_code: Optional[str] = None
    mailing_country: Optional[str] = None
    
    @property
    def name(self) -> str:
        """Get contact's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return "Unknown"
    
    @property
    def mailing_address(self) -> str:
        """Get formatted mailing address."""
        parts = [
            self.mailing_street,
            self.mailing_city,
            self.mailing_state,
            self.mailing_postal_code,
            self.mailing_country
        ]
        return ", ".join(part for part in parts if part)
