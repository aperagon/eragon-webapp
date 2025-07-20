from typing import Dict, Any, List, Optional, Union, Tuple
import json
from datetime import datetime
import re
from itertools import chain
import ast

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


def filter_salesforce_data_for_prompt(
    salesforce_result: Union[Dict[str, Any], Any],
    max_records: int = 10,  
    exclude_columns: List[str] = None,
    priority_columns: List[str] = None,
    sampling_strategy: str = "first"
) -> Dict[str, Any]:
    """
    Filter and sample Salesforce data for AI prompt consumption.
    Reduces data size while preserving structure and key information.
    
    Args:
        salesforce_result: Salesforce query result
        max_records: Maximum number of records to include
        max_columns: Maximum number of columns to include
        exclude_columns: List of columns to exclude (case-insensitive)
        priority_columns: List of columns to prioritize (case-insensitive)
        sampling_strategy: How to sample records ('first', 'last', 'random', 'distributed')
        
    Returns:
        Dict with filtered records and metadata
    """
    
    # Default exclusions for common verbose/irrelevant fields
    default_exclusions = [
        'attributes', 'systemmodstamp', 'createdbyid', 'lastmodifiedbyid',
        'isdeleted', 'lastactivitydate', 'lastreferenceddate', 'lastvieweddate'
    ]
    
    exclude_columns = exclude_columns or []
    exclude_columns.extend(default_exclusions)
    exclude_columns = [col.lower() for col in exclude_columns]
    
    # Extract and validate records
    records = _extract_records(salesforce_result)
    if not records:
        return {"records": [], "metadata": {"total_records": 0, "message": "No records found"}}
    
    # Get and filter columns
    all_columns = _get_all_columns(records)
    filtered_columns = _filter_columns(
        all_columns, exclude_columns, priority_columns
    )
    
    # Sample records
    sampled_records = _sample_records(records, max_records, sampling_strategy)
    
    # Filter records to only include selected columns
    filtered_records = []
    for record in sampled_records:
        filtered_record = {col: record.get(col) for col in filtered_columns}
        filtered_records.append(filtered_record)
    
    # Create metadata
    metadata = {
        "total_records": len(records),
        "sampled_records": len(filtered_records),
        "total_columns": len(all_columns),
        "filtered_columns": len(filtered_columns),
        "excluded_columns": len(all_columns) - len(filtered_columns),
        "sampling_strategy": sampling_strategy,
        "columns_included": filtered_columns,
        "columns_excluded": [col for col in all_columns if col not in filtered_columns]
    }
    
    return {
        "records": filtered_records,
        "metadata": metadata
    }


# Helper functions
def _extract_records(salesforce_result: Union[Dict[str, Any], Any]) -> List[Dict[str, Any]]:
    """Extract records list from various Salesforce result formats."""
    
    # Handle SalesforceResult object (has .data attribute)
    if hasattr(salesforce_result, 'data'):
        records = salesforce_result.data
    # Handle dict with 'data' key
    elif isinstance(salesforce_result, dict) and 'data' in salesforce_result:
        records = salesforce_result['data']
    # Handle dict with 'records' key (from raw API response)
    elif isinstance(salesforce_result, dict) and 'records' in salesforce_result:
        records = salesforce_result['records']
    # Handle direct list of records
    elif isinstance(salesforce_result, list):
        records = salesforce_result
    # Handle nested structure (like in your example)
    elif isinstance(salesforce_result, dict) and 'result' in salesforce_result:
        result = salesforce_result['result']
        if isinstance(result, dict) and 'records' in result:
            records = result['records']
        else:
            records = []
    else:
        records = []
    
    return records if isinstance(records, list) else []


def _get_all_columns(records: List[Dict[str, Any]]) -> List[str]:
    """Get all unique column names from records, excluding 'attributes'."""
    
    columns = set()
    for record in records:
        if isinstance(record, dict):
            columns.update(record.keys())
    
    # Remove 'attributes' and sort
    columns.discard('attributes')
    return sorted(list(columns))


def _filter_columns(
    all_columns: List[str], 
    exclude_columns: List[str], 
    priority_columns: List[str], 
) -> List[str]:
    """Filter and prioritize columns."""
    
    # Convert to lowercase for comparison
    exclude_lower = [col.lower() for col in exclude_columns]
    priority_lower = [col.lower() for col in (priority_columns or [])]
    
    # Filter out excluded columns
    filtered = [col for col in all_columns if col.lower() not in exclude_lower]
    
    # Prioritize columns
    if priority_columns:
        priority_actual = [col for col in filtered if col.lower() in priority_lower]
        other_cols = [col for col in filtered if col.lower() not in priority_lower]
        filtered = priority_actual + other_cols
    
    # Limit to max_columns
    return filtered


def _sample_records(records: List[Dict], max_records: int, strategy: str) -> List[Dict]:
    """Sample records according to strategy."""
    
    if len(records) <= max_records:
        return records
    
    if strategy == "first":
        return records[:max_records]
    elif strategy == "last":
        return records[-max_records:]
    elif strategy == "distributed":
        # Take records evenly distributed across the dataset
        step = len(records) // max_records
        indices = [i * step for i in range(max_records)]
        return [records[i] for i in indices]
    elif strategy == "random":
        import random
        return random.sample(records, max_records)
    else:
        return records[:max_records]
    

def parse_chart_result(result: str) -> Tuple[str, str]:
    """
    Safely parse the result from query_salesforce_and_chart tool.
    The result is a string representation of a tuple (chart_html, salesforce_data).
    
    Args:
        result: String representation of the tuple result
        
    Returns:
        Tuple[str, str]: (chart_html, salesforce_data)
    """
    try:
        # First, try to use ast.literal_eval to safely parse the tuple
        parsed_result = ast.literal_eval(result)
        if isinstance(parsed_result, tuple) and len(parsed_result) == 2:
            return parsed_result[0], parsed_result[1]
    except (ValueError, SyntaxError):
        pass
    
    # If ast.literal_eval fails, try regex-based parsing
    try:
        # Look for the pattern: (chart_html, salesforce_data)
        # This is a simplified approach - we'll look for the first and second elements
        match = re.match(r'\((.*?),\s*(.*)\)', result, re.DOTALL)
        if match:
            chart_html = match.group(1).strip()
            salesforce_data = match.group(2).strip()
            return chart_html, salesforce_data
    except Exception:
        pass
    
    # If all parsing fails, return the original result as both values
    return result, result