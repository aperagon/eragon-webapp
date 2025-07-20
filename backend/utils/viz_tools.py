import json
import re
import base64
import os
import tempfile
from typing import Dict, Any, Tuple, Optional
import anthropic
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from config.settings import settings
from config.agents import VIZ_INSTRUCTIONS
from utils import query_salesforce_sync
from .helper import salesforce_to_markdown, filter_salesforce_data_for_prompt

def query_salesforce_and_chart(
    query: str,
    user_query: str
) -> Tuple[str, Dict[str, Any]]:
    """
    Execute SOQL queries against Salesforce and generate interactive Plotly charts.
    
    Args:
        query (str): The SOQL query to execute
        chart_type (str): Type of chart to create ("auto", "bar", "line", "scatter", "pie", "histogram")
        chart_title (str, optional): Custom title for the chart
        anthropic_api_key (str): Anthropic API key for Claude
        output_format (str): Format for chart output ("html", "markdown_embed", "file_path", "base64")
        
    Returns:
        Tuple[str, Dict[str, Any]]: (chart_output, salesforce_data)
    """
    
    # Step 1: Get Salesforce data
    try:
        salesforce_data = query_salesforce_sync(query, format_data=False)
        if isinstance(salesforce_data, str) and salesforce_data.startswith("❌"):
            return salesforce_data, {}
    except Exception as e:
        return f"❌ Error querying Salesforce: {str(e)}", {}
    
    # Step 2: Prepare data for Claude (use the filtering function)
    filtered_result = filter_salesforce_data_for_prompt(
        salesforce_data,
        max_records=5,  # More records for better chart insights
        exclude_columns=['attributes', 'systemmodstamp', 'createdbyid'],
        sampling_strategy="distributed"
    )
    data_sample = filtered_result['records']
    data_metadata = filtered_result['metadata']
    
    # Step 3: Create prompt for Claude
    chart_prompt = VIZ_INSTRUCTIONS.format(data_sample=data_sample, query=query, data_metadata=data_metadata)

    # Step 4: Call Claude API
    try:
        client = anthropic.Anthropic()
        
        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=4000,
            messages=[{
                "role": "user", 
                "content": chart_prompt
            }]
        )
        
        # Extract Python code from response
        code_content = response.content[0].text
        
        # Clean up the code (remove markdown formatting if present)
        code_match = re.search(r'```python\n(.*?)\n```', code_content, re.DOTALL)
        if code_match:
            python_code = code_match.group(1)
        else:
            python_code = code_content
            
    except Exception as e:
        return f"❌ Error calling Claude API: {str(e)}", salesforce_data
    
    # Step 5: Execute the generated code
    try:
        # Create a safe execution environment with FULL dataset
        full_records = salesforce_data.get('records', []) if isinstance(salesforce_data, dict) else []
        if hasattr(salesforce_data, 'data'):
            full_records = salesforce_data.data
        
        exec_globals = {
            'json': json,
            'pd': pd,
            'go': go,
            'px': px,
            'data': full_records,  # Inject FULL dataset
            'sample_data': data_sample,       # Keep sample for reference
        }
        
        # Execute the generated code
        exec(python_code, exec_globals)
        
        # Get the chart HTML
        chart_html = exec_globals.get('chart_html', '')
        
        if not chart_html:
            return "❌ Generated code did not produce chart_html variable", salesforce_data
        chart_div = f"<div class='chart-container'>{chart_html}</div>"
        
        return chart_div, salesforce_to_markdown(salesforce_data)
        
    except Exception as e:
        return f"❌ Error executing generated chart code: {str(e)}\n\nGenerated code:\n{python_code}", salesforce_data