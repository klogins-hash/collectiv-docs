# Akademik-v1: AI-Native Research & Documentation Architecture

## Executive Summary

A custom-built, open-source system for managing The Collectiv research, academic sourcing, collaborative editing, and AI agent integration.

**Core Stack:**
- **Knowledge Base:** DokuWiki (self-hosted, flat-file, version-controlled)
- **Academic Sourcing:** Zotero (citation management + API)
- **RAG System:** LangChain + Chroma (vector search over wiki content)
- **Agent Framework:** LangChain agents + custom Python orchestration
- **Repository:** Git-backed Markdown + DokuWiki dual system
- **LLM Integration:** Anthropic Claude (primary) + open models (fallback)

---

## 1. KNOWLEDGE BASE LAYER

### ⚠️ IMPORTANT: API-First vs. DokuWiki Tradeoff

**If your use case includes:**
- Multi-tool API access (Claude, agents, external services via MCP)
- Agents editing simultaneously
- Full programmatic control

**See KNOWLEDGE_BASE_COMPARISON.md for detailed analysis.**

**TL;DR:** DokuWiki is suboptimal for API-first + MCP workflows. Consider GitHub + FastAPI + MCP instead (see that doc for full comparison).

---

### Option A: GitHub-based Wiki + FastAPI + MCP (Recommended for Agent-Heavy Workflows)

**Why this if you need API/MCP/agent edits:**
- ✅ Full REST API (agents can read/write)
- ✅ MCP-compatible (Claude, agents can connect)
- ✅ Git-backed (full version control)
- ✅ Open-source, zero vendor lock-in
- ✅ Academic sourcing native
- ✅ Multi-agent concurrent editing with conflict tracking

**Cons:**
- ⚠️ Requires building FastAPI wrapper (~1-2 days)
- ⚠️ No built-in wiki UI (can add MkDocs later)

**See Phase 1 Implementation in this document + examples in KNOWLEDGE_BASE_COMPARISON.md**

---

### Option B: DokuWiki (Recommended for MVP if agents are secondary)

**Why DokuWiki for this project:**
- ✅ Flat-file storage (everything is readable .txt files in Git)
- ✅ Built-in version control + edit history tracking
- ✅ Simple permissions model (can restrict AI vs human edits)
- ✅ MediaWiki-compatible syntax but lighter weight
- ✅ Plugins for integration (Git, commenting, templates)
- ✅ Can be deployed anywhere (self-hosted)
- ✅ Easy to back up and fork
- ✅ Fastest MVP setup (4 hours)

**Cons:**
- ❌ Limited REST API (not ideal for agent workflows)
- ❌ Not MCP-native
- ⚠️ Difficult for multi-tool API access

**Setup:**
```bash
# Self-hosted DokuWiki in Docker
docker run -d -p 8080:80 \
  -v /path/to/dokuwiki/data:/dokuwiki/data \
  -v /path/to/dokuwiki/conf:/dokuwiki/conf \
  linuxserver/dokuwiki
```

**Structure:**
```
wiki/
├── 01-project-plan/
├── 02-theoretical-framework/
├── 03-institutional-design/
├── 04-research-findings/
├── 05-governance-docs/
├── 06-source-library/
└── 07-experiments/
```

**Migration Path:** DokuWiki → export to markdown → GitHub + FastAPI + MCP (Phase 2)

### Option C: Obsidian Publish (Alternative, Less Control)
**Pros:**
- Beautiful UI
- Quick setup
- Good for ideation

**Cons:**
- Vendor-locked
- Limited agent editability
- Source tracking not native

**Verdict:** Good for ideation, but stick with DokuWiki/GitHub for permanent record.

---

## 2. ACADEMIC SOURCING LAYER

### Zotero as Citation Backbone

**Why Zotero:**
- ✅ Open source
- ✅ Collaborative via group libraries
- ✅ API access (can be queried by agents)
- ✅ Export in any citation format
- ✅ Browser plugin for automatic capture
- ✅ PDF annotation + full-text search

**Integration Architecture:**
```
Zotero Library (Source of Truth for Academic References)
     ↓
Zotero API (fetch metadata, DOI, PDF)
     ↓
Custom Python sync script (runs nightly)
     ↓
DokuWiki "Source Library" (human-readable reference pages)
     ↓
RAG Vector DB (indexed with citation metadata)
     ↓
Claude + Agents (cite sources directly from Zotero entries)
```

**Setup:**
```bash
# Install Zotero + set up group library
# Configure API key for read/write access
# Create Python sync script (example below)

import requests
import json

ZOTERO_API_KEY = "YOUR_API_KEY"
ZOTERO_ID = "YOUR_ZOTERO_ID"

def fetch_zotero_library():
    url = f"https://api.zotero.org/users/{ZOTERO_ID}/collections/items"
    headers = {"Zotero-API-Key": ZOTERO_API_KEY}
    response = requests.get(url, headers=headers)
    return response.json()

def sync_to_dokuwiki(items):
    # Convert Zotero items to DokuWiki format
    # Generate markdown with citation metadata
    pass
```

**Citation Format in Wiki:**
```markdown
## Source: Ostrom on Governing the Commons

**Zotero ID:** `ostrom-1990-governing`
**Full Citation:** Ostrom, E. (1990). Governing the Commons: The Evolution of Institutions for Collective Action. Cambridge University Press.
**DOI:** 10.1017/CBO9780511807763
**PDF:** [Link to PDF in Zotero]
**Key Concepts:**
- Polycentric governance
- Design principles for commons
- Trust and reciprocity

**Used in:**
- [[02-theoretical-framework:governance-principles]]
- [[03-institutional-design:pbc-model]]

---
```

---

## 3. RAG (RETRIEVAL-AUGMENTED GENERATION) LAYER

### Architecture

```
DokuWiki Content (all pages)
     ↓
Text extraction + chunking (LangChain)
     ↓
Embedding generation (OpenAI / open-source e5-large)
     ↓
Chroma Vector Database (local or cloud)
     ↓
RAG Retriever (semantic search + BM25 hybrid)
     ↓
Claude / LLM (generates grounded responses)
```

### Setup

**Chroma (recommended for this scale):**
```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load all DokuWiki markdown files
loader = DirectoryLoader("wiki/", glob="**/*.md")
documents = loader.load()

# Split into chunks with metadata
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
    separators=["\n\n", "\n", " "]
)
chunks = splitter.split_documents(documents)

# Embed and store in Chroma
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# Save metadata (source, section, edit history)
for chunk in chunks:
    chunk.metadata = {
        "source": chunk.metadata.get("source"),
        "section": extract_section(chunk),
        "last_edited": get_edit_date(chunk),
        "editor": get_editor(chunk)
    }
```

**Alternative: Weaviate (if you need more sophisticated querying)**
```bash
docker-compose up -d  # Use Weaviate Docker
# More scalable for enterprise features
# Better for multi-modal RAG (text + metadata + structured data)
```

### Query Pattern

```python
def query_rag_with_citations(question: str):
    # Retrieve relevant chunks + sources
    results = vectorstore.similarity_search_with_score(question, k=5)

    # Format for Claude with citation tracking
    context = "\n\n".join([
        f"**Source:** {doc.metadata['source']}\n**Section:** {doc.metadata['section']}\n\n{doc.page_content}"
        for doc, score in results
    ])

    # Query Claude with grounded context
    response = claude.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        system="You are a research assistant. Always cite sources from the provided context.",
        messages=[{
            "role": "user",
            "content": f"Question: {question}\n\nContext:\n{context}"
        }]
    )

    return response.content, [doc.metadata['source'] for doc, _ in results]
```

---

## 4. AGENT FRAMEWORK LAYER

### Architecture

```
User Input (question, task, edit request)
     ↓
LangChain Agent (reasoning engine)
     ↓
Tool Router (decide which tools to use)
     ├─→ RAG Retriever (search wiki)
     ├─→ Zotero API (fetch citations)
     ├─→ DokuWiki Editor (make edits with audit trail)
     ├─→ GitHub (commit changes)
     └─→ Claude (reasoning + generation)
     ↓
Result + Audit Trail (who did what, when, why)
```

### Agent Implementation

```python
from langchain.agents import Tool, initialize_agent, AgentType
from langchain.llms import Anthropic

# Define tools
tools = [
    Tool(
        name="SearchWiki",
        func=query_rag,
        description="Search the wiki for information on a topic"
    ),
    Tool(
        name="FetchCitations",
        func=fetch_from_zotero,
        description="Fetch academic citations from Zotero"
    ),
    Tool(
        name="EditWiki",
        func=edit_wiki_page,
        description="Create or edit a wiki page with audit trail"
    ),
    Tool(
        name="CommitChanges",
        func=commit_to_git,
        description="Commit changes to the git repository"
    ),
    Tool(
        name="SynthesizeResearch",
        func=synthesize_findings,
        description="Synthesize multiple sources into a coherent narrative"
    )
]

# Initialize agent
agent = initialize_agent(
    tools=tools,
    llm=Anthropic(model="claude-3-5-sonnet-20241022"),
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    memory=ConversationBufferMemory(),
    max_iterations=10
)

# Example task
result = agent.run(
    "Research how PBCs handle governance conflicts. "
    "Search our wiki, find academic sources from Zotero, "
    "and create a new wiki page synthesizing findings with citations."
)
```

### Audit Trail Implementation

```python
def edit_wiki_page_with_audit(page_name, content, agent_name, task_description):
    """
    Edit wiki page and create an audit log entry
    """
    timestamp = datetime.now().isoformat()

    # Store edit metadata
    audit_entry = {
        "timestamp": timestamp,
        "editor": agent_name,
        "page": page_name,
        "task": task_description,
        "diff": compute_diff(old_content, content),
        "sources_cited": extract_sources(content)
    }

    # Commit to DokuWiki with history
    dokuwiki_api.save_page(page_name, content, f"[Agent: {agent_name}] {task_description}")

    # Log to audit trail
    append_audit_log(audit_entry)

    # Commit to Git
    run_command(f"git add wiki/{page_name}.md")
    run_command(f"git commit -m '[{agent_name}] {task_description}' --author='{agent_name} <agent@akademik.local>'")

    return audit_entry
```

---

## 5. REPOSITORY & VERSION CONTROL

### Structure

```
Akademik-v1/
├── .git/                          # Git repository
├── wiki/                          # DokuWiki flat files
│   ├── 01-project-plan/
│   ├── 02-framework/
│   └── ...
├── zotero/                        # Exported Zotero library (sync'd)
│   └── library.json
├── agents/                        # Agent definitions & tools
│   ├── research_synthesis.py
│   ├── literature_review.py
│   └── toolkit.py
├── rag/                           # RAG configuration
│   ├── embeddings.py
│   ├── retriever.py
│   └── config.json
├── scripts/                       # Utility scripts
│   ├── sync_zotero.py
│   ├── index_wiki.py
│   └── deploy.sh
├── chroma_db/                     # Vector DB (local)
├── audit_trail.json               # Complete edit history
└── README.md
```

### Git-based Version Control

```bash
# All wiki edits are git commits with metadata
git log --oneline wiki/

# Example output:
# a1b2c3d [Agent: research-bot] Added governance conflict analysis with 5+ academic sources
# d4e5f6g [Human: frank] Minor edits to PBC section
# g7h8i9j [Agent: synthesis-bot] Synthesized literature review on cooperative structures

# Check who edited what
git blame wiki/03-institutional-design/pbc-model.md | head -20

# See full history of a section
git log -p wiki/02-framework/theoretical-framework.md
```

---

## 6. LLM INTEGRATION STRATEGY (Jan 2026)

### Primary: Claude (Anthropic)
```python
from anthropic import Anthropic

client = Anthropic()

# Use project-based context for deep research
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4000,
    system=f"""
    You are a research assistant for The Collectiv project.
    Project Context:
    {load_project_context()}

    When responding:
    1. Always cite sources from the wiki or Zotero
    2. Use the RAG system to ground claims in research
    3. Flag assumptions or areas of uncertainty
    4. Suggest follow-up research questions
    """,
    messages=[...]
)
```

### Secondary: Perplexity (for real-time research)
```python
# Use Perplexity for current academic research, policy updates
# Integrate findings back into RAG system

def search_perplexity_and_sync(research_query: str):
    # Query Perplexity with academic focus
    results = perplexity.search(
        query=research_query,
        mode="academic",
        num_results=10
    )

    # Extract citations
    citations = extract_citations(results)

    # Add to Zotero
    for citation in citations:
        zotero.add_item(citation)

    # Create wiki page with findings
    create_wiki_page(
        title=f"Research: {research_query}",
        content=results,
        sources=citations
    )
```

### Tertiary: Open-source models (for privacy-sensitive data)
```python
# For confidential institutional data, use local models
from transformers import AutoTokenizer, AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b")
# Run locally for sensitive governance discussions
```

---

## 7. COMPARISON: CLAUDE PROJECTS vs. MANUS vs. GEMINI

### Claude Projects
**Current Status (Jan 2026):**
- ✅ Good for collaborative research
- ✅ Can upload PDFs and reference them
- ✅ Multi-file context
- ❌ Limited to Claude ecosystem
- ❌ No academic sourcing built-in
- ❌ Limited version control
- ❌ Not self-hostable

**Verdict:** Great for real-time collaboration, but not suitable as permanent research infrastructure.

### Manus.im
**Current Status (Jan 2026):**
- ✅ Excellent for ideation + brainstorming
- ✅ Real-time collaboration
- ✅ Visual + text mixing
- ❌ Not built for academic sourcing
- ❌ Limited version history
- ❌ More product-focused than research-focused

**Verdict:** Use for ideation sessions, don't rely on it as primary research system.

### Google Gemini Enterprise
**Current Status (Jan 2026):**
- ✅ Competitive with Claude
- ✅ Better image/multimodal handling
- ✅ Vertex AI integration
- ❌ Less mature academic integration
- ❌ Fewer open-source tools available
- ❌ Project features still developing

**Verdict:** Viable but less equipped for this specific use case than Claude + open-source stack.

### Recommended Hybrid Approach
```
┌─────────────────────────────────────────────────────┐
│         Claude Projects (Real-time Collab)          │
└────────────┬────────────────────────────────────────┘
             │ (sync findings daily)
             ↓
┌─────────────────────────────────────────────────────┐
│  Custom DokuWiki + RAG + Agents (Permanent Archive) │
│  - Zotero integration                               │
│  - Git version control                              │
│  - Full audit trail                                 │
│  - Agent editability                                │
└────────────┬────────────────────────────────────────┘
             │ (query as needed)
             ↓
┌─────────────────────────────────────────────────────┐
│      Claude + Perplexity (External Research)        │
│      (new findings feed back into system)            │
└─────────────────────────────────────────────────────┘
```

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1 (Weeks 1-2): Foundation (MVP)
- [ ] Set up self-hosted DokuWiki instance
- [ ] Initialize Git repository with wiki structure
- [ ] Set up Zotero group library + API key
- [ ] Create Python sync script for Zotero → wiki

### Phase 2 (Weeks 3-4): RAG Layer (MVP)
- [ ] Install Chroma vector database
- [ ] Index existing wiki content
- [ ] Build RAG retriever with citation metadata
- [ ] Test Claude queries with grounded context

### Phase 3 (Weeks 5-6): Agent Framework (MVP)
- [ ] Define agent tools (search, cite, edit, commit)
- [ ] Implement audit trail logging
- [ ] Build agent orchestrator
- [ ] Test agent-generated wiki edits

### Phase 4 (Week 7+): Integration & Optimization
- [ ] Connect Claude Projects for real-time collaboration
- [ ] Set up Perplexity sync for new research
- [ ] Build dashboard for audit trail
- [ ] Optimize vector search performance

### Phase 5 (Post-MVP): Project & Task Management
- [ ] Integrate with task tracking system (e.g., Plane, OpenProject, or custom)
- [ ] Build proactive task assignment engine for agents
- [ ] Create personal project dashboard with milestones
- [ ] Agent-driven task prioritization based on research dependencies
- [ ] Calendar sync + deadline tracking for research phases

---

## 9. SECURITY & PERMISSIONS

### File-level Access Control
```python
# DokuWiki permissions
# - Humans: full read/write/delete
# - AI agents: write-only to designated sections
# - Public: read-only to published sections

acl_rules = {
    "01-project-plan/*": {"humans": "rwx", "agents": "w", "public": "r"},
    "04-research-findings/*": {"humans": "rwx", "agents": "w", "public": "r"},
    "07-experiments/*": {"humans": "rwx", "agents": "rw", "public": ""},
}
```

### Audit Trail for Compliance
```json
{
    "timestamp": "2026-01-14T10:30:00Z",
    "actor": "research-synthesis-agent",
    "action": "edit",
    "page": "02-framework/governance-principles",
    "diff": {"added": 450, "removed": 120},
    "sources_cited": ["ostrom-1990", "coase-1937"],
    "authorization": "task_id_12345",
    "hash": "sha256:..."
}
```

---

## 10. DEPLOYMENT OPTIONS

### Option A: Self-Hosted (Recommended)
```bash
# VPS (DigitalOcean, Linode, Hetzner)
# - DokuWiki + Chroma in Docker Compose
# - Cost: $10-20/month
# - Full control, privacy-first

docker-compose up -d
```

### Option B: Hybrid Cloud
```bash
# DokuWiki self-hosted
# Chroma on cloud instance (AWS/GCP)
# Zotero cloud sync
# Git repository on GitHub (private)
```

### Option C: Full Cloud (Least Recommended)
```bash
# Everything managed (less control for customization)
# Higher cost
# Better for teams, less ideal for research infrastructure
```

---

## 11. SUCCESS METRICS

- [ ] All research is traceable to academic sources
- [ ] Complete edit history with actor, timestamp, diff
- [ ] Agents can synthesize research across 50+ wiki pages
- [ ] RAG retrieval accuracy >85% with citation grounding
- [ ] Zero data loss / Git history is complete & recoverable
- [ ] Academic advisor can cite wiki directly (with version pinning)

---

## Next Steps

1. **Week 1:** Set up DokuWiki + Git repository
2. **Week 2:** Migrate all ChatGPT conversation into wiki structure
3. **Week 3:** Index everything into Chroma
4. **Week 4:** Build first agent for literature synthesis
5. **Week 5+:** Iterate & scale

---

**Questions?** This document is living. We refine as you build.
