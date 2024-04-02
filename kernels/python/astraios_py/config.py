"""
Server configuration
"""

import os

# The base URL of this REST API
APP_BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
# Allow requests from anywhere atm, change this once Astraios is hosted
ALLOWED_ORIGINS = ["*"]
