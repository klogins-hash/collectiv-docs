---
title: Akademik Backend
description: The Collectiv documentation
---

# Akademik Backend

Python FastAPI backend for Akademik research consolidation system.

## Architecture

### Services

- **FastAPI**: REST API server (port 8000)
- **PostgreSQL**: Job state, agent memory, source tracking
- **Redis**: Task queue (Celery), caching, session storage
- **Weaviate**: Vector search, semantic indexing, RAG retrieval

### Components

#### `main.py`

FastAPI application with:
- Lifespan management for service initialization
- Health check endpoints
- CORS middleware configuration
- Database, Redis, and Weaviate connection pools

#### `models.py`

Pydantic models for:
- Wiki page CRUD operations
- Document uploads
- Search queries and responses
- Zotero citations
- Consolidation jobs
- Duplicate detection

#### `clients/`

External service clients:

- **`zotero.py`**: Zotero library integration
  - Search academic sources
  - Sync library items
  - Add/retrieve citations
  - Full-text search with filtering

- **`weaviate.py`**: Vector database client
  - Semantic search
  - Batch indexing
  - Object CRUD operations
  - Filter-based queries
  - Scholar search across citations

## Setup

### Prerequisites

- Python 3.10+
- Poetry (for dependency management)
- Docker (for services)

### Installation

```bash
# Install dependencies
pip install poetry
poetry install

# Or with pip
pip install -r requirements.txt
```

### Environment Variables

See `.env.example` in project root:

```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=akademik

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Weaviate
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080

# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ZOTERO_API_KEY=...
ZOTERO_USER_ID=...
```

## Running

### Development

```bash
# Start FastAPI dev server with hot reload
python main.py

# Or with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Production

```bash
# Start with gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

### Docker

```bash
# Build image
docker build -t akademik-backend .

# Run container
docker run -p 8000:8000 --env-file .env akademik-backend
```

## API Endpoints

### Health

- `GET /health` - Service health status

### Wiki Pages

- `GET /wiki/pages/{slug}` - Get page by slug
- `POST /wiki/pages` - Create page
- `PUT /wiki/pages/{id}` - Update page
- `DELETE /wiki/pages/{id}` - Delete page

### Search

- `GET /api/search?q=query&limit=10` - Semantic search
- `GET /api/search/scholar?query=...` - Search academic sources

### Documents

- `POST /documents/upload` - Upload document
- `GET /documents/{id}` - Get document
- `POST /documents/{id}/process` - Process document

### Consolidation

- `POST /consolidation/jobs` - Create consolidation job
- `GET /consolidation/jobs/{id}` - Get job status
- `POST /consolidation/jobs/{id}/deduplicate` - Find duplicates

## Development

### Code Style

Uses Black for formatting and isort for import sorting:

```bash
black .
isort .
```

### Type Checking

```bash
mypy .
```

### Testing

```bash
pytest

# With coverage
pytest --cov=akademik tests/
```

### Linting

```bash
flake8 .
pylint akademik/
```

## Database

### Migrations

Using Alembic:

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Celery Tasks

### Starting Worker

```bash
celery -A akademik.tasks worker --loglevel=info
```

### Starting Flower (monitoring)

```bash
celery -A akademik.tasks flower
```

## Performance

### Optimization Strategies

1. **Connection Pooling**: PostgreSQL and Redis connections reused
2. **Batch Processing**: Documents indexed in batches to Weaviate
3. **Caching**: Redis cache for search results and frequently accessed data
4. **Async I/O**: FastAPI endpoints are async for concurrent handling
5. **Rate Limiting**: Applied to Zotero API calls

### Monitoring

- Health checks available at `/health`
- Flower UI for Celery task monitoring at `localhost:5555`
- Weaviate stats available via `WeaviateClient.get_stats()`

## Troubleshooting

### Connection Errors

```bash
# Test database
psql -h localhost -U postgres -d akademik

# Test Redis
redis-cli -h localhost

# Test Weaviate
curl http://localhost:8080/v1/.well-known/ready
```

### Performance Issues

- Check connection pool status in health endpoint
- Monitor Celery task queue length
- Review Weaviate stats for large indexes

### API Errors

- Check application logs: check FastAPI console output
- Verify environment variables are set
- Ensure all services are running and healthy

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes following code style guidelines
3. Add tests for new functionality
4. Run linting and type checks
5. Submit pull request

## License

Proprietary - The Collectiv