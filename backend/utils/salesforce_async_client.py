import asyncio
import json
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from settings import SALESFORCE_ORG, SFDX_DIR


@dataclass
class SalesforceResult:
    """Data class to represent Salesforce command results"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    raw_output: Optional[str] = None


class AsyncSalesforceClient:
    """Async client for interacting with Salesforce CLI and executing SOQL queries"""
    
    def __init__(self, org: str = SALESFORCE_ORG, working_dir: str = SFDX_DIR):
        self.org = org
        self.working_dir = working_dir
    
    async def _run_command(self, command: str) -> SalesforceResult:
        """Execute a Salesforce CLI command asynchronously and return structured result"""
        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.working_dir
            )
            
            stdout, stderr = await proc.communicate()
            
            if proc.returncode == 0:
                output = stdout.decode().strip()
                return SalesforceResult(
                    success=True,
                    raw_output=output,
                    data=self._parse_output(output)
                )
            else:
                error = stderr.decode().strip()
                return SalesforceResult(
                    success=False,
                    error=error,
                    raw_output=error
                )
                
        except Exception as e:
            return SalesforceResult(
                success=False,
                error=str(e)
            )
    
    def _parse_output(self, output: str) -> Any:
        """Try to parse JSON output, return raw string if parsing fails"""
        try:
            return json.loads(output)
        except json.JSONDecodeError:
            return output
    
    async def query(self, soql: str, format_output: bool = True) -> SalesforceResult:
        """Execute a SOQL query against the Salesforce org"""
        # Escape quotes in the query
        escaped_query = soql.replace('"', '\\"')
        
        # Build command with JSON output for better parsing
        if format_output:
            command = f'sf data query --query "{escaped_query}" --target-org {self.org} --json'
        else:
            command = f'sf data query --query "{escaped_query}" --target-org {self.org}'
        
        result = await self._run_command(command)
        
        if result.success and format_output:
            # Extract records from JSON response
            try:
                json_data = result.data
                if isinstance(json_data, dict) and 'result' in json_data:
                    result.data = json_data['result'].get('records', [])
            except (KeyError, TypeError):
                pass
        
        return result
    
    async def describe_object(self, object_name: str) -> SalesforceResult:
        """Get metadata description for a Salesforce object"""
        command = f'sf sobject describe --sobject {object_name} --target-org {self.org} --json'
        return await self._run_command(command)
    
    async def list_objects(self) -> SalesforceResult:
        """List all available Salesforce objects"""
        command = f'sf sobject list --target-org {self.org} --json'
        return await self._run_command(command)
    
    async def get_org_info(self) -> SalesforceResult:
        """Get information about the current org"""
        command = f'sf org display --target-org {self.org} --json'
        return await self._run_command(command)
    
    async def create_record(self, object_name: str, data: Dict[str, Any]) -> SalesforceResult:
        """Create a new Salesforce record"""
        # Convert data to JSON
        json_data = json.dumps(data)
        escaped_json = json_data.replace('"', '\\"')
        
        command = f'sf data create record --sobject {object_name} --values "{escaped_json}" --target-org {self.org} --json'
        result = await self._run_command(command)
        
        if result.success and result.data:
            # Extract the created record ID
            try:
                if isinstance(result.data, dict) and 'result' in result.data:
                    result.data = {'id': result.data['result'].get('id')}
            except (KeyError, TypeError):
                pass
        
        return result
    
    async def update_record(self, object_name: str, record_id: str, data: Dict[str, Any]) -> SalesforceResult:
        """Update an existing Salesforce record"""
        # Convert data to JSON
        json_data = json.dumps(data)
        escaped_json = json_data.replace('"', '\\"')
        
        command = f'sf data update record --sobject {object_name} --record-id {record_id} --values "{escaped_json}" --target-org {self.org} --json'
        return await self._run_command(command)
    
    async def delete_record(self, object_name: str, record_id: str) -> SalesforceResult:
        """Delete a Salesforce record"""
        command = f'sf data delete record --sobject {object_name} --record-id {record_id} --target-org {self.org} --json'
        return await self._run_command(command)
    
    async def bulk_create(self, object_name: str, records: List[Dict[str, Any]]) -> SalesforceResult:
        """Bulk create multiple Salesforce records"""
        # For now, we'll implement this as sequential creates
        # In a production environment, you would use the Bulk API
        successful_count = 0
        failed_count = 0
        errors = []
        
        for record in records:
            result = await self.create_record(object_name, record)
            if result.success:
                successful_count += 1
            else:
                failed_count += 1
                errors.append(result.error)
        
        return SalesforceResult(
            success=failed_count == 0,
            data={
                'successful_count': successful_count,
                'failed_count': failed_count,
                'errors': errors
            },
            error='; '.join(errors) if errors else None
        )
    
    async def bulk_update(self, object_name: str, records: List[Dict[str, Any]]) -> SalesforceResult:
        """Bulk update multiple Salesforce records"""
        # For now, we'll implement this as sequential updates
        # In a production environment, you would use the Bulk API
        successful_count = 0
        failed_count = 0
        errors = []
        
        for record in records:
            if 'Id' not in record:
                failed_count += 1
                errors.append("Record missing 'Id' field")
                continue
            
            record_id = record.pop('Id')
            result = await self.update_record(object_name, record_id, record)
            if result.success:
                successful_count += 1
            else:
                failed_count += 1
                errors.append(result.error)
        
        return SalesforceResult(
            success=failed_count == 0,
            data={
                'successful_count': successful_count,
                'failed_count': failed_count,
                'errors': errors
            },
            error='; '.join(errors) if errors else None
        )
    
    def format_query_result(self, result: SalesforceResult) -> str:
        """Format query result for display"""
        if not result.success:
            return f"❌ Query failed: {result.error}"
        
        if not result.data:
            return "✅ Query executed successfully, but no data returned."
        
        if isinstance(result.data, list) and len(result.data) > 0:
            # Format as table-like structure
            records = result.data
            if len(records) == 1:
                return f"✅ Query returned 1 record:\n{self._format_records(records)}"
            else:
                return f"✅ Query returned {len(records)} records:\n{self._format_records(records)}"
        
        return f"✅ Query executed successfully:\n{result.raw_output}"
    
    def _format_records(self, records: List[Dict]) -> str:
        """Format records for display"""
        if not records:
            return "No records found."
        
        # Get all unique keys from all records
        all_keys = set()
        for record in records:
            all_keys.update(record.keys())
        
        # Remove system fields and attributes
        display_keys = [key for key in all_keys if not key.startswith('attributes')]
        
        # Format as simple table
        lines = []
        for i, record in enumerate(records, 1):
            lines.append(f"\n--- Record {i} ---")
            for key in display_keys:
                value = record.get(key, 'N/A')
                # Handle nested objects (like Account.Name)
                if isinstance(value, dict) and 'Name' in value:
                    value = value['Name']
                elif isinstance(value, dict):
                    value = str(value)
                lines.append(f"{key}: {value}")
        
        return "\n".join(lines)
    
    def validate_query(self, soql: str) -> Dict[str, Any]:
        """Validate SOQL query syntax"""
        # Basic validation
        soql_upper = soql.upper().strip()
        
        if not soql_upper.startswith('SELECT'):
            return {"valid": False, "error": "Query must start with SELECT"}
        
        if 'FROM' not in soql_upper:
            return {"valid": False, "error": "Query must contain FROM clause"}
        
        # Check for potentially dangerous operations
        dangerous_keywords = ['DELETE', 'UPDATE', 'INSERT', 'UPSERT', 'MERGE']
        for keyword in dangerous_keywords:
            if keyword in soql_upper:
                return {"valid": False, "error": f"Query contains potentially dangerous keyword: {keyword}"}
        
        return {"valid": True, "error": None}


# Create a default async client instance
default_async_client = AsyncSalesforceClient()