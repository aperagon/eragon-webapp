#!/usr/bin/env python3
"""Development server with hot reload enabled."""

import uvicorn
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


if __name__ == "__main__":
    # Force DEBUG mode for development
    os.environ["DEBUG"] = "False"

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5002,
        reload=True,
        reload_dirs=[".", "api", "agents", "config", "utils", "core"],
        log_level="info",
        access_log=True
    )