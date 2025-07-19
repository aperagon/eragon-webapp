# Eragon Backend

Django + FastAPI backend for the Eragon webapp.

## Architecture

This backend combines Django's robust ORM and data modeling capabilities with FastAPI's modern async API framework:

- **Django**: Handles database models, migrations, and data persistence
- **FastAPI**: Provides the REST API endpoints with automatic OpenAPI documentation
- **SQLite**: Default database (can be changed to PostgreSQL/MySQL)

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run migrations**:
   ```bash
   python3 manage.py migrate
   ```

3. **Start the server**:
   ```bash
   python3 start.py
   ```

   Or manually:
   ```bash
   python3 main.py
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc

## API Endpoints

### Entities (`/api/`)

#### Sessions
- `POST /api/sessions/` - Create session
- `GET /api/sessions/` - List sessions
- `GET /api/sessions/{id}` - Get session
- `PUT /api/sessions/{id}` - Update session
- `DELETE /api/sessions/{id}` - Delete session
- `GET /api/sessions/filter/` - Filter sessions

#### Accounts
- `GET /api/accounts/` - List accounts
- `GET /api/accounts/{id}` - Get account

#### Opportunities
- `GET /api/opportunities/` - List opportunities
- `GET /api/opportunities/{id}` - Get opportunity

#### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update current user
- `POST /api/users/logout` - Logout user

### Integrations (`/api/integrations/`)

- `POST /api/integrations/llm/invoke` - Invoke LLM
- `POST /api/integrations/email/send` - Send email
- `POST /api/integrations/files/upload` - Upload file

## Current Status

All endpoints are implemented with **empty/placeholder responses** as requested. The endpoints return mock data and are ready for actual implementation.

## Database Models

- **User**: Extended Django user model with UUID primary key
- **Session**: User sessions with JSON data field
- **Account**: CRM account entities
- **Opportunity**: Sales opportunities linked to accounts

## Development

- The server runs with hot-reload enabled
- CORS is configured for frontend development
- All endpoints return structured JSON responses
- Proper error handling and validation with Pydantic models

## Next Steps

1. Implement actual business logic in the endpoint handlers
2. Add authentication/authorization
3. Connect to external services for integrations
4. Add proper error handling and logging
5. Set up production database configuration 