---
title: Akademik-v1 MVP Implementation Guide
description: The Collectiv documentation
---

# Akademik-v1 MVP Implementation Guide

## Quick Start (MVP Phase - Weeks 1-6)

This guide walks you through setting up the core research infrastructure without project management complexity. Focus on getting DokuWiki + RAG + Agents working first.

---

## Prerequisites

```bash
# Install required tools
brew install docker docker-compose git python3 curl

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Step 1: Initialize Repository Structure

```bash
cd /Users/franksimpson/CascadeProjects/Akademik-v1

# Create folder structure
mkdir -p wiki/{01-project-plan,02-theoretical-framework,03-institutional-design,04-research-findings,05-governance-docs,06-source-library,07-experiments}
mkdir -p agents scripts rag zotero

# Create initial files
touch wiki/README.md
touch agents/toolkit.py agents/research_synthesis.py
touch rag/embeddings.py rag/retriever.py rag/config.json
touch scripts/sync_zotero.py scripts/index_wiki.py
touch .gitignore requirements.txt docker-compose.yml
```

---

## Step 2: Set Up DokuWiki in Docker

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  dokuwiki:
    image: linuxserver/dokuwiki:latest
    container_name: akademik-dokuwiki
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/Chicago
    volumes:
      - ./wiki/dokuwiki/data:/dokuwiki/data
      - ./wiki/dokuwiki/conf:/dokuwiki/conf
    ports:
      - "8080:80"
    restart: unless-stopped

  chroma:
    image: ghcr.io/chroma-core/chroma:latest
    container_name: akademik-chroma
    ports:
      - "8000:8000"
    volumes:
      - ./chroma_db:/chroma/data
    restart: unless-stopped
```

**Start services:**

```bash
docker-compose up -d

# Wait ~30 seconds for Dokuwiki to initialize
sleep 30

# Access DokuWiki at http://localhost:8080
# Create admin user when prompted
```

---

## Step 3: Configure Zotero Integration

1. **Install Zotero Desktop** (if not already done)
   ```bash
   brew install zotero
   ```

2. **Create Zotero account** at zotero.org if needed

3. **Generate API key:**
   - Go to zotero.org → Settings → Feeds/API
   - Create new API key with full permissions
   - Save as environment variable

4. **Create sync script** (`scripts/sync_zotero.py`):

```python
import requests
import json
import os
from datetime import datetime

ZOTERO_API_KEY = os.getenv("ZOTERO_API_KEY")
ZOTERO_USER_ID = os.getenv("ZOTERO_USER_ID")
DOKUWIKI_DATA_DIR = "./wiki/dokuwiki/data/pages/06-source-library"

def fetch_zotero_items():
    """Fetch items from Zotero library"""
    url = f"https://api.zotero.org/users/{ZOTERO_USER_ID}/items"
    headers = {"Zotero-API-Key": ZOTERO_API_KEY}
    response = requests.get(url, headers=headers)
    return response.json()

def create_wiki_page(item):
    """Convert Zotero item to DokuWiki page"""
    title = item.get("data", {}).get("title", "Untitled")
    authors = item.get("data", {}).get("creators", [])
    doi = item.get("data", {}).get("DOI", "")
    url = item.get("data", {}).get("url", "")

    author_str = ", ".join([c.get("name", "") for c in authors]) or "Unknown"

    content = f"""====== {title} ======

**Authors:** {author_str}
**Added:** {datetime.now().strftime('%Y-%m-%d')}

===== Metadata =====
^ Key ^ Value ^
| DOI | {doi} |
| URL | {url} |

===== Concepts =====
(Add key concepts here)

===== References to =====
(Add wiki pages that reference this source)

---

"""
    return content

def sync_to_dokuwiki():
    """Sync Zotero library to DokuWiki"""
    items = fetch_zotero_items()
    os.makedirs(DOKUWIKI_DATA_DIR, exist_ok=True)

    for item in items:
        if item.get("data", {}).get("itemType") == "book":
            title = item.get("data", {}).get("title", "untitled")
            page_name = title.lower().replace(" ", "_")[:50]
            page_path = f"{DOKUWIKI_DATA_DIR}/{page_name}.txt"

            with open(page_path, "w") as f:
                f.write(create_wiki_page(item))

            print(f"✓ Synced: {title}")

if __name__ == "__main__":
    sync_to_dokuwiki()
    print("Zotero sync complete!")
```

**Run sync:**
```bash
export ZOTERO_API_KEY="your_api_key_here"
export ZOTERO_USER_ID="your_user_id_here"
python scripts/sync_zotero.py
```

---

## Step 4: Set Up RAG Infrastructure

Create `requirements.txt`:

```txt
langchain==0.1.0
chroma-db==0.4.0
openai==1.0.0
anthropic==0.7.0
requests==2.31.0
python-dotenv==1.0.0
```

Create `rag/retriever.py`:

```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os

class WikiRetriever:
    def __init__(self, wiki_path="./wiki", chroma_path="./chroma_db"):
        self.wiki_path = wiki_path
        self.chroma_path = chroma_path
        self.vectorstore = None
        self.retriever = None

    def index_wiki(self):
        """Load and index all wiki markdown files"""
        print("Loading wiki documents...")
        loader = DirectoryLoader(self.wiki_path, glob="**/*.md")
        documents = loader.load()

        print(f"Loaded {len(documents)} documents. Chunking...")
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
            separators=["

", "
", " "]
        )
        chunks = splitter.split_documents(documents)

        print(f"Created {len(chunks)} chunks. Embedding...")
        embeddings = OpenAIEmbeddings(
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )

        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=self.chroma_path
        )

        self.retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        print("✓ Wiki indexed successfully!")

    def query(self, question: str):
        """Query wiki with RAG"""
        if not self.retriever:
            raise ValueError("Retriever not initialized. Run index_wiki() first.")

        results = self.retriever.get_relevant_documents(question)
        return results

if __name__ == "__main__":
    retriever = WikiRetriever()
    retriever.index_wiki()
```

---

## Step 5: Create Basic Agent

Create `agents/research_synthesis.py`:

```python
from langchain.agents import Tool, initialize_agent, AgentType
from langchain.chat_models import ChatAnthropic
from langchain.memory import ConversationBufferMemory
from rag.retriever import WikiRetriever
import os

class ResearchAgent:
    def __init__(self):
        self.retriever = WikiRetriever()
        self.retriever.index_wiki()
        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        self.memory = ConversationBufferMemory(memory_key="chat_history")

    def search_wiki(self, query: str):
        """Search wiki for information"""
        results = self.retriever.query(query)
        return "

".join([doc.page_content for doc in results])

    def synthesize_research(self, topic: str):
        """Synthesize research across multiple sources"""
        query = f"comprehensive research on {topic}"
        context = self.search_wiki(query)

        prompt = f"""
You are a research assistant for The Collectiv project.
Synthesize the following research into a coherent summary with citations.

Topic: {topic}

Context from wiki:
{context}

Please provide:
1. Key findings (with source citations)
2. Important distinctions
3. Open questions
4. Recommended next research steps
"""

        response = self.llm.predict(prompt)
        return response

    def create_research_page(self, title: str, content: str):
        """Create new wiki page with research"""
        # This would integrate with DokuWiki API
        page_name = title.lower().replace(" ", "_")
        wiki_path = f"./wiki/04-research-findings/{page_name}.md"

        with open(wiki_path, "w") as f:
            f.write(f"# {title}

")
            f.write(f"*Generated: {datetime.now().isoformat()}*

")
            f.write(content)

        print(f"✓ Created: {wiki_path}")
        return wiki_path

if __name__ == "__main__":
    agent = ResearchAgent()
    result = agent.synthesize_research("PBC governance structures")
    print(result)
```

---

## Step 6: Make Initial Git Commit

```bash
# Create .gitignore
cat > .gitignore << 'EOF'
venv/
__pycache__/
.DS_Store
chroma_db/
wiki/dokuwiki/data/
wiki/dokuwiki/conf/
.env
*.pyc
.vscode/
EOF

# Create requirements.txt (if not done)
pip freeze > requirements.txt

# Initial commit
git add -A
git commit -m "Initialize Akademik-v1: DokuWiki + RAG + Agent infrastructure (MVP)"

git log --oneline
```

---

## Step 7: Test the Pipeline (Manual)

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Access DokuWiki
# http://localhost:8080
# Create a few test pages in wiki/

# 3. Set environment variables
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export ZOTERO_API_KEY="your_api_key"
export ZOTERO_USER_ID="your_user_id"

# 4. Index wiki and test RAG
python3 << 'EOF'
from rag.retriever import WikiRetriever

retriever = WikiRetriever()
retriever.index_wiki()

# Test query
results = retriever.query("What is a PBC?")
print(f"Found {len(results)} relevant sections")
for r in results:
    print(f"- {r.metadata['source']}")
EOF

# 5. Test agent (once you have wiki content)
python3 agents/research_synthesis.py
```

---

## Step 8: Populate Initial Wiki Content

Create a starter structure:

**`wiki/01-project-plan/README.md`:**
```markdown
# The Collectiv: Project Plan

## Vision
Cooperative institutional framework enabling creators to achieve lifecycle wealth stability.

## Core Research Questions
- How can cooperative institutional design enable lifecycle wealth stability?
- What governance mechanisms prevent value extraction?
- Why are PBCs more protected than DAOs or pure cooperatives?

## Related Pages
- [[03-institutional-design:pbc-structure]]
- [[02-theoretical-framework:ostrom-principles]]
```

**`wiki/02-theoretical-framework/ostrom-principles.md`:**
```markdown
# Ostrom's Design Principles for Commons

## Source
Ostrom, E. (1990). *Governing the Commons: The Evolution of Institutions for Collective Action*.

## Principles
1. Clear boundaries
2. Proportional equivalence between benefits and costs
3. Collective-choice arrangements
4. Monitoring
5. Graduated sanctions
6. Conflict-resolution mechanisms
7. Minimal recognition of rights
8. Nested enterprises (for large-scale economies)

## Application to Collectiv
- **Principle 1:** Clear membership criteria, 1 member = 1 vote
- **Principle 2:** Contribution-adjusted capital distribution
- **Principle 3:** Democratic governance with optional delegation
```

---

## Daily Workflow (After MVP Setup)

Once the infrastructure is running:

1. **Add research:** Create new `.md` files in appropriate `wiki/` folders
2. **Index periodically:** Run `python scripts/index_wiki.py` to refresh RAG
3. **Query your research:** Use agent to synthesize across pages
4. **Commit changes:** `git add wiki/ && git commit -m "[research] Added X"`
5. **Sync Zotero:** Run `python scripts/sync_zotero.py` weekly

---

## Troubleshooting

### Dokuwiki not starting?
```bash
docker-compose logs dokuwiki
docker-compose restart dokuwiki
```

### Chroma connection issues?
```bash
# Check if Chroma is running
curl http://localhost:8000/api/v1/heartbeat

# Restart Chroma
docker-compose restart chroma
```

### RAG not finding documents?
```bash
# Verify wiki files exist
ls -la wiki/*/

# Re-index
rm -rf chroma_db/
python scripts/index_wiki.py
```

---

## Next Phase (Post-MVP)

Once this is working smoothly, we'll add:
- **Perplexity integration** for real-time research
- **Project management** with task assignment
- **Advanced agents** for specific research workflows
- **Dashboard** for audit trails and progress

---

## Files Generated

After completing this MVP:
- `/Users/franksimpson/CascadeProjects/Akademik-v1/wiki/` (documents)
- `/Users/franksimpson/CascadeProjects/Akademik-v1/chroma_db/` (vector database)
- `/Users/franksimpson/CascadeProjects/Akademik-v1/.git/` (version history)
- `/Users/franksimpson/CascadeProjects/Akademik-v1/agents/` (Python agents)
- `/Users/franksimpson/CascadeProjects/Akademik-v1/rag/` (RAG system)

---

**You're ready to start!** 🚀

Start with Step 1 and work through sequentially. Reach out if you hit any issues.