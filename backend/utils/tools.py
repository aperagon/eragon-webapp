from typing import Dict, Any
from .salesforce_async_client import default_async_client
from .salesforce_client import default_client
from agno.tools import Toolkit
from agno.tools.decorator import tool
from py_markdown_table.markdown_table import markdown_table
from itertools import chain
from .hitl import salesforce_confirmation_hook, bulk_confirmation_hook

def _flatten_dict(d: dict, prefix: str = "", sep: str = ".") -> dict:
    """
    Recursively flattens a nested dictionary.
    Example: {'a': {'b': 1}} → {'a.b': 1}
    """
    items = {}
    for k, v in d.items():
        new_key = f"{prefix}{sep}{k}" if prefix else k
        if isinstance(v, dict):
            items.update(_flatten_dict(v, new_key, sep))
        else:
            items[new_key] = v
    return items

def salesforce_to_markdown(result) -> str:
    """
    Convert Salesforce query results to a Markdown table.

    Parameters
    ----------
    result : SalesforceResult | list[dict]
        Either the SDK object holding `.data`, or a plain list of dictionaries.

    Returns
    -------
    str
        A Markdown-formatted table.
    """
    # 1. Extract list of records
    records = getattr(result, "data", result)

    if not records:
        return "*No records*"

    # 2. Flatten each record so nested keys become 'parent.child'
    flat_records = [_flatten_dict(rec) for rec in records]

    # 3. Determine column order: first record’s keys, then any new keys that appear later
    headers = list(dict.fromkeys(chain.from_iterable(r.keys() for r in flat_records)))

    # 4. Build the Markdown table
    header_row    = "| " + " | ".join(headers) + " |"
    separator_row = "| " + " | ".join(["---"] * len(headers)) + " |"

    data_rows = []
    for rec in flat_records:
        row = "| " + " | ".join("" if rec.get(col) is None else str(rec[col]) for col in headers) + " |"
        data_rows.append(row)

    return "\n".join([header_row, separator_row, *data_rows])


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
    bulk_create_salesforce_records,
    # get_salesforce_org_info,
    # describe_salesforce_object,
    # list_salesforce_objects
] 

class SalesforceTools(Toolkit):
    def __init__(self):
        tools = [
            self.query_salesforce,
            self.update_salesforce_record,
            self.create_salesforce_record,
            self.delete_salesforce_record,
            self.bulk_update_salesforce_records,
            self.bulk_create_salesforce_records,
            self.get_salesforce_org_info,
            self.describe_salesforce_object,
            self.list_salesforce_objects
        ]
        super().__init__(name="salesforce", tools=tools)

    def query_salesforce(self, query: str) -> str:
        """Execute SOQL queries against Salesforce org to retrieve data.
        
        Args:
            query (str): The SOQL query to execute
            
        Returns:
            str: Query results in a formatted string
        """
        return query_salesforce(query)

    def update_salesforce_record(self, object_name: str, record_id: str, data: Dict[str, Any]) -> str:
        """Update an existing Salesforce record.
        
        Args:
            object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
            record_id (str): The ID of the record to update
            data (Dict[str, Any]): Dictionary of field names and values to update
            
        Returns:
            str: Update result in a formatted string
        """
        return update_salesforce_record(object_name, record_id, data)

    def create_salesforce_record(self, object_name: str, data: Dict[str, Any]) -> str:
        """Create a new Salesforce record.
        
        Args:
            object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
            data (Dict[str, Any]): Dictionary of field names and values for the new record
            
        Returns:
            str: Creation result with the new record ID
        """
        return create_salesforce_record(object_name, data)

    def delete_salesforce_record(self, object_name: str, record_id: str) -> str:
        """Delete a Salesforce record.
        
        Args:
            object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
            record_id (str): The ID of the record to delete
            
        Returns:
            str: Deletion result in a formatted string
        """
        return delete_salesforce_record(object_name, record_id)

    def bulk_update_salesforce_records(self, object_name: str, records: list[Dict[str, Any]]) -> str:
        """Bulk update multiple Salesforce records.
        
        Args:
            object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
            records (list[Dict[str, Any]]): List of dictionaries, each containing 'Id' and fields to update
            
        Returns:
            str: Bulk update results
        """
        return bulk_update_salesforce_records(object_name, records)

    def bulk_create_salesforce_records(self, object_name: str, records: list[Dict[str, Any]]) -> str:
        """Bulk create multiple Salesforce records.
        
        Args:
            object_name (str): Name of the Salesforce object (e.g., 'Account', 'Contact')
            records (list[Dict[str, Any]]): List of dictionaries containing field values for new records
            
        Returns:
            str: Bulk creation results
        """
        return bulk_create_salesforce_records(object_name, records)

    def get_salesforce_org_info(self) -> str:
        """Get information about the current Salesforce org.
        
        Returns:
            str: Org information in a formatted string
        """
        return get_salesforce_org_info()

    def describe_salesforce_object(self, object_name: str) -> str:
        """Get metadata description for a Salesforce object.
        
        Args:
            object_name (str): Name of the Salesforce object to describe
            
        Returns:
            str: Object description in a formatted string
        """
        return describe_salesforce_object(object_name)

    def list_salesforce_objects(self) -> str:
        """List all available Salesforce objects in the org.
        
        Returns:
            str: List of objects in a formatted string
        """
        return list_salesforce_objects() 