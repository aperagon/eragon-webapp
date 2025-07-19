"""
Human-In-The-Loop (HITL) confirmation hooks for Salesforce operations.
Provides user confirmation before executing sensitive operations.
"""
from typing import Any, Dict
from rich.console import Console
from rich.prompt import Prompt
from rich.table import Table
from rich.panel import Panel
from agno.exceptions import StopAgentRun
import json

console = Console()


def salesforce_confirmation_hook(function_name: str, function_call: callable, arguments: Dict[str, Any]) -> Any:
    """
    Confirmation hook for Salesforce operations.
    Prompts user for confirmation before executing create, update, or delete operations.
    
    Args:
        function_name: Name of the function being called
        function_call: The actual function to call
        arguments: Arguments passed to the function
        
    Returns:
        Result of the function call if confirmed
        
    Raises:
        StopAgentRun: If user cancels the operation
    """
    # Stop live display for clean prompt
    live = console._live if hasattr(console, '_live') else None
    if live:
        live.stop()
    
    try:
        # Determine operation type and format display
        operation_type = None
        object_name = arguments.get('object_name', 'Unknown')
        
        if 'create' in function_name.lower():
            operation_type = "CREATE"
            operation_color = "green"
        elif 'update' in function_name.lower():
            operation_type = "UPDATE"
            operation_color = "yellow"
        elif 'delete' in function_name.lower():
            operation_type = "DELETE"
            operation_color = "red"
        else:
            # For unknown operations, proceed without confirmation
            return function_call(**arguments)
        
        # Create confirmation display
        console.print("\n" + "="*60, style="bright_blue")
        console.print(f"🔔 CONFIRMATION REQUIRED", style="bold bright_white")
        console.print("="*60 + "\n", style="bright_blue")
        
        # Operation details panel
        operation_text = f"[{operation_color}]{operation_type}[/{operation_color}] operation on [{operation_color}]{object_name}[/{operation_color}]"
        console.print(Panel(operation_text, title="Operation", border_style=operation_color))
        
        # Display operation details based on type
        if operation_type == "CREATE":
            data = arguments.get('data', {})
            if data:
                table = Table(title="Fields to Create", show_header=True, header_style="bold magenta")
                table.add_column("Field", style="cyan")
                table.add_column("Value", style="white")
                
                for key, value in data.items():
                    table.add_row(key, str(value))
                
                console.print(table)
        
        elif operation_type == "UPDATE":
            record_id = arguments.get('record_id', 'Unknown')
            data = arguments.get('data', {})
            
            console.print(f"Record ID: [{operation_color}]{record_id}[/{operation_color}]")
            
            if data:
                table = Table(title="Fields to Update", show_header=True, header_style="bold magenta")
                table.add_column("Field", style="cyan")
                table.add_column("New Value", style="white")
                
                for key, value in data.items():
                    table.add_row(key, str(value))
                
                console.print(table)
        
        elif operation_type == "DELETE":
            record_id = arguments.get('record_id', 'Unknown')
            console.print(f"⚠️  Record ID to DELETE: [{operation_color}]{record_id}[/{operation_color}]", style="bold")
            console.print("\n[red]WARNING: This operation cannot be undone![/red]")
        
        # Prompt for confirmation
        console.print("\n" + "-"*60, style="dim")
        confirmation = Prompt.ask(
            f"\n❓ Do you want to proceed with this {operation_type} operation?",
            choices=["y", "n"],
            default="n",
            show_choices=True
        )
        
        # Process user response
        if confirmation.lower() != 'y':
            console.print(f"\n❌ {operation_type} operation cancelled by user.", style="bold red")
            raise StopAgentRun(f"{operation_type} operation cancelled by user confirmation")
        
        console.print(f"\n✅ {operation_type} operation confirmed. Executing...", style="bold green")
        console.print("-"*60 + "\n", style="dim")
        
        # Execute the function
        result = function_call(**arguments)
        
        # Show success message
        console.print(f"\n✨ {operation_type} operation completed successfully!", style="bold green")
        
        return result
        
    finally:
        # Restart live display
        if live:
            live.start()


def bulk_confirmation_hook(function_name: str, function_call: callable, arguments: Dict[str, Any]) -> Any:
    """
    Confirmation hook for bulk Salesforce operations.
    Prompts user for confirmation before executing bulk create or update operations.
    
    Args:
        function_name: Name of the function being called
        function_call: The actual function to call
        arguments: Arguments passed to the function
        
    Returns:
        Result of the function call if confirmed
        
    Raises:
        StopAgentRun: If user cancels the operation
    """
    # Stop live display for clean prompt
    live = console._live if hasattr(console, '_live') else None
    if live:
        live.stop()
    
    try:
        # Determine operation type
        operation_type = None
        object_name = arguments.get('object_name', 'Unknown')
        records = arguments.get('records', [])
        
        if 'create' in function_name.lower():
            operation_type = "BULK CREATE"
            operation_color = "green"
        elif 'update' in function_name.lower():
            operation_type = "BULK UPDATE"
            operation_color = "yellow"
        else:
            # For unknown operations, proceed without confirmation
            return function_call(**arguments)
        
        # Create confirmation display
        console.print("\n" + "="*60, style="bright_blue")
        console.print(f"🔔 BULK OPERATION CONFIRMATION REQUIRED", style="bold bright_white")
        console.print("="*60 + "\n", style="bright_blue")
        
        # Operation summary
        operation_text = f"[{operation_color}]{operation_type}[/{operation_color}] operation on [{operation_color}]{object_name}[/{operation_color}]"
        console.print(Panel(operation_text, title="Operation", border_style=operation_color))
        
        # Display record count and sample
        console.print(f"\n📊 Number of records: [{operation_color}]{len(records)}[/{operation_color}]")
        
        # Show sample of records (first 3)
        if records:
            console.print("\n📋 Sample records (showing first 3):")
            for i, record in enumerate(records[:3]):
                console.print(f"\n  Record {i+1}:")
                for key, value in record.items():
                    console.print(f"    • {key}: {value}")
            
            if len(records) > 3:
                console.print(f"\n  ... and {len(records) - 3} more records")
        
        # Warning for bulk operations
        console.print(f"\n[yellow]⚠️  This will affect {len(records)} records![/yellow]")
        
        # Prompt for confirmation
        console.print("\n" + "-"*60, style="dim")
        confirmation = Prompt.ask(
            f"\n❓ Do you want to proceed with this {operation_type} operation?",
            choices=["y", "n"],
            default="n",
            show_choices=True
        )
        
        # Process user response
        if confirmation.lower() != 'y':
            console.print(f"\n❌ {operation_type} operation cancelled by user.", style="bold red")
            raise StopAgentRun(f"{operation_type} operation cancelled by user confirmation")
        
        console.print(f"\n✅ {operation_type} operation confirmed. Executing...", style="bold green")
        console.print("-"*60 + "\n", style="dim")
        
        # Execute the function
        result = function_call(**arguments)
        
        # Show success message
        console.print(f"\n✨ {operation_type} operation completed successfully!", style="bold green")
        
        return result
        
    finally:
        # Restart live display
        if live:
            live.start()