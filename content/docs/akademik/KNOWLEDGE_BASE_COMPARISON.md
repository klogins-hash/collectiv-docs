# Knowledge Base Comparison: DokuWiki vs. Modern Alternatives

## Your Key Requirements
1. **API-first access** from multiple tools (Claude, agents, external services)
2. **MCP integration** for tool connectivity
3. **Full edits anytime** from any connected service
4. **Open-source & customizable** (not vendor-locked)
5. **Academic-grade sourcing** with citations

---

## The Honest Assessment: DokuWiki is Not Optimal for Your Use Case

If your primary interaction model is **agents + multi-tool API access + MCP**, then DokuWiki has significant limitations:

| Feature | DokuWiki | Rating |
|---------|----------|--------|
| REST API | Basic, limited | ❌ Poor |
| MCP Server Support | None native | ❌ Poor |
| Agent-friendly | Requires wrapper | ⚠️ Mediocre |
| Real-time multi-tool edits | Difficult | ❌ Poor |
| Self-hosted | ✅ Yes | ✅ Good |
| Open-source | ✅ Yes | ✅ Good |
| Academic sourcing | Manual | ⚠️ Mediocre |
| Learning curve | Low | ✅ Good |

---

## Better Alternatives for Your Workflow

### **Option 1: GitHub-based Wiki + Custom FastAPI Wrapper (Recommended)**

**Architecture:**
```
Git Repo (markdown files)
     ↓
FastAPI wrapper (read/write endpoints)
     ↓
MCP Server (exposes endpoints to Claude/agents)
     ↓
Multiple tools (Claude, agents, IDE, etc.)
```

**Pros:**
- ✅ Full version control (git)
- ✅ Easy API layer (build custom FastAPI)
- ✅ MCP-compatible
- ✅ Open-source
- ✅ Agents can read/write programmatically
- ✅ Zero vendor lock-in
- ✅ Integrates with GitHub (private repo)
- ✅ Academic sourcing native (markdown + git history)

**Cons:**
- ⚠️ No built-in wiki UI (need to build or use simple frontend)
- ⚠️ Self-hosted FastAPI server required

**Setup Complexity:** Medium (FastAPI knowledge needed)

**Cost:** Minimal ($0-10/month for VPS if needed)

---

### **Option 2: Notion + Custom MCP Bridge**

**Architecture:**
```
Notion (API-first)
     ↓
Custom Python MCP server (wrapper)
     ↓
Claude/Agents via MCP
```

**Pros:**
- ✅ Beautiful UI built-in
- ✅ Powerful Notion API
- ✅ Real-time collaboration
- ✅ MCP bridge is easy to build
- ✅ Can query/edit from agents instantly

**Cons:**
- ❌ Vendor-locked (Notion Inc. controls infrastructure)
- ❌ Not truly open-source
- ❌ Rate limits on API
- ⚠️ Academic sourcing not native
- ⚠️ Less durable than git-backed system

**Setup Complexity:** Low (Notion API well documented)

**Cost:** $10-20/month for Notion + API calls

---

### **Option 3: Obsidian Vault + Custom API**

**Architecture:**
```
Obsidian vault (local markdown)
     ↓
Custom FastAPI + Obsidian plugin
     ↓
MCP Server
     ↓
Remote agent access
```

**Pros:**
- ✅ Beautiful UI (Obsidian)
- ✅ Local-first (powerful)
- ✅ Can sync to git
- ✅ Can build MCP wrapper
- ✅ Highly customizable

**Cons:**
- ⚠️ Requires Obsidian license for sync ($10/month) or self-host sync
- ⚠️ More complex setup than pure git
- ❌ Not designed for multi-user agent editing
- ⚠️ Obsidian plugin ecosystem is closed

**Setup Complexity:** Medium-High

**Cost:** $10/month (Obsidian) + infrastructure

---

### **Option 4: MkDocs + FastAPI + Git (Strong Alternative)**

**Architecture:**
```
Git repo (markdown + MkDocs config)
     ↓
FastAPI wrapper (read/write to git)
     ↓
MCP Server
     ↓
Claude/Agents/Tools
     ┌─ Also serves: http://localhost:8000/docs (MkDocs site)
```

**Pros:**
- ✅ MkDocs is lightweight & fast
- ✅ Easy API layer on top
- ✅ Git-backed (full version control)
- ✅ Beautiful documentation site auto-generated
- ✅ Open-source, zero vendor lock-in
- ✅ Great for academic writing
- ✅ MCP-compatible

**Cons:**
- ⚠️ No real-time collaborative editing UI
- ⚠️ Requires building API layer
- ⚠️ Self-hosted FastAPI needed

**Setup Complexity:** Medium

**Cost:** Minimal ($0-5/month)

---

## Side-by-Side Comparison

| Feature | GitHub + FastAPI | Notion + MCP | Obsidian + API | MkDocs + FastAPI | DokuWiki |
|---------|------------------|--------------|----------------|------------------|----------|
| **API-first** | ✅ Yes | ✅ Yes | ⚠️ Partial | ✅ Yes | ❌ No |
| **MCP native** | ✅ Build once | ✅ Easy bridge | ⚠️ Possible | ✅ Yes | ❌ No |
| **Agent edits** | ✅ Full | ✅ Full | ⚠️ Limited | ✅ Full | ❌ Limited |
| **Multi-tool** | ✅ Designed for it | ✅ Designed for it | ⚠️ Possible | ✅ Designed for it | ❌ Not designed |
| **Open-source** | ✅ Yes | ❌ No | ❌ Closed | ✅ Yes | ✅ Yes |
| **Self-hosted** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Academic sourcing** | ✅ Native | ⚠️ Manual | ✅ Native | ✅ Native | ⚠️ Manual |
| **Version control** | ✅ Git | ❌ Notion | ⚠️ Optional | ✅ Git | ⚠️ Weak |
| **Durability** | ✅ Permanent | ⚠️ Depends on Notion | ✅ Permanent | ✅ Permanent | ✅ Permanent |
| **Setup time** | 1-2 days | 2 hours | 1 day | 1 day | 4 hours |
| **Cost** | $0-10/mo | $10-20/mo | $10+/mo | $0-5/mo | $0-10/mo |

---

## My Recommendation: GitHub + FastAPI + MCP

**For your specific use case**, I'd recommend:

**GitHub-based Wiki + Python FastAPI wrapper + MCP Server**

Why?
1. **You get API-first architecture** - agents can read/write instantly
2. **You get MCP integration** - any MCP-compatible tool can connect
3. **You get open-source** - never locked in
4. **You get git-backed** - complete version history, branches, rollback
5. **You get academic sourcing** - Zotero can sync to git repo
6. **You get agent collaboration** - multiple agents editing simultaneously with conflict tracking
7. **You get cheap** - essentially free if self-hosted
8. **You preserve flexibility** - can add UI later (MkDocs, Obsidian, custom frontend) without changing backend

---

## Minimal Working Example: GitHub + FastAPI + MCP

Here's what you'd build:

```python
# fastapi_wiki_server.py
from fastapi import FastAPI
from pydantic import BaseModel
import git
import os

app = FastAPI()
repo = git.Repo("/path/to/wiki/repo")

class WikiPage(BaseModel):
    path: str
    content: str
    message: str

@app.get("/pages/{page_path}")
async def read_page(page_path: str):
    """REST API: read page"""
    with open(f"./wiki/{page_path}.md") as f:
        return {"content": f.read()}

@app.post("/pages/{page_path}")
async def write_page(page_path: str, page: WikiPage):
    """REST API: write page (called by agents, MCP server, etc.)"""
    with open(f"./wiki/{page_path}.md", "w") as f:
        f.write(page.content)

    # Commit to git
    repo.index.add([f"wiki/{page_path}.md"])
    repo.index.commit(f"[Agent] {page.message}")
    return {"status": "saved"}

@app.get("/search")
async def search(q: str):
    """Full-text search across all pages"""
    # Your RAG/search logic here
    pass
```

Then wrap this in an **MCP Server** (Claude protocol):

```python
# mcp_server.py
from mcp.server import Server
from mcp.types import Tool

server = Server("akademik-wiki")

@server.read_page
async def get_page(path: str):
    """MCP tool: Read wiki page"""
    response = await httpx.get(f"http://localhost:8000/pages/{path}")
    return response.json()["content"]

@server.write_page
async def edit_page(path: str, content: str, message: str):
    """MCP tool: Write wiki page with git commit"""
    await httpx.post(f"http://localhost:8000/pages/{path}",
        json={"content": content, "message": message})
    return "Page updated"
```

**Then Claude uses it:**
```
Claude (via MCP): "Read the PBC governance section"
→ MCP server calls FastAPI
→ FastAPI reads from git repo
→ Claude gets: "====== PBC Governance ======..."

Claude (via agent): "Update the governance section with new findings"
→ MCP writes_page()
→ FastAPI updates .md file
→ Git commits with "Agent: Added governance conflicts analysis"
```

---

## Decision Matrix

**Choose GitHub + FastAPI if:**
- You want agents to have full editing capability
- You need MCP integration
- You want version control
- You want full open-source control
- You can spend 1-2 days on setup

**Choose Notion + MCP bridge if:**
- You want UI out-of-the-box
- You're comfortable with vendor lock-in
- You want fastest implementation
- Team collaboration matters more than durability

**Choose Obsidian + API if:**
- You love Obsidian locally
- You want beautiful UI + open-source (accept license cost)
- You don't mind custom integration work

**Stick with DokuWiki if:**
- You want the fastest MVP possible
- Agents are secondary to human research workflow
- API/MCP not critical in Phase 1
- Can upgrade later

---

## Hybrid Approach (My Actual Recommendation)

**Start with DokuWiki for Phase 1** (MVP, weeks 1-6):
- Humans add research
- Manual wiki editing
- Simple RAG system

**Then upgrade to GitHub + FastAPI in Phase 2** (agent integration):
- Export DokuWiki to markdown
- Build FastAPI wrapper
- Expose MCP server
- Agents can edit anywhere

This gives you:
- ✅ Fast MVP (DokuWiki is quick)
- ✅ Upgrade path when ready
- ✅ No sunk costs (can migrate)
- ✅ Tests agent needs before heavy build

---

## Final Answer

**Short version:** You're right to question DokuWiki. For your use case (API-first, MCP, multi-tool edits), **GitHub + FastAPI + MCP is superior**. But DokuWiki is fine for MVP Phase 1 if you want speed. Start there, migrate to GitHub + FastAPI when you need agents.

---

**Want me to build the GitHub + FastAPI + MCP setup now, or stick with DokuWiki for MVP?**
