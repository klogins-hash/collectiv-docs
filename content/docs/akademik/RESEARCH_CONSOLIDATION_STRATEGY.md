---
title: Consolidating 1000+ Documents into a Reliable Wiki
description: The Collectiv documentation
---

# Consolidating 1000+ Documents into a Reliable Wiki

## Your Situation

You have ~1000 scattered documents/conversations containing:
- ChatGPT conversations (multi-turn dialogue)
- Research notes
- Email threads
- Voice notes transcribed
- PDFs with annotations
- Notion pages, docs, spreadsheets
- Slack/Discord transcripts
- Various file formats

**Goal:** Distill into a coherent, academic-grade wiki + dissertation-ready research repository

**Timeline:** 4-8 weeks with proper automation

---

## Phase 1: Inventory & Triage (Week 1)

### Step 1: Collect All Documents

```bash
# Create data inventory script
cat > scripts/collect_documents.py << 'EOF'
import os
import json
from pathlib import Path
from datetime import datetime

def scan_directories(scan_paths):
    """Scan multiple directories for all documents"""
    documents = []

    # Scan common locations
    for base_path in scan_paths:
        for root, dirs, files in os.walk(base_path):
            for file in files:
                file_path = Path(root) / file
                stat = file_path.stat()

                documents.append({
                    "path": str(file_path),
                    "name": file,
                    "size_bytes": stat.st_size,
                    "last_modified": stat.st_mtime,
                    "type": file.split('.')[-1] if '.' in file else "unknown"
                })

    return documents

def export_inventory(documents, output_file):
    """Export inventory to JSON for analysis"""
    with open(output_file, 'w') as f:
        json.dump(documents, f, indent=2, default=str)

    print(f"Exported {len(documents)} documents to {output_file}")

    # Print summary
    types = {}
    for doc in documents:
        t = doc['type']
        types[t] = types.get(t, 0) + 1

    print("
Document breakdown:")
    for dtype, count in sorted(types.items(), key=lambda x: x[1], reverse=True):
        print(f"  {dtype}: {count}")

if __name__ == "__main__":
    # Scan these directories
    scan_paths = [
        "/Users/franksimpson/Documents",
        "/Users/franksimpson/Desktop",
        "/Users/franksimpson/Downloads",
        os.path.expanduser("~/Claude Projects"),  # If on macOS
    ]

    docs = scan_directories(scan_paths)
    export_inventory(docs, "./document_inventory.json")
EOF

python scripts/collect_documents.py
```

### Step 2: Categorize by Type

```python
# Categorization script
document_types = {
    "conversations": ["txt", "md", "json"],  # ChatGPT exports
    "research_documents": ["pdf", "docx", "md"],
    "transcripts": ["txt", "md"],
    "spreadsheets": ["xlsx", "csv", "sheets"],
    "archived_web": ["html", "htm"],
    "images": ["png", "jpg", "jpeg"],
    "other": ["all_others"]
}

# Organize by type + create processing queue
```

---

## Phase 2: Prepare for Processing (Week 1-2)

### Step 1: Export All Conversations to Markdown

**From ChatGPT:**
- Use ChatGPT's built-in export → JSON
- Convert JSON to clean markdown with timestamps
- Preserve message structure (user ↔ assistant turns)

```python
# scripts/convert_chatgpt_to_md.py
import json
from datetime import datetime

def convert_chatgpt_json_to_md(json_file, output_file):
    """Convert ChatGPT conversation export to markdown"""
    with open(json_file) as f:
        data = json.load(f)

    md_content = "# Conversation

"

    for message in data.get("messages", []):
        role = message.get("author", {}).get("role", "unknown")
        content = message.get("content", {}).get("parts", [])
        timestamp = message.get("create_time", "")

        if content:
            md_content += f"## {role.upper()}
"
            if timestamp:
                ts = datetime.fromtimestamp(timestamp).isoformat()
                md_content += f"*{ts}*

"

            md_content += content[0] + "

"

    with open(output_file, 'w') as f:
        f.write(md_content)

# Execute on all ChatGPT JSONs
for json_file in glob.glob("**/*.json"):
    output = json_file.replace(".json", "_conversation.md")
    convert_chatgpt_json_to_md(json_file, output)
```

### Step 2: Convert PDFs to Searchable Text

```bash
# Use Tesseract OCR for scanned PDFs
brew install tesseract

# scripts/extract_pdfs.sh
for pdf in *.pdf; do
    pdftotext "$pdf" "${pdf%.pdf}.txt"
done
```

---

## Phase 3: AI-Assisted Consolidation (Week 2-4)

### This is Where Agents Shine

You need an **automated distillation pipeline** using Claude:

```python
# agents/consolidation_agent.py
from anthropic import Anthropic

class ResearchConsolidationAgent:
    def __init__(self):
        self.client = Anthropic()
        self.conversation_history = []

    def analyze_document(self, document_text: str):
        """Analyze individual document for key concepts"""
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            system="""You are a research consolidation assistant for The Collectiv project.
Your job is to extract:
1. Core concepts/themes
2. Key arguments or findings
3. Academic citations mentioned
4. Original research vs. commentary
5. Relevance to these research questions:
   - How can cooperative institutional design enable lifecycle wealth stability?
   - What governance mechanisms prevent value extraction?
   - Why are PBCs more protected than DAOs?

Output as structured JSON.""",
            messages=[
                {
                    "role": "user",
                    "content": f"Analyze this document for consolidation:

{document_text[:4000]}"
                }
            ]
        )

        return response.content[0].text

    def deduplicate_findings(self, findings_list: list):
        """Find and merge duplicate content across documents"""
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=3000,
            system="Identify duplicate or similar findings across these documents. Merge them, keeping the strongest version.",
            messages=[
                {
                    "role": "user",
                    "content": f"Deduplicate these findings:

{json.dumps(findings_list)}"
                }
            ]
        )

        return response.content[0].text

    def create_wiki_page(self, topic: str, consolidated_findings: str):
        """Generate structured wiki page from consolidated research"""
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            system="""Convert research findings into a wiki page with:
1. Clear heading structure
2. Academic citations (with sources)
3. Key concepts highlighted
4. Related topics linked
5. Open questions noted
6. Use markdown format suitable for DokuWiki""",
            messages=[
                {
                    "role": "user",
                    "content": f"Create wiki page on: {topic}

Findings:
{consolidated_findings}"
                }
            ]
        )

        return response.content[0].text

# Usage
agent = ResearchConsolidationAgent()

# Process all documents
for doc_path in all_documents:
    text = read_document(doc_path)
    analysis = agent.analyze_document(text)
    store_analysis(analysis)

# Then consolidate
deduplicated = agent.deduplicate_findings(all_analyses)
wiki_page = agent.create_wiki_page("Institutional Economics", deduplicated)
```

### Batch Processing Pipeline

```python
# scripts/batch_consolidation.py
import os
import json
from agents.consolidation_agent import ResearchConsolidationAgent
from concurrent.futures import ThreadPoolExecutor

agent = ResearchConsolidationAgent()

def process_document(doc_path):
    """Process single document"""
    try:
        with open(doc_path) as f:
            content = f.read()

        analysis = agent.analyze_document(content)

        return {
            "source": doc_path,
            "analysis": analysis,
            "status": "success"
        }
    except Exception as e:
        return {
            "source": doc_path,
            "error": str(e),
            "status": "failed"
        }

# Process ~50 documents in parallel
with ThreadPoolExecutor(max_workers=5) as executor:
    results = list(executor.map(process_document, document_list))

# Store results
with open("consolidation_results.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"Processed {len(results)} documents")
```

---

## Phase 4: Quality Assurance & Deduplication (Week 4-5)

### Step 1: Find Duplicates & Overlaps

```python
# scripts/find_duplicates.py
from difflib import SequenceMatcher
import json

def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

# Build similarity matrix across all consolidated findings
findings = json.load(open("consolidation_results.json"))

duplicates = []
for i, finding_a in enumerate(findings):
    for j, finding_b in enumerate(findings[i+1:], i+1):
        sim = similarity(finding_a["content"], finding_b["content"])

        if sim > 0.75:  # 75% similarity = likely duplicate
            duplicates.append({
                "doc_a": finding_a["source"],
                "doc_b": finding_b["source"],
                "similarity": sim
            })

# Review duplicates for manual merge
print(f"Found {len(duplicates)} potential duplicates for review")
```

### Step 2: Manual Review & Merge

Create a simple UI or spreadsheet for reviewing:
```
Source A | Source B | Similarity | Decision | Merged Content
---------|---------|------------|----------|---------------
doc1.txt | doc2.txt |    0.82    | merge    | [consolidated]
...
```

---

## Phase 5: Organize into Wiki Structure (Week 5-6)

Map your 1000 documents to the wiki structure:

```
01-project-plan/               ← Foundational documents, vision
  ├── project_overview.md
  ├── research_questions.md
  └── original_hypothesis.md

02-theoretical-framework/      ← Academic theory, literature
  ├── institutional_economics.md
  ├── cooperative_models.md
  ├── ostrom_principles.md
  └── governance_theory.md

03-institutional-design/       ← PBC structure, ownership models
  ├── pbc_compared.md
  ├── ip_ownership_structures.md
  ├── governance_mechanisms.md
  └── hybrid_models.md

04-research-findings/          ← Your synthesized research
  ├── creator_economy_crisis.md
  ├── platform_extraction.md
  ├── wealth_lifecycle_analysis.md
  └── case_studies.md

05-governance-docs/            ← Decision logs, meetings
  ├── governance_principles.md
  ├── conflict_resolution.md
  └── ethics_framework.md

06-source-library/             ← Academic sources + Zotero sync
  ├── ostrom-1990-commons.md
  ├── piketty-capital.md
  └── [auto-synced from Zotero]

07-experiments/                ← Pilot testing, iterations
  ├── early_pilots.md
  ├── lessons_learned.md
  └── next_iterations.md
```

---

## Phase 6: Create Dissertation Outline from Wiki (Week 6-8)

Once wiki is solid, generate dissertation from it:

```python
# agents/dissertation_agent.py
def generate_dissertation_outline(wiki_content: dict):
    """Generate PhD dissertation outline from consolidated wiki"""

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=5000,
        system="""You are a dissertation structure expert.
Create a PhD-level dissertation outline with these chapters:
1. Introduction (problem statement + significance)
2. Literature Review (theoretical foundation)
3. Theoretical Framework (your model)
4. Methodology (how you studied it)
5. Findings & Analysis (what you discovered)
6. Implications (why it matters)
7. Limitations & Future Work

Cite the wiki content provided.""",
        messages=[{
            "role": "user",
            "content": f"Create dissertation outline from this research:

{json.dumps(wiki_content)}"
        }]
    )

    return response.content[0].text

# Then expand each chapter
def expand_chapter(chapter_outline: str, relevant_wiki_sections: list):
    """Expand chapter outline into full text"""
    # Similar pattern...
```

---

## Automated Pipeline Summary

```
1000+ scattered docs
     ↓
[Inventory & categorize]
     ↓
[Convert to markdown]
     ↓
[Claude analyzes each] ← AGENTS HERE
     ↓
[Deduplicates findings]
     ↓
[Maps to wiki structure]
     ↓
[Quality review]
     ↓
Consolidated Wiki (500-800 clean wiki pages)
     ↓
[Dissertation generator] ← AGENTS HERE
     ↓
Dissertation Outline + Drafts
```

---

## Timeline & Effort Estimate

| Phase | Timeline | Effort | Who |
|-------|----------|--------|-----|
| Inventory | 1 day | 2 hrs automated + 2 hrs review | Scripts |
| Conversion | 3 days | Auto-convert + spot check | Scripts + You |
| AI Consolidation | 5-7 days | Batch processing (Claude API) | Agents |
| Deduplication | 3-5 days | Auto-find + manual review (30-50 decisions) | You |
| Wiki Organization | 2-3 days | Category mapping + tagging | Agents |
| Dissertation Draft | 3-5 days | Outline + chapter expansion | Agents |
| **Total** | **4-8 weeks** | **10-15 hours active work** | **Hybrid** |

---

## Cost Estimate

| Component | Pricing |
|-----------|---------|
| Claude API (document analysis) | ~$500-1000 (1000 docs × 2K tokens avg × $0.003/1K) |
| Storage (1000 docs) | Free-5/month (GitHub) |
| Infrastructure | $0-10/month (self-hosted) |
| **Total** | **$500-1015** |

---

## Starting Point: What I Recommend

**Week 1: Do This First**

1. Run `collect_documents.py` to inventory your 1000 docs
2. Export your main ChatGPT conversations
3. Identify your top 10 most important sources manually
4. Create initial wiki pages for those 10
5. Test the consolidation agent on those 10

**Week 2-4: Scale Up**

6. Run batch consolidation on remaining 990 docs
7. Deduplication pass
8. Map findings to wiki structure

**Week 5+: Polish**

9. Manual review of wiki pages
10. Add cross-linking and citations
11. Generate dissertation outline

---

## Important: Don't Try to Perfect Everything

**Common mistake:** Spending 20 hours manually organizing 1000 documents.

**Better approach:** Let agents do rough consolidation in 40 minutes, then you spend 5 hours doing high-judgment quality control.

---

## Files You'll Need to Create

```
scripts/
├── collect_documents.py          # Inventory all docs
├── convert_chatgpt_to_md.py      # Export conversations
├── extract_pdfs.py               # OCR + text extraction
├── batch_consolidation.py        # Run agent on all docs
└── find_duplicates.py            # Deduplication analysis

agents/
├── consolidation_agent.py        # Main consolidation logic
└── dissertation_agent.py         # Dissertation generation

outputs/
├── document_inventory.json       # What you have
├── consolidation_results.json    # Agent analyses
├── duplicates_review.csv         # Manual review spreadsheet
└── dissertation_outline.md       # Final output
```

---

## Next Step

**I can:**
1. Build the consolidation agent now
2. Create the batch processing pipeline
3. Build a Jupyter notebook for iterative testing
4. Help you export your ChatGPT conversations

Which would you like first?

---

**Reality Check:** This is big, but doable. The key is letting agents do 80% of the work (which takes 2-3 hours compute time), then you spend 5-10 hours doing human judgment on the remaining 20%.