# __init__.py for backend.utils package
"""Common utility modules for the backend.

This package contains shared utility modules including tools, HITL hooks, and the
Salesforce client.
"""

# Direct imports from local modules
from .tools import query_salesforce, create_salesforce_record, update_salesforce_record, delete_salesforce_record, query_salesforce_sync, create_salesforce_record_sync, update_salesforce_record_sync, delete_salesforce_record_sync

# Re-export for convenience
__all__ = [
    "query_salesforce",
    "create_salesforce_record", 
    "update_salesforce_record",
    "delete_salesforce_record",
    "query_salesforce_sync",
    "create_salesforce_record_sync",
    "update_salesforce_record_sync",
    "delete_salesforce_record_sync"
] 