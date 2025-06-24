# Gigarad Backend - AI Context

## Project Overview
Gigarad is a music discovery and radio generation platform that creates personalized radio stations using AI. Users can generate stations based on:
- A seed song (similar to Spotify Radio)
- Text prompts (AI-powered recommendations)


## User Commands (prefix with --):

--GCP  
Commit and push all staged changes.

--MIND  
Before any action, remind yourself:  
- This isn’t fucking enterprise. We’re indiehackers, building MVPs—move fast, stay practical.
- DRY (Don’t Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- YAGNI (You Aren’t Gonna Need It)
- SOLID (Single responsibility, Open-closed, Liskov, Interface segregation, Dependency inversion)
- FCP (Favor Composition over Inheritance)
- PoLA (Principle of Least Astonishment)
- SoT (Single Source of Truth)

--WD  
Run --X and --MIND.  
Do a quick, MVP-level review of the codebase. regarding what's described along with the command. 
Write an actionable checklist in /dev-docs/REVIEW-***.md.  
Don’t touch code or other docs.  
When done, --GCP and output the doc path.

--AP  
Run --X and --MIND.  
Take the latest review and break it down into a simple, step-by-step action plan with checkboxes—keep splitting steps until atomic.  
Save as /docs/ACTION-PLAN-***.md, then --GCP.

--EXE  
Run --MIND, then execute the action plan (from file), checking off steps as you go.  
Commit and push (--GCP) after each step.

--TERMINATOR  
Run --EXE, then --DS.

--CD  
Run --MIND.  
Find and delete obsolete .md files, then --GCP.

--DS  
Don’t stop until the process is totally finished.

--X  
Don’t touch the codebase, except for the one file specified (if any).

---

### General Notes

- Reviews and action plans must stay light and MVP-focused—no enterprise BS unless explicitly asked.
- Output file paths for every relevant action.


## Tech Stack
- **Framework**: FastAPI
- **Database**: PostgreSQL 16 with SQLAlchemy ORM
- **Search**: Typesense
- **Python**: 3.13.2
- **Server**: Uvicorn (dev), Gunicorn (prod)
- **Container**: Docker with docker-compose

## Key Integrations
- **Music Services**: Shazam, YouTube Music, Apple Music
- **AI/LLM**: OpenRouter (using OpenAI SDK)
- **Analytics**: PostHog
- **Email**: Postmarker

## Project Structure
```
web/
├── main.py          # FastAPI app entry point
├── routes/          # API endpoints
├── controllers/     # Business logic
├── services/        # Core services
├── integrations/    # External service clients
├── models/          # SQLAlchemy models
├── schemas/         # Pydantic schemas
└── settings/        # Configuration
```

## Development Commands
```bash
# Install dependencies
poetry install

# Run development server
poetry run uvicorn web.main:app --reload --port 8000

# Run with docker
docker-compose up

# Sync Typesense search index
poetry run python -m web.scripts.typesense_sync

# Database migrations
ENV=dev DB_HOST=localhost DB_PORT=55432 poetry run alembic upgrade head
poetry run python scripts/migrate.py create "Add new feature"
```

## Testing Commands
```bash
# Run tests (if available)
poetry run pytest

# Linting
poetry run ruff check web/
poetry run ruff format web/

# Type checking (if configured)
poetry run mypy web/
```

## Database
- Uses SQLAlchemy ORM with Alembic migrations
- Connection pooling: pool_size=50, max_overflow=100
- Main tables: users, radios, tracks, tracks2radio, track_checks, llm_usage
- Migrations in `alembic/versions/`

## API Endpoints
- `GET /health` - Health check
- `POST /radio/insert` - Create radio station
- `GET /radio/{radio_id}/{page_number}` - Get radio with tracks
- `GET /user/{user_id}` - Get user info
- `POST /user/insert` - Create user

## Important Notes
1. **Framework**: Fully migrated to FastAPI from Flask (December 2025)
2. **Streaming**: Uses Server-Sent Events (SSE) for real-time AI track generation
3. **Multi-Provider**: Aggregates data from multiple music services
4. **Environment**: Requires `.env.dev` file with API keys and configuration
5. **Python Environment**: Use `pyenv activate tuneb@3.13.2` to activate the environment

## Common Tasks
- To add a new music service integration: Create in `web/integrations/`
- To add a new API endpoint: Add to `web/routes/` and create controller in `web/controllers/`
- To modify database schema: Update models in `web/models/` and create migration
- To update search index: Modify `web/scripts/typesense_sync.py`

## Architecture Decisions
- Layered architecture: Routes → Controllers → Services → Integrations
- Streaming responses for better UX during AI generation
- Unified track model with provider-specific IDs
- Pagination for radio stations (tracks loaded in pages)
- SQLAlchemy with dependency injection for database sessions

## Migration History
- December 2025: Completed migration from Flask to FastAPI
  - Replaced Flask-SQLAlchemy with pure SQLAlchemy
  - Implemented FastAPI dependency injection for database sessions
  - Added GZip compression middleware
  - Removed all Flask dependencies
  - Updated all models to use SQLAlchemy declarative base