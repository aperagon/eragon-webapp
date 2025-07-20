from typing import Dict, Any
from .salesforce_async_client import default_async_client
from .salesforce_client import default_client
from agno.tools import Toolkit
from agno.tools.decorator import tool
from py_markdown_table.markdown_table import markdown_table
from itertools import chain
from .hitl import salesforce_confirmation_hook, bulk_confirmation_hook
from .helper import salesforce_to_markdown

async def query_salesforce(query: str, format_data: bool = True) -> str:
    """
    Execute SOQL queries against Salesforce org to retrieve data.
    
    Args:
        query (str): The SOQL query to execute
        
    Returns:
        str: Query results in a formatted markdown table
    """
    # Validate query first
    validation = default_async_client.validate_query(query)
    if not validation["valid"]:
        return f"❌ Invalid query: {validation['error']}"
    
    # Execute the query
    result = await default_async_client.query(query)
    
    # Format the result using our new formatter
    if format_data:
        return salesforce_to_markdown(result)
    else:
        return result
    
def query_salesforce_sync(query: str, format_data: bool = True) -> str:
    """
    Execute SOQL queries against Salesforce org to retrieve data.
    
    Args:
        query (str): The SOQL query to execute
        
    Returns:
        str: Query results in a formatted markdown table
    """
    # Validate query first
    validation = default_client.validate_query(query)
    if not validation["valid"]:
        return f"❌ Invalid query: {validation['error']}"
    
    # Execute the query
    result = default_client.query(query)
    
    # Format the result using our new formatter
    if format_data:
        return salesforce_to_markdown(result)
    else:
        return result



@tool(tool_hooks=[salesforce_confirmation_hook])
async def update_salesforce_record(object_name: str, record_id: str, data: Dict[str, Any]) -> str:
    """
    Update an existing Salesforce record.
    
    Args:
        object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
        record_id (str): The ID of the record to update
        data (Dict[str, Any]): Dictionary of field names and values to update
        
    Returns:
        str: Update result in a formatted string
    """
    result = await default_async_client.update_record(object_name, record_id, data)
    
    if result.success:
        return f"✅ Successfully updated {object_name} record {record_id}"
    else:
        return f"❌ Failed to update {object_name} record {record_id}: {result.error}"
    
@tool(tool_hooks=[salesforce_confirmation_hook])
def update_salesforce_record_sync(object_name: str, record_id: str, data: Dict[str, Any]) -> str:
    """
    Update an existing Salesforce record.
    
    Args:
        object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
        record_id (str): The ID of the record to update
        data (Dict[str, Any]): Dictionary of field names and values to update
        
    Returns:
        str: Update result in a formatted string
    """
    result = default_client.update_record(object_name, record_id, data)
    
    if result.success:
        return f"✅ Successfully updated {object_name} record {record_id}"
    else:
        return f"❌ Failed to update {object_name} record {record_id}: {result.error}"


@tool(tool_hooks=[salesforce_confirmation_hook])
async def create_salesforce_record(object_name: str, data: Dict[str, Any]) -> str:
    """
    Create a new Salesforce record.
    
    Args:
        object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
        data (Dict[str, Any]): Dictionary of field names and values for the new record
        
    Returns:
        str: Creation result with the new record ID
    """
    result = await default_async_client.create_record(object_name, data)
    
    if result.success:
        return f"✅ Successfully created {object_name} record. ID: {result.data.get('id', 'Unknown')}"
    else:
        return f"❌ Failed to create {object_name} record: {result.error}"

@tool(tool_hooks=[salesforce_confirmation_hook])
def create_salesforce_record_sync(object_name: str, data: Dict[str, Any]) -> str:
    """
    Create a new Salesforce record.
    
    Args:
        object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
        data (Dict[str, Any]): Dictionary of field names and values for the new record
        
    Returns:
        str: Creation result with the new record ID
    """
    result = default_client.create_record(object_name, data)
    
    if result.success:
        return f"✅ Successfully created {object_name} record. ID: {result.data.get('id', 'Unknown')}"

@tool(tool_hooks=[salesforce_confirmation_hook])
async def delete_salesforce_record(object_name: str, record_id: str) -> str:
    """
    Delete a Salesforce record.
    
    Args:
        object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
        record_id (str): The ID of the record to delete
        
    Returns:
        str: Deletion result in a formatted string
    """
    result = await default_async_client.delete_record(object_name, record_id)
    
    if result.success:
        return f"✅ Successfully deleted {object_name} record {record_id}"
    else:
        return f"❌ Failed to delete {object_name} record {record_id}: {result.error}"
    
@tool(tool_hooks=[salesforce_confirmation_hook])
def delete_salesforce_record_sync(object_name: str, record_id: str) -> str:
    """
    Delete a Salesforce record.
    
    Args:
        object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
        record_id (str): The ID of the record to delete
        
    Returns:
        str: Deletion result in a formatted string
    """
    result = default_client.delete_record(object_name, record_id)
    
    if result.success:
        return f"✅ Successfully deleted {object_name} record {record_id}"
    else:
        return f"❌ Failed to delete {object_name} record {record_id}: {result.error}"


@tool(tool_hooks=[bulk_confirmation_hook])
async def bulk_update_salesforce_records(object_name: str, records: list[Dict[str, Any]]) -> str:
    """
    Bulk update multiple Salesforce records.
    
    Args:
        object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
        records (list[Dict[str, Any]]): List of dictionaries, each containing 'Id' and fields to update
        
    Returns:
        str: Bulk update results
    """
    result = await default_async_client.bulk_update(object_name, records)
    
    if result.success:
        successful = result.data.get('successful_count', 0)
        failed = result.data.get('failed_count', 0)
        return f"✅ Bulk update completed: {successful} succeeded, {failed} failed"
    else:
        return f"❌ Bulk update failed: {result.error}"


@tool(tool_hooks=[bulk_confirmation_hook])
async def bulk_create_salesforce_records(object_name: str, records: list[Dict[str, Any]]) -> str:
    """
    Bulk create multiple Salesforce records.
    
    Args:
        object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
        records (list[Dict[str, Any]]): List of dictionaries containing field values for new records
        
    Returns:
        str: Bulk creation results
    """
    result = await default_async_client.bulk_create(object_name, records)
    
    if result.success:
        successful = result.data.get('successful_count', 0)
        failed = result.data.get('failed_count', 0)
        return f"✅ Bulk create completed: {successful} succeeded, {failed} failed"
    else:
        return f"❌ Bulk create failed: {result.error}"


# Export available tools for the agent
SALESFORCE_TOOLS = [
    query_salesforce,
    update_salesforce_record,
    create_salesforce_record,
    delete_salesforce_record,
    bulk_update_salesforce_records,
    bulk_create_salesforce_records
] 