# How the Full Stack Should Inform Your MVP

## The Problem

You have a complete tech stack architecture, but MVP doesn't mean "build everything small." MVP means **build the right foundation that won't require rework when you scale**.

This document maps the full stack to MVP priorities—showing which components must be built correctly NOW vs. which can be deferred.

---

## Full Stack @ Scale vs. MVP @ Speed

### Full Stack (Months 4-6, Production)
```
FastAPI + MCP Server     (production-ready API layer)
    ↓
LangChain Agents         (multi-agent coordination, error handling)
    ↓
Chroma → Weaviate        (vector DB scaling, advanced queries)
    ↓
Document Pipeline        (batch processing 1000+ docs)
    ↓
Celery + Redis           (async task queuing, worker pool)
    ↓
Docker Compose           (reproducible infrastructure)
    ↓
GitOps + CI/CD           (automated testing, deployment)
    ↓
Monitoring + Logging     (observability, debugging)
```

### MVP (Weeks 1-6, Functional but Simple)
```
FastAPI (lightweight)    ← Build this now (foundational)
    ↓
LangChain Agents         ← Build this now (core logic)
    ↓
Chroma (embedded)        ← Build this now (essential for RAG)
    ↓
Document Pipeline        ← Partial MVP (manual for < 100 docs)
    ↓
[Skip for now]           ← Redis/Celery can wait
    ↓
Docker Compose           ← Build this now (reproducibility)
    ↓
[Simple logging]         ← Basic logging, upgrade later
```

---

## Critical Path for MVP: What MUST Be Right From Day 1

### 1. FastAPI + MCP Server Foundation ✅ BUILD NOW

**Why this must be right:**
- All agents will communicate through this API
- If you build FastAPI wrong, agents can't reach the wiki
- Changing API design later breaks all agent code
- MCP compatibility needs to be baked in from the start

**What "right" means for MVP:**
```python
# This structure must exist from day 1:
class WikiEndpoint:
    - GET /pages/{page_id}          # Read pages
    - POST /pages/{page_id}         # Edit pages with git commit
    - GET /search?q=...             # Full-text search
    - GET /citations/{source_id}    # Fetch from Zotero

class AgentEndpoint:
    - POST /agents/tasks            # Queue task for agent
    - GET /agents/tasks/{task_id}   # Check status

class GitEndpoint:
    - GET /history/{page_id}        # Git blame + commit history
    - POST /commit                  # Commit changes
```

**MVP implementation (40 lines):**
```python
from fastapi import FastAPI
import git

app = FastAPI()
repo = git.Repo("./wiki_repo")

@app.get("/pages/{page_id}")
async def read_page(page_id: str):
    content = Path(f"./wiki/{page_id}.md").read_text()
    return {"content": content}

@app.post("/pages/{page_id}")
async def edit_page(page_id: str, content: str, message: str):
    Path(f"./wiki/{page_id}.md").write_text(content)
    repo.index.add([f"wiki/{page_id}.md"])
    repo.index.commit(f"{message}")
    return {"status": "saved"}

@app.get("/search")
async def search(q: str):
    # Simple grep for MVP, upgrade to RAG later
    results = run_command(f"grep -r '{q}' ./wiki")
    return {"results": results}
```

**Why this design matters:**
- Agents can't work without this API
- Future upgrade path: `search()` → real RAG later
- Git commit tracking is core to your audit trail
- MCP wrapping this API is trivial once it exists

---

### 2. LangChain Agent Base ✅ BUILD NOW

**Why this must be right:**
- Your entire research consolidation depends on agents
- If you design agents for MVP only, they won't scale
- Agent tools must be modular (so you can add/remove them)
- Error handling must be robust (agents will fail on messy data)

**What "right" means for MVP:**
```python
# Agency structure that scales:
class ResearchAgent:
    def __init__(self, name, tools, llm):
        self.name = name
        self.tools = tools  # ← Modular
        self.llm = llm
        self.memory = ConversationBufferMemory()  # ← Stateful

    def run(self, task):
        # Think → Act → Observe loop
        # Error handling for when tools fail
        # Logging for debugging
        pass

# Each tool is its own class:
class WikiSearchTool:
    """Search wiki via FastAPI"""
    def invoke(self, query):
        return requests.get(f"http://localhost:8000/search?q={query}")

class ZoteroFetchTool:
    """Fetch academic citations"""
    def invoke(self, query):
        return zotero_api.search(query)

class WikiEditTool:
    """Edit wiki page"""
    def invoke(self, page_id, content, message):
        return requests.post(f"http://localhost:8000/pages/{page_id}", json=...)
```

**Why this design scales:**
- New agents can combine existing tools
- You can disable tools without breaking agent logic
- Testing one tool ≠ testing entire agent
- You can add async tools later without redesign

**MVP implementation:**
```python
agent = ResearchAgent(
    name="consolidation-bot",
    tools=[WikiSearchTool(), ZoteroFetchTool(), WikiEditTool()],
    llm=ChatAnthropic(model="claude-3-5-sonnet-20241022")
)

# Agent can now:
# - Search the wiki
# - Fetch academic sources
# - Edit wiki pages with citations
# No Redis needed. No multi-agent coordination needed. Just works.
```

---

### 3. Chroma (Embedded) for RAG ✅ BUILD NOW

**Why this must be right:**
- RAG is how agents ground answers in your research
- Chroma's API is identical whether embedded or cloud
- Future migration to Weaviate is just a config change
- Embeddings strategy must be consistent

**What "right" means for MVP:**
```python
# Chroma MVP: embedded, no infrastructure
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

class WikiRAG:
    def __init__(self):
        # Embedded mode: stores in ./chroma_db locally
        self.vectorstore = Chroma(
            embedding_function=OpenAIEmbeddings(),
            persist_directory="./chroma_db"
        )

    def index_documents(self, documents):
        """Index new documents once"""
        self.vectorstore.add_documents(documents)

    def search(self, query):
        """Search with consistent embedding strategy"""
        return self.vectorstore.similarity_search(query)
```

**Why this design scales to Weaviate:**
```python
# Phase 2+: Drop-in replacement
from weaviate.client import Client

class WikiRAG:
    def __init__(self):
        client = Client("http://localhost:8080")
        # Same interface, different backend
        # No agent code changes
```

**MVP is just:**
```python
rag = WikiRAG()
rag.index_documents(load_wiki_pages())
# Agents now use: rag.search("what is a PBC?")
```

---

### 4. Document Pipeline (Partial MVP) ⚠️ BUILD PARTIALLY

**What must be right:**
- Document ingestion format (markdown with metadata)
- Chunking strategy (consistent for RAG)
- Deduplication detection (even if manual review)

**What can be simple in MVP:**
- No Celery yet (process 50 docs at a time manually)
- No batch automation (process in your IDE)
- No conflict resolution (you decide manually)

**MVP implementation:**
```python
# Agent-assisted, manual-controlled consolidation

def consolidate_documents_manual(doc_paths: list):
    """Process documents one at a time (MVP)"""
    for path in doc_paths:
        doc_text = read_document(path)

        # Claude analyzes
        analysis = claude.analyze(doc_text)

        # You review
        print(f"Analysis: {analysis}")

        # Decision
        decision = input("Create wiki page? (y/n): ")

        if decision == "y":
            wiki_page = claude.create_wiki_page(analysis)
            save_to_wiki(wiki_page)
            commit_to_git(wiki_page)

# Week 1: Process 50 documents this way
# Week 4: Add Celery + Redis when you scale to 500+
```

**Why this is OK for MVP:**
- You learn what consolidation actually requires
- Agent code doesn't change when you add Celery later
- Allows time to refine deduplication heuristics
- No infrastructure debt

---

### 5. Docker Compose ✅ BUILD NOW

**Why this must be right:**
- You need reproducible environment from day 1
- If someone else (or future you) clones the repo, it must work
- Git commit history is only valuable if someone can replay it
- Academic credibility requires reproducibility

**MVP docker-compose.yml:**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./wiki:/workspace/wiki
      - ./chroma_db:/workspace/chroma_db

  # That's it for MVP. No Redis yet.
```

**MVP Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /workspace

COPY requirements.txt .
RUN pip install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Why this matters:**
- `docker-compose up` should work for anyone
- Phase 2: Add Redis service without touching API code
- Phase 3: Add monitoring service
- Reproducibility = academic legitimacy

---

## The MVP-to-Full-Stack Path

### Week 1-2: Foundation
```
✅ FastAPI (basic CRUD API)
✅ LangChain agent base (with 3-4 tools)
✅ Chroma embedded (search wiki)
✅ Docker Compose (reproducible environment)
✅ Manual document processing (50 docs max)
❌ Celery (not needed yet)
❌ Weaviate (Chroma sufficient)
❌ Advanced monitoring (basic logging OK)
```

**Capability:** Can analyze & consolidate 50 hand-picked documents into wiki

### Week 3-4: Scale Agents
```
+ Add 5 more LangChain tools
+ Batch document processing (now 200 docs)
+ Better error handling
+ Zotero sync integration
❌ Still no Celery (manual batching works)
```

**Capability:** Process 200 documents with specialized agents

### Week 5-6: Infrastructure
```
+ Add Celery + Redis worker pool
+ Upgrade Chroma → Weaviate for advanced search
+ CI/CD with GitHub Actions
+ Automated testing
```

**Capability:** Process 1000+ documents with async workers

### Month 3+: Production
```
+ Monitoring (Prometheus + Grafana)
+ Advanced security
+ Multi-user support
+ Auto-scaling
```

---

## Key MVP Decisions That Enable the Full Stack

### Decision 1: FastAPI + Git-based Storage

**Why:**
- Enables MCP wrapping later
- Git commits are your audit trail
- Scales from single machine to distributed

**MVP checkpoint:**
```bash
# This must work:
GET http://localhost:8000/pages/01-project-plan/overview
→ Returns markdown + metadata

POST http://localhost:8000/pages/04-findings/pbc-analysis
→ Saves to git with message "Agent: Added governance analysis"

git log
→ Shows all agent edits with timestamps
```

### Decision 2: Modular LangChain Tools

**Why:**
- New agents don't need new code
- Upgrading one tool doesn't break others
- Agents can be tested independently

**MVP checkpoint:**
```python
# Add a new tool without touching agent:
class PerplexitySearchTool:
    def invoke(self, query):
        return perplexity.search(query)

agent.tools.append(PerplexitySearchTool())
# Agent now has new capability
```

### Decision 3: Embeddings Strategy (OpenAI)

**Why:**
- Consistent across MVP and full stack
- Switching to local embeddings later is just config change
- Agent code doesn't change

**MVP checkpoint:**
```python
# This stays the same forever:
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(embedding_function=embeddings)

# Phase 4, easy swap:
embeddings = HuggingFaceEmbeddings(model="...")
vectorstore = Chroma(embedding_function=embeddings)
# No agent code changes
```

### Decision 4: Docker from Day 1

**Why:**
- Prevents "works on my machine" problems
- Archive is reproducible 5 years later
- Academic credibility

**MVP checkpoint:**
```bash
docker-compose up
# Should work locally
# Should work on colleague's machine
# Should work on cloud VPS
```

---

## What NOT to Build in MVP

### ❌ Don't build Celery yet
- Manual batching (50 docs at a time) is fine
- Agents don't know if task is async or sync
- Switch to Celery in week 5 without touching agent code

### ❌ Don't build Weaviate yet
- Chroma is sufficient for 500+ documents
- Same interface, so switching is trivial
- Learn what search queries you need first

### ❌ Don't build advanced monitoring
- `print()` and logs are enough for MVP
- Add Prometheus later
- Agent code doesn't need to change

### ❌ Don't build multi-user features
- Single-user operation is fine
- Git handles audit trail
- Add auth layer later

### ❌ Don't build API authentication
- Localhost only in MVP
- Add JWTs/OAuth in Month 3
- FastAPI makes this trivial to add

---

## MVP Success Criteria (That Enable Full Stack)

### Week 2 Checkpoint
- [ ] FastAPI running locally
- [ ] Can read/write wiki pages via API
- [ ] Git commits on every write
- [ ] Docker Compose up → everything works

### Week 4 Checkpoint
- [ ] LangChain agent can search wiki + fetch Zotero
- [ ] Agent can consolidate 50 documents into wiki
- [ ] Chroma RAG returns relevant sections
- [ ] Manual deduplication working

### Week 6 Checkpoint
- [ ] Process 200 documents with agents (manual batching)
- [ ] Generate initial dissertation outline from wiki
- [ ] Full audit trail in git history
- [ ] Everything reproducible in Docker

---

## The Scaling Path (No Rework)

```
MVP (Week 6)
├─ 200 docs consolidated
├─ 150 wiki pages created
├─ FastAPI + LangChain + Chroma
└─ Single machine, manual batching

                ↓

Phase 2 (Week 8-10)
├─ Add Celery + Redis
├─ Now: 1000+ docs in parallel
├─ Agent code: UNCHANGED
└─ Same FastAPI, same LangChain

                ↓

Phase 3 (Week 11-12)
├─ Upgrade Chroma → Weaviate
├─ Add monitoring
├─ Agent code: UNCHANGED
└─ Academic suite ready

                ↓

Production (Month 4+)
├─ Multi-user collaboration
├─ Advanced search
├─ Dissertation generation
└─ No architectural rework
```

---

## MVP Scope Summary

**MUST BUILD:**
- FastAPI REST API (40-50 lines)
- LangChain agent base (30-40 lines)
- Chroma RAG integration (20-30 lines)
- Docker Compose (20 lines)
- Git integration (built into FastAPI)
- Manual document consolidation script

**TOTAL MVP EFFORT:** 10-15 engineering hours

**TOTAL MVP CODE:** ~500 lines of Python

**RESULT:** Fully functional research consolidation system that scales to 1000+ documents with architectural additions (no rework)

---

**Next:** Start with RESEARCH_CONSOLIDATION_STRATEGY.md, build the 5 scripts, then integrate with FastAPI/LangChain foundation.
