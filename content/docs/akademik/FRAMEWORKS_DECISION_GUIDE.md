# Frameworks Decision Guide for Akademik-v1

Based on your architecture needs (GitHub + FastAPI + MCP, agent orchestration, 1000-document consolidation), here are the critical framework choices and my recommendations.

---

## 1. API FRAMEWORK (for FastAPI wrapper)

### Top Contenders

| Framework | Setup Time | Learning Curve | Performance | API Documentation | MCP Compatible |
|-----------|-----------|-----------------|-------------|-------------------|-----------------|
| **FastAPI** | 1 hour | Low | ⚡ Excellent | Auto (Swagger/OpenAPI) | ✅ Native |
| Flask | 30 mins | Very Low | Good | Manual | ⚠️ Possible |
| Django | 2 hours | Medium | Good | Manual | ⚠️ Possible |
| Quart (async Flask) | 1.5 hours | Low | Good | Manual | ⚠️ Possible |

### Recommendation: **FastAPI**

**Why:**
- ✅ Built for async/concurrent operations (perfect for agents)
- ✅ Auto-generates OpenAPI docs (industry standard)
- ✅ Type hints force clean code (academic credibility)
- ✅ Easy to expose as MCP server
- ✅ Minimal boilerplate

**Code snippet:**
```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="Akademik-v1 Wiki API")

@app.get("/pages/{page_id}")
async def read_page(page_id: str):
    """Read wiki page"""
    return {"content": read_from_git(page_id)}

@app.post("/pages/{page_id}")
async def edit_page(page_id: str, content: str, message: str):
    """Edit wiki page with git commit"""
    save_and_commit(page_id, content, message)
    return {"status": "saved"}
```

---

## 2. AGENT ORCHESTRATION FRAMEWORK

### Top Contenders

| Framework | Maturity | Learning Curve | Use Case | Multi-Agent | Customization |
|-----------|----------|-----------------|----------|------------|---------------|
| **LangChain** | Mature | Medium | General agents | ✅ Yes | ✅ Excellent |
| AutoGen | Emerging | High | Multi-agent teams | ✅ Yes (specialty) | ⚠️ Limited |
| CrewAI | New | Medium | Structured teams | ✅ Yes | Partial |
| Haystack | Mature | Medium | RAG pipelines | ✅ Limited | Good |
| Custom (no framework) | N/A | High | Specific needs | ✅ Maximum | ✅ Maximum |

### Recommendation: **LangChain** (with option to go custom for advanced needs)

**Why:**
- ✅ Most mature ecosystem
- ✅ Best documentation & community
- ✅ Easy MCP integration
- ✅ Excellent for RAG + agent workflows
- ✅ Works well with Claude
- ✅ Can extend for your specific needs

**Your use case fits perfectly:**
```python
from langchain.agents import Tool, initialize_agent
from langchain.chat_models import ChatAnthropic

# Your consolidation agent
tools = [
    Tool(name="SearchWiki", func=search_rag),
    Tool(name="FetchZotero", func=fetch_citations),
    Tool(name="EditWiki", func=edit_wiki_page),
    Tool(name="CommitGit", func=commit_to_git)
]

agent = initialize_agent(
    tools=tools,
    llm=ChatAnthropic(model="claude-3-5-sonnet-20241022"),
    agent_type="structured-chat-zero-shot-react"
)
```

**Alternative consideration:** If you later want multi-agent orchestration (e.g., "research team" of specialized agents), you could graduate to **AutoGen** or **CrewAI**, but LangChain can handle this too.

---

## 3. VECTOR DATABASE / RAG FRAMEWORK

### Top Contenders

| DB | Query Performance | Scalability | Setup Complexity | MCP Ready | Cost |
|-------|------------------|-------------|------------------|-----------|------|
| **Chroma** | Good | Good (embedded) | ⭐ Easiest | ✅ Easy | Free |
| Weaviate | Excellent | Excellent | ⭐⭐ Medium | ✅ Yes | Free/Pro |
| Pinecone | Excellent | Excellent | Easy | ✅ Yes | $$$$ |
| Qdrant | Excellent | Excellent | Medium | ✅ Yes | Free/Cloud |
| Milvus | Excellent | Excellent | Hard | ⚠️ Possible | Free |

### Recommendation: **Chroma** for MVP, **Weaviate** if you need scale

**Chroma - Best for MVP (your Phase 1-2):**
```python
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

vectorstore = Chroma(
    embedding_function=OpenAIEmbeddings(),
    persist_directory="./chroma_db"
)

# Search
results = vectorstore.similarity_search(query)
```

**Why Chroma:**
- ✅ Zero infrastructure (embedded database)
- ✅ Fast to prototype
- ✅ Persistent storage
- ✅ Perfect for 1000-5000 documents
- ✅ Free & open-source

**Weaviate - If you outgrow Chroma:**
- Better for 10k+ documents
- Advanced querying (hybrid search, metadata filters)
- Better for multi-user concurrent access
- Enterprise features

---

## 4. DOCUMENT PROCESSING FRAMEWORK

### For Consolidating 1000+ Documents

| Tool | Purpose | Integration | Recommendation |
|------|---------|-------------|-----------------|
| **LangChain** | Document loading & chunking | Native to your agent stack | ✅ Use this |
| LLamaIndex | RAG optimization | Alternative to LangChain | ⚠️ Similar capability |
| PyPDF2 | PDF extraction | Standalone utility | ✅ Use for PDF-specific |
| Tesseract | OCR (scanned PDFs) | CLI tool | ✅ Use for scans |
| Unstructured | Multi-format parsing | Standalone | ⚠️ Overkill for your case |

### Recommendation: **LangChain loaders + PyPDF2 + Tesseract**

**Why this combination:**
```python
from langchain.document_loaders import DirectoryLoader, PDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load all markdown files
loader = DirectoryLoader("./documents", glob="**/*.md")
documents = loader.load()

# Load PDFs with OCR fallback
pdf_loader = PDFLoader("document.pdf")

# Smart chunking
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100
)
chunks = splitter.split_documents(documents)
```

---

## 5. LLM / AI FRAMEWORK CHOICES

### Your Consolidation Workflow

| Task | LLM Choice | Reasoning |
|------|-----------|-----------|
| **Document analysis** | Claude 3.5 Sonnet | Best at reasoning over academic text |
| **Deduplication** | Claude 3.5 Sonnet | Better semantic understanding |
| **Wiki generation** | Claude 3.5 Sonnet | Excellent at structured output |
| **Dissertation outline** | Claude 3.5 Sonnet | Strategic thinking |
| **Real-time search** | Perplexity | Current information |
| **Sensitive discussions** | Llama 2 (local) | Privacy-first |

### Recommendation: **Claude via Anthropic API (primary) + fallbacks**

**Why Claude:**
- ✅ Best at long-context reasoning (critical for your use case)
- ✅ 100K token context window (fit entire wiki sections)
- ✅ Excels at academic writing
- ✅ Excellent MCP integration
- ✅ Cost reasonable for batch operations

**Setup:**
```python
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4000,
    messages=[{"role": "user", "content": "analyze this research..."}]
)
```

---

## 6. INFRASTRUCTURE & DEPLOYMENT

### Your Setup Needs

| Component | Framework | Why |
|-----------|-----------|-----|
| **Containerization** | Docker | Industry standard, easy scaling |
| **Orchestration** | Docker Compose | Simple, single-machine setup |
| **VCS** | Git + GitHub | Version control + audit trail |
| **CI/CD** | GitHub Actions | Free, native integration |
| **Monitoring** | Prometheus + Grafana | Open-source, self-hosted |
| **Task Queuing** | Celery + Redis | Async job processing for batch consolidation |

### Recommendation: **Docker + Docker Compose + GitHub + Celery**

**Why this stack:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"

  chroma:
    image: ghcr.io/chroma-core/chroma
    ports:
      - "8001:8000"

  redis:
    image: redis:latest
    ports:
      - "6379:6379"

  # Celery worker for batch consolidation
  celery_worker:
    build: .
    command: celery -A tasks worker --loglevel=info
```

---

## 7. COMPLETE STACK RECOMMENDATION

### For Akademik-v1 (Your Use Case)

```
┌─────────────────────────────────────────┐
│  FastAPI (REST API + MCP Server)        │
├─────────────────────────────────────────┤
│  LangChain (Agent Orchestration)        │
│  ├─ Tools: RAG, Zotero, Git, Wiki edit │
│  └─ LLM: Claude 3.5 Sonnet              │
├─────────────────────────────────────────┤
│  Chroma (Vector DB / RAG)               │
│  OpenAI Embeddings (text → vectors)     │
├─────────────────────────────────────────┤
│  Document Processing                    │
│  ├─ LangChain loaders (all formats)     │
│  ├─ PyPDF2 (PDFs)                       │
│  └─ Tesseract (OCR)                     │
├─────────────────────────────────────────┤
│  Infrastructure                         │
│  ├─ Docker + Docker Compose             │
│  ├─ Celery + Redis (async tasks)        │
│  ├─ Git + GitHub (version control)      │
│  └─ GitHub Actions (CI/CD)              │
├─────────────────────────────────────────┤
│  Data Layer                             │
│  ├─ Git repo (primary storage)          │
│  ├─ Zotero (academic sources)           │
│  └─ Local FS (working documents)        │
└─────────────────────────────────────────┘
```

---

## 8. DECISION MATRIX: Quick Reference

### Complexity vs. Capability

```
SIMPLE & FAST                    COMPLEX & POWERFUL
├─ Framework only solution       ├─ Custom orchestration
│  (minimal coding)              │  (maximum control)
│                                │
├─ DokuWiki                      ├─ GitHub + FastAPI
├─ LangChain agents             ├─ Custom agent framework
├─ Chroma                       ├─ Weaviate + Advanced RAG
└─ All pre-built                └─ Fully custom stack
```

**Your position: LEFT-CENTER** (maximize existing frameworks, minimal custom code)

---

## 9. TIMELINE TO DEPLOYMENT

| Phase | Frameworks | Timeline | Dev Hours |
|-------|-----------|----------|-----------|
| **Phase 1: MVP (Week 1-2)** | FastAPI + LangChain + Chroma | 2 weeks | 10-15 hrs |
| **Phase 2: Scale (Week 3-4)** | Add Celery + Docker Compose | 2 weeks | 8-10 hrs |
| **Phase 3: Optimize (Week 5-6)** | Monitoring + Weaviate migration | 2 weeks | 5-8 hrs |

---

## 10. FRAMEWORK-SPECIFIC SETUP GUIDE

### FastAPI
```bash
pip install fastapi uvicorn
```

### LangChain
```bash
pip install langchain langchain-anthropic langchain-community
```

### Chroma
```bash
pip install chromadb
```

### Celery + Redis
```bash
pip install celery redis
brew install redis  # macOS
```

### Docker
```bash
brew install docker  # macOS
```

---

## FINAL RECOMMENDATION SUMMARY

| Layer | Framework | Rationale |
|-------|-----------|-----------|
| **API** | FastAPI | Type-safe, async-ready, auto-docs |
| **Agents** | LangChain | Mature, MCP-compatible, Claude-native |
| **RAG** | Chroma (MVP) → Weaviate (scale) | Start simple, upgrade seamlessly |
| **Document Processing** | LangChain loaders + PyPDF2 | Unified tooling |
| **LLM** | Claude 3.5 Sonnet | Best for academic consolidation |
| **Infrastructure** | Docker + Compose | Reproducible, portable |
| **Async Queue** | Celery + Redis | Batch document processing |
| **VCS** | Git + GitHub | Permanent audit trail |

---

## NEXT STEPS

**Immediate (Day 1-2):**
1. Set up FastAPI project
2. Create basic REST endpoints
3. Test with sample documents

**Short-term (Week 1):**
4. Integrate LangChain agents
5. Connect Chroma for RAG
6. Consolidate first 10 documents

**Medium-term (Week 2-4):**
7. Scale to 1000 documents with Celery
8. Implement Zotero sync
9. Build wiki page generator

**Do you want me to start building the FastAPI scaffold + LangChain agent setup?**
