# Build It Right From Day One: Complete Stack Architecture

## Your Position: Valid & Better

You're right. Building "the real thing" from day one is superior to:
- MVP that needs rework later
- Choosing frameworks you'll outgrow
- Learning limitations the hard way

**This document maps the complete, production-ready stack NOR MVP compromises.**

---

## Framework Decisions (Final)

### 1. WIKI/DOCUMENTATION: DokuWiki vs. Fumadocs

#### DokuWiki
**Characteristics:**
- Mature, stable, battle-tested
- Flat-file storage (git-friendly)
- Built-in version control
- Self-hosted PHP application
- Limited API (REST exists but basic)
- Not built for programmatic access
- Better for human-first wikis

**For your use case:**
- ❌ Not ideal if agents edit constantly
- ⚠️ API access is clunky for programmatic workflows
- ✅ Good if humans are primary, agents secondary

---

#### Fumadocs
**Characteristics:**
- Modern, built for documentation-as-code
- Based on Next.js + TypeScript
- Native API-first design
- Git-backed (MDX files)
- Excellent programmatic access
- Built for integration with tools
- Perfect for AI-native workflows

**For your use case:**
- ✅ API-first (agents can read/write seamlessly)
- ✅ Built for automation & tool integration
- ✅ Modern, maintained ecosystem
- ✅ Better error handling & logging
- ✅ TypeScript/Node.js ecosystem (good for tools)

### **Recommendation: FUMADOCS**

**Why Fumadocs wins for "build it right from day one":**

1. **API-first architecture** — Fumadocs treats docs as data
   - REST API for programmatic access
   - Perfect for agent-driven edits
   - Built for tool integration

2. **MDX support** — Executes embedded code
   - You could include dynamic visualizations
   - Academic credentials embedded
   - Interactive research docs

3. **Next.js ecosystem** — Better tooling for automation
   - Strands agents can call HTTP endpoints
   - Better TypeScript support
   - Easier to build custom MCP wrapper

4. **Git-native** — All diffs tracked
   - Audit trail baked in
   - Branching for research iterations
   - Merge conflict resolution for multi-agent work

5. **Modern stack** — No technical debt
   - Not building on legacy PHP
   - Better integrations available
   - Easier to extend

**DokuWiki would require constant API wrappers. Fumadocs is already built for this.**

---

## Agent Framework: Strands vs. LangChain

### Strands Overview
Strands is a **job-based agent framework** designed for:
- Autonomous agents with persistence
- Job scheduling and queuing
- Multi-step workflows
- Built-in error handling & retries
- Agent tools as first-class citizens

**Key capabilities:**
```typescript
// Strands agent structure
const agent = new StrandsAgent({
  name: "research-consolidation",
  instructions: "Consolidate research documents...",
  tools: [WikiEditTool, ZoteroSearchTool, DeduplicationTool],
  errorHandling: {
    retries: 3,
    backoff: "exponential",
    onFailure: "log_and_notify"
  }
});

// Jobs are first-class
agent.createJob({
  task: "consolidate-doc-batch",
  input: docs,
  retryPolicy: { maxAttempts: 3 },
  timeout: 60000
});
```

### Strands vs. LangChain Comparison

| Aspect | Strands | LangChain | Winner |
|--------|---------|-----------|--------|
| **Job Persistence** | ✅ Native | ⚠️ Via extensions | **Strands** |
| **Error Handling** | ✅ Built-in | ⚠️ Manual implementation | **Strands** |
| **Tool Management** | ✅ First-class | ✅ First-class | Tie |
| **Async/Parallel** | ✅ Excellent | ⚠️ Good | **Strands** |
| **Maturity** | Newer | Very mature | **LangChain** |
| **Community** | Growing | Huge | **LangChain** |
| **For AI-only projects** | ✅ Perfect | ⚠️ Overkill | **Strands** |
| **Learning curve** | Low | Medium | **Strands** |
| **For "build it right"** | ✅✅✅ | ⚠️ | **Strands** |

### **Recommendation: STRANDS (with Strands + LangChain hybrid possible)**

**Why Strands is better for your use case:**

1. **Error handling is baked in, not bolted on**
   ```typescript
   const job = await agent.executeWithRetry(task, {
     maxRetries: 3,
     backoffMultiplier: 2,
     onError: (error) => {
       log(`Tool failed: ${error.message}`);
       return { retry: true, delay: 5000 };
     }
   });
   ```

2. **Jobs are persistent** — Your agent runs don't vanish
   ```typescript
   // Get job status anytime
   const jobStatus = await agent.getJob(jobId);
   // Resume failed jobs
   await agent.resumeJob(jobId);
   ```

3. **Tool isolation** — One tool fails != whole agent fails
   ```typescript
   const tools = [
     WikiEditTool,
     ZoteroFetchTool,    // ← Can fail independently
     DeduplicationTool
   ];
   // If Zotero times out, other tools continue
   ```

4. **For AI-only systems, this is perfect**
   - No human in the loop = need bulletproof error handling
   - Strands assumes agents run autonomously

---

## Complete Stack: Build It Right From Day One

```
┌─────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER                                      │
│ ├─ Fumadocs (Next.js + TypeScript)                     │
│ │  ├─ API endpoints for programmatic access           │
│ │  ├─ MDX pages (git-backed)                          │
│ │  └─ Built-in versioning                             │
│ └─ Dashboard (monitoring agent jobs)                   │
├─────────────────────────────────────────────────────────┤
│ API LAYER                                               │
│ ├─ FastAPI backend (Python, but see note below)        │
│ ├─ Fumadocs API (TypeScript/Node.js routes)           │
│ └─ MCP endpoints (for Claude integration)              │
├─────────────────────────────────────────────────────────┤
│ AGENT LAYER                                             │
│ ├─ Strands agents ("consolidation-bot", etc.)         │
│ ├─ Tools (WikiEdit, ZoteroFetch, Deduplicate)        │
│ ├─ Jobs with persistence & error handling             │
│ └─ Multi-agent coordination                           │
├─────────────────────────────────────────────────────────┤
│ DATA LAYER                                              │
│ ├─ Weaviate (vector DB, search, metadata)             │
│ ├─ Celery + Redis (async task queue, job storage)     │
│ ├─ Git repo (version control + audit trail)           │
│ ├─ Zotero API (academic sources)                      │
│ └─ PostgreSQL (job state, agent memory)               │
├─────────────────────────────────────────────────────────┤
│ INFRASTRUCTURE                                          │
│ ├─ Docker Compose (all services)                       │
│ ├─ Docker containers for each service                  │
│ └─ Volumes for persistent data                         │
└─────────────────────────────────────────────────────────┘
```

---

## The Technology Stack: Build-It-Right Version

### Agent Layer: Strands
```typescript
// agents/consolidation-agent.ts
import { StrandsAgent, Tool } from "@strands/core";

class WikiEditTool extends Tool {
  async invoke(pageId: string, content: string, message: string) {
    try {
      const response = await fetch(`http://api:8000/pages/${pageId}`, {
        method: "POST",
        body: JSON.stringify({ content, message })
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return { status: "saved" };
    } catch (error) {
      throw new Error(`Wiki edit failed: ${error.message}`);
    }
  }
}

const consolidationAgent = new StrandsAgent({
  name: "consolidation-bot",
  instructions: `Consolidate research documents into wiki pages...`,
  tools: [
    new WikiEditTool(),
    new ZoteroSearchTool(),
    new DeduplicationTool()
  ],
  errorHandling: {
    retries: 3,
    backoff: "exponential",
    onFailure: "log_and_pause"
  }
});

export { consolidationAgent };
```

### Documentation Layer: Fumadocs
```bash
# Create Fumadocs project
npx create-fumadocs-app@latest akademik-docs

# Structure
akademik-docs/
├── pages/
│  ├── 01-project-plan/
│  ├── 02-framework/
│  └── ...
├── public/
├── src/
│  ├── api/
│  │  ├── pages.ts         # Programmatic page access
│  │  ├── search.ts        # RAG search endpoint
│  │  └── commit.ts        # Git commits from API
│  └── components/
└── fumadocs.config.ts     # Configuration
```

### Orchestration: Celery + Redis
```python
# tasks.py (Python orchestration layer)
from celery import Celery, Task
from typing import Any

app = Celery(
    'akademik',
    broker='redis://redis:6379/0',
    backend='redis://redis:6379/1'
)

class StrandsJobTask(Task):
    autoretry_for = (Exception,)
    retry_kwargs = {'max_retries': 3}
    retry_backoff = True

@app.task(bind=True, base=StrandsJobTask)
def run_consolidation_agent(self, doc_ids: list[str]):
    """Trigger Strands agent via job queue"""
    try:
        # Call Strands agent service
        response = requests.post(
            "http://agents:3000/jobs/consolidation",
            json={"doc_ids": doc_ids}
        )
        return response.json()
    except Exception as exc:
        self.retry(exc=exc, countdown=60)
```

### Vector Database: Weaviate
```python
# rag/weaviate_search.py
from weaviate.client import Client
from langchain.embeddings import OpenAIEmbeddings

class WikiRAG:
    def __init__(self):
        self.client = Client("http://weaviate:8080")
        self.embeddings = OpenAIEmbeddings()

    def index_page(self, page_id: str, content: str, metadata: dict):
        """Index wiki page in Weaviate"""
        embedding = self.embeddings.embed_query(content)
        self.client.data_object.create(
            class_name="WikiPage",
            data_object={
                "page_id": page_id,
                "content": content,
                "source": metadata.get("source"),
                "authors": metadata.get("authors", [])
            },
            vector=embedding
        )

    def search(self, query: str, limit: int = 5):
        """Semantic search with metadata filtering"""
        embedding = self.embeddings.embed_query(query)
        results = self.client.query.get(
            class_name="WikiPage",
            properties=["page_id", "content", "source"]
        ).with_near_vector(
            vector=embedding,
            distance=0.7
        ).with_limit(limit).do()

        return results
```

---

## Docker Compose: Full Stack from Day 1

```yaml
version: '3.8'

services:
  # Documentation + API Gateway
  fumadocs:
    build: ./fumadocs-app
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/akademik
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./content:/app/pages
      - ./git-repo:/app/git
    depends_on:
      - postgres
      - redis

  # Agent Orchestration (Strands)
  agents:
    build: ./agents
    ports:
      - "3002:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - fumadocs

  # Vector Database
  weaviate:
    image: semitechnologies/weaviate:latest
    ports:
      - "8080:8080"
    environment:
      - QUERY_DEFAULTS_LIMIT=20
      - AUTHENTICATION_APIKEY_ENABLED=false

  # Task Queue Broker
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Job State + Memory
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=akademik
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Python backend for RAG + Zotero
  python-backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - WEAVIATE_URL=http://weaviate:8080
      - ZOTERO_API_KEY=${ZOTERO_API_KEY}
    depends_on:
      - weaviate
      - postgres

  # Celery workers (scalable)
  celery-worker:
    build: ./backend
    command: celery -A tasks worker --loglevel=info
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
    depends_on:
      - redis
      - python-backend

volumes:
  redis_data:
  postgres_data:
```

---

## Error Handling: Strands + Weaviate + Celery

### Layer 1: Strands Agent-Level
```typescript
// Strands handles: retries, timeouts, circuit breakers
try {
  const result = await agent.executeJob({
    task: "consolidate-documents",
    autonomy: "full",
    errorHandling: {
      retries: 3,
      backoffMultiplier: 2,
      timeout: 60000,
      onError: async (error, attempt) => {
        console.error(`Attempt ${attempt} failed: ${error.message}`);
        // Agent decides: retry, escalate, or skip
        if (error.code === "WIKI_TIMEOUT") {
          return { action: "retry", delay: 5000 };
        } else if (error.code === "ZOTERO_UNAVAILABLE") {
          return { action: "fallback", fallbackBehavior: "skip_citations" };
        }
        return { action: "fail" };
      }
    }
  });
} catch (error) {
  console.error("Agent job failed after retries:", error);
  // Log to monitoring system
}
```

### Layer 2: Celery Task-Level
```python
# Celery automatically retries failed tasks
@app.task(
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3},
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True
)
def process_document_batch(doc_ids: list[str]):
    """Celery ensures job completes or retries exponentially"""
    try:
        for doc_id in doc_ids:
            # Process each document
            # If one fails, Celery retries the entire task
            pass
    except Exception as e:
        # Automatically retried by Celery
        raise Task.retry(exc=e, countdown=60)
```

### Layer 3: Weaviate Query-Level
```python
def resilient_search(query: str, max_retries: int = 3):
    """Fallback search if Weaviate unavailable"""
    for attempt in range(max_retries):
        try:
            return weaviate_search(query)  # Primary search
        except ConnectionError:
            if attempt == max_retries - 1:
                # Fallback to full-text search in Fumadocs
                return fallback_search(query)
            time.sleep(2 ** attempt)  # Exponential backoff
```

### Layer 4: System-Level
```yaml
# Docker health checks ensure services recover
services:
  weaviate:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/v1/meta"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
```

---

## Build-It-Right Stack Summary

| Component | Choice | Why |
|-----------|--------|-----|
| **Wiki** | **Fumadocs** | API-first, modern, git-backed, TypeScript |
| **Agents** | **Strands** | Error handling built-in, job persistence, async-native |
| **Vector DB** | **Weaviate** | Full-featured, production-ready, scalable |
| **Task Queue** | **Celery + Redis** | Proven, reliable, handles retries natively |
| **Storage** | **PostgreSQL** | Job state, agent memory, structured data |
| **Container** | **Docker Compose** | All services together, reproducible |
| **API Gateway** | **Fumadocs + FastAPI** | Fumadocs frontend, Python backend for RAG |

---

## Error Handling: Executive Summary

**Strands handles agent-level errors:**
- ✅ Tool failures (one tool fails, others continue)
- ✅ Timeouts (configurable per job)
- ✅ Retries (exponential backoff)
- ✅ Fallback behaviors (skip, retry, escalate)
- ✅ Job persistence (resume failed jobs)

**Celery handles queue-level errors:**
- ✅ Task failures (automatic retry)
- ✅ Worker crashes (task reassigned to healthy worker)
- ✅ Exponential backoff (prevents thundering herd)
- ✅ Dead letter queue (failed tasks not lost)

**Weaviate handles search-level errors:**
- ✅ Connection pooling (automatic reconnect)
- ✅ Query timeouts (fallback to full-text search)
- ✅ Embedding failures (retry with degraded mode)

**System-level health:**
- ✅ Docker health checks (auto-restart failed services)
- ✅ Monitoring (detect anomalies early)
- ✅ Logging (audit trail of all failures)

---

## Implementation Order (Build It Right)

**Week 1: Foundation**
1. Set up Fumadocs project with API routes
2. Create initial wiki structure (git repo)
3. Spin up Weaviate + Redis + PostgreSQL in Docker
4. Build FastAPI RAG backend

**Week 2: Agents**
5. Implement Strands agents with error handling
6. Create agent tools (WikiEdit, ZoteroFetch, etc.)
7. Integrate Celery for job queuing
8. Test agent error scenarios

**Week 3: Integration**
9. Connect agents to Fumadocs API
10. Build consolidation pipeline
11. Test full-stack with 50 documents

**Week 4+: Scale**
12. Scale Celery workers (process 200+ docs)
13. Optimize Weaviate queries
14. Add monitoring + alerting

---

## Why This Is Better Than MVP-First

✅ No rework when adding features
✅ Error handling from day 1 (Strands + Celery)
✅ Scalable foundation (Weaviate, not Chroma)
✅ Async-native (Strands + Celery)
✅ Agent-forward (Strands is built for this)
✅ Modern stack (Fumadocs, not DokuWiki)
✅ Production-ready foundation

---

Ready to start with Fumadocs setup + Docker Compose configuration?
