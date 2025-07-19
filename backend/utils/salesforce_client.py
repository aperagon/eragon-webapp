import subprocess
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


class SalesforceClient:
    """Client for interacting with Salesforce CLI and executing SOQL queries"""
    
    def __init__(self, org: str = SALESFORCE_ORG, working_dir: str = SFDX_DIR):
        self.org = org
        self.working_dir = working_dir
    
    def _run_command(self, command: str) -> SalesforceResult:
        """Execute a Salesforce CLI command and return structured result"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=self.working_dir,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                return SalesforceResult(
                    success=True,
                    raw_output=result.stdout.strip(),
                    data=self._parse_output(result.stdout.strip())
                )
            else:
                return SalesforceResult(
                    success=False,
                    error=result.stderr.strip(),
                    raw_output=result.stderr.strip()
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
    
    def query(self, soql: str, format_output: bool = True) -> SalesforceResult:
        """Execute a SOQL query against the Salesforce org"""
        # Escape quotes in the query
        escaped_query = soql.replace('"', '\\"')
        
        # Build command with JSON output for better parsing
        if format_output:
            command = f'sf data query --query "{escaped_query}" --target-org {self.org} --json'
        else:
            command = f'sf data query --query "{escaped_query}" --target-org {self.org}'
        
        result = self._run_command(command)
        
        if result.success and format_output:
            # Extract records from JSON response
            try:
                json_data = result.data
                if isinstance(json_data, dict) and 'result' in json_data:
                    result.data = json_data['result'].get('records', [])
            except (KeyError, TypeError):
                pass
        
        return result
    
    def describe_object(self, object_name: str) -> SalesforceResult:
        """Get metadata description for a Salesforce object"""
        command = f'sf sobject describe --sobject {object_name} --target-org {self.org} --json'
        return self._run_command(command)
    
    def list_objects(self) -> SalesforceResult:
        """List all available Salesforce objects"""
        command = f'sf sobject list --target-org {self.org} --json'
        return self._run_command(command)
    
    def get_org_info(self) -> SalesforceResult:
        """Get information about the current org"""
        command = f'sf org display --target-org {self.org} --json'
        return self._run_command(command)
    
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


# Create a default client instance
default_client = SalesforceClient() 