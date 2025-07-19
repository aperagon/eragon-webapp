"""Database configuration module."""

from pydantic import BaseModel


class DatabaseConfig(BaseModel):
    """Database configuration with ORM settings."""
    
    DATABASE_URL: str = "sqlite:///./db.sqlite3"
    ECHO: bool = False
    POOL_SIZE: int = 5
    MAX_OVERFLOW: int = 10
    POOL_TIMEOUT: int = 30


# Global database config instance
database_config = DatabaseConfig()
