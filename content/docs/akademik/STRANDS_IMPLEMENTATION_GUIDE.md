# Strands Implementation Guide for Akademik-v1

Reference: https://github.com/strands-agents

## Strands Core Concepts

Strands is a framework for building **autonomous AI agents** with:
- First-class job/task management
- Built-in error handling & retries
- Tool composition and isolation
- Persistent agent memory
- Multi-step workflows

---

## Installation & Setup

```bash
# Install Strands
npm install @strands-ai/sdk

# Or in your existing Akademik-v1 agents directory
cd agents
npm init -y
npm install @strands-ai/sdk dotenv axios
```

---

## 1. Basic Agent Structure

```typescript
// agents/index.ts
import { Agent } from "@strands-ai/sdk";
import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create base agent
const akademikAgent = new Agent({
  name: "akademik-consolidation",
  instructions: `You are a research consolidation assistant for The Collectiv project.
Your job is to:
1. Analyze scattered research documents
2. Extract key concepts and findings
3. Identify academic sources
4. Create structured wiki pages
5. Maintain audit trails of all work

Be systematic, rigorous, and thorough.`,

  model: "claude-3-5-sonnet-20241022",
  temperature: 0.7,
});

export { akademikAgent };
```

---

## 2. Tool Definition (Strands Way)

```typescript
// agents/tools/wiki-edit-tool.ts
import { Tool } from "@strands-ai/sdk";
import axios from "axios";

interface WikiEditInput {
  pageId: string;
  content: string;
  message: string;
  metadata?: {
    sources?: string[];
    keywords?: string[];
  };
}

export const WikiEditTool = new Tool({
  name: "edit_wiki_page",
  description: "Create or update a wiki page with git commit",

  inputSchema: {
    type: "object",
    properties: {
      pageId: {
        type: "string",
        description: "Wiki page ID (e.g., 04-findings/pbc-analysis)"
      },
      content: {
        type: "string",
        description: "Markdown content for the wiki page"
      },
      message: {
        type: "string",
        description: "Git commit message describing the change"
      },
      metadata: {
        type: "object",
        properties: {
          sources: {
            type: "array",
            items: { type: "string" },
            description: "Zotero source IDs referenced"
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Research keywords/topics"
          }
        }
      }
    },
    required: ["pageId", "content", "message"]
  },

  // This is the actual implementation
  async invoke(input: WikiEditInput) {
    try {
      console.log(`[WikiEditTool] Editing: ${input.pageId}`);

      const response = await axios.post("http://fumadocs:3001/api/pages", {
        pageId: input.pageId,
        content: input.content,
        message: `[Agent] ${input.message}`,
        metadata: input.metadata,
      });

      return {
        success: true,
        pageId: input.pageId,
        url: `http://localhost:3001/docs/${input.pageId}`,
        commitHash: response.data.commitHash,
      };
    } catch (error) {
      throw new Error(`Failed to edit wiki page: ${error.message}`);
    }
  },
});
```

---

## 3. More Tools: Zotero, Search, Deduplicate

```typescript
// agents/tools/zotero-fetch-tool.ts
import { Tool } from "@strands-ai/sdk";
import axios from "axios";

export const ZoteroFetchTool = new Tool({
  name: "fetch_citations",
  description: "Search Zotero library for academic citations",

  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (author, title, keywords)"
      },
      limit: {
        type: "number",
        description: "Max results to return",
        default: 5
      }
    },
    required: ["query"]
  },

  async invoke(input) {
    try {
      const response = await axios.get("http://python-backend:8000/zotero/search", {
        params: {
          q: input.query,
          limit: input.limit || 5
        }
      });

      return {
        results: response.data.items,
        count: response.data.items.length,
        query: input.query
      };
    } catch (error) {
      throw new Error(`Zotero search failed: ${error.message}`);
    }
  }
});

// agents/tools/wiki-search-tool.ts
export const WikiSearchTool = new Tool({
  name: "search_wiki",
  description: "Search wiki using semantic search (RAG)",

  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number", default: 5 }
    },
    required: ["query"]
  },

  async invoke(input) {
    try {
      const response = await axios.post("http://python-backend:8000/search", {
        query: input.query,
        limit: input.limit || 5
      });

      return {
        results: response.data.results.map(r => ({
          pageId: r.page_id,
          excerpt: r.content.substring(0, 300),
          score: r.score,
          source: r.source
        })),
        count: response.data.results.length
      };
    } catch (error) {
      throw new Error(`Wiki search failed: ${error.message}`);
    }
  }
});

// agents/tools/deduplicate-tool.ts
export const DeduplicateTool = new Tool({
  name: "check_duplicate",
  description: "Check if research finding already exists in wiki",

  inputSchema: {
    type: "object",
    properties: {
      concept: { type: "string", description: "Research concept/finding to check" },
      similarity_threshold: { type: "number", default: 0.75 }
    },
    required: ["concept"]
  },

  async invoke(input) {
    try {
      const response = await axios.post("http://python-backend:8000/deduplicate", {
        concept: input.concept,
        threshold: input.similarity_threshold || 0.75
      });

      return {
        isDuplicate: response.data.isDuplicate,
        matches: response.data.matches || [],
        confidence: response.data.confidence
      };
    } catch (error) {
      throw new Error(`Deduplication check failed: ${error.message}`);
    }
  }
});
```

---

## 4. Agent with Tools & Error Handling

```typescript
// agents/consolidation-agent.ts
import { Agent } from "@strands-ai/sdk";
import { Anthropic } from "@anthropic-ai/sdk";
import { WikiEditTool } from "./tools/wiki-edit-tool";
import { ZoteroFetchTool } from "./tools/zotero-fetch-tool";
import { WikiSearchTool } from "./tools/wiki-search-tool";
import { DeduplicateTool } from "./tools/deduplicate-tool";

export const consolidationAgent = new Agent({
  name: "consolidation-bot",

  instructions: `You are consolidating research documents for The Collectiv project.
For each document:
1. Search wiki for related content (deduplicate)
2. Extract key concepts and findings
3. Search Zotero for relevant academic sources
4. Create or update wiki pages with citations
5. Record all actions in git

Be thorough and academic in tone.`,

  // All tools available to this agent
  tools: [
    WikiSearchTool,
    ZoteroFetchTool,
    WikiEditTool,
    DeduplicateTool
  ],

  model: "claude-3-5-sonnet-20241022",
  temperature: 0.6,

  // Error handling strategy
  errorHandling: {
    // Default retry policy
    retries: 3,
    backoffMultiplier: 2,
    backoffBase: 1000, // 1 second

    // Tool-specific error handling
    toolErrorHandlers: {
      "search_wiki": {
        retries: 2,
        threshold: 0.5, // Lower confidence threshold on retry
      },
      "fetch_citations": {
        retries: 3,
        timeout: 30000,
        fallback: () => ({ results: [] }) // Return empty if Zotero unavailable
      },
      "edit_wiki_page": {
        retries: 3,
        timeout: 60000,
        // Critical operation - don't auto-retry without logging
        onError: (error) => {
          console.error(`CRITICAL: Wiki edit failed - ${error.message}`);
          // Notify on monitoring system
        }
      }
    }
  }
});
```

---

## 5. Job Execution (Most Important Part)

```typescript
// agents/run-consolidation-job.ts
import { consolidationAgent } from "./consolidation-agent";
import type { Job } from "@strands-ai/sdk";

interface ConsolidationJobInput {
  documentIds: string[];
  section?: string; // e.g., "02-framework" or "04-findings"
  mode?: "parallel" | "sequential"; // How to process
}

export async function runConsolidationJob(
  input: ConsolidationJobInput
): Promise<Job> {

  // Create job with persistence
  const job = await consolidationAgent.createJob({

    // Job metadata
    name: `consolidate-${input.section || "research"}-${Date.now()}`,
    description: `Consolidate ${input.documentIds.length} documents for ${input.section || "general"} section`,

    // Input to agent
    prompt: `Consolidate these research documents:
${input.documentIds.map(id => `- ${id}`).join("\n")}

${input.section ? `Target wiki section: ${input.section}` : "Organize by relevance to existing wiki structure"}

Process ${input.mode === "parallel" ? "in parallel where safe" : "sequentially for safety"}.
Document all findings and decisions.`,

    // Execution parameters
    maxIterations: 50, // Max steps the agent can take
    timeout: 3600000, // 1 hour

    // Persistence options
    persistent: true,
    resumable: true, // Can resume if interrupted

    // Callbacks
    onStepComplete: (step) => {
      console.log(`[Job ${job.id}] Step ${step.index}: ${step.action}`);
    },

    onError: (error, step) => {
      console.error(`[Job ${job.id}] Error at step ${step.index}: ${error.message}`);
      // Log to monitoring
      logToMonitoring({
        jobId: job.id,
        step: step.index,
        error: error.message,
        timestamp: new Date(),
      });
    },

    onComplete: (result) => {
      console.log(`[Job ${job.id}] Completed:`, result.summary);
      // Update dashboard, send notification, etc.
    }
  });

  return job;
}

// Monitor job progress
export async function monitorJob(jobId: string) {
  const job = await consolidationAgent.getJob(jobId);

  console.log(`Job: ${job.name}`);
  console.log(`Status: ${job.status}`); // running, completed, failed, paused
  console.log(`Progress: ${job.stepsCompleted}/${job.totalSteps}`);
  console.log(`Last step: ${job.lastStep?.action}`);

  if (job.status === "failed") {
    console.log(`Error: ${job.error?.message}`);
    console.log(`Resumable: ${job.resumable}`);
  }

  return job;
}

// Resume failed job
export async function resumeJob(jobId: string) {
  const job = await consolidationAgent.resumeJob(jobId);
  console.log(`Resumed job ${jobId}`);
  return job;
}

// Cancel running job
export async function cancelJob(jobId: string) {
  await consolidationAgent.cancelJob(jobId);
  console.log(`Cancelled job ${jobId}`);
}
```

---

## 6. Integration with Celery (Python Orchestration)

```python
# tasks.py - Python layer queues Strands jobs
from celery import Celery
import requests
import json

app = Celery(
    'akademik',
    broker='redis://redis:6379/0',
    backend='redis://redis:6379/1'
)

@app.task(bind=True)
def consolidate_document_batch(self, doc_ids: list[str], section: str = None):
    """Queue a Strands consolidation job"""
    try:
        # Call Strands agent service to create job
        response = requests.post(
            "http://agents:3000/jobs/create",
            json={
                "documentIds": doc_ids,
                "section": section,
                "mode": "parallel"
            }
        )

        job_data = response.json()
        job_id = job_data["id"]

        # Update Celery task with job ID
        self.update_state(
            state='PROGRESS',
            meta={'job_id': job_id, 'status': 'queued'}
        )

        # Poll for completion (or use webhooks)
        result = poll_strands_job(job_id, timeout=3600)

        return {
            "job_id": job_id,
            "status": result["status"],
            "pages_created": result.get("pages_created", 0),
            "summary": result.get("summary", "")
        }

    except Exception as e:
        self.retry(exc=e, countdown=60, max_retries=3)

def poll_strands_job(job_id: str, timeout: int = 3600):
    """Poll Strands job until completion"""
    start = time.time()

    while time.time() - start < timeout:
        response = requests.get(f"http://agents:3000/jobs/{job_id}")
        job = response.json()

        if job["status"] in ["completed", "failed"]:
            return job

        time.sleep(5)  # Poll every 5 seconds

    raise TimeoutError(f"Job {job_id} timed out after {timeout}s")
```

---

## 7. Full End-to-End Example

```typescript
// bin/consolidate.ts - CLI entry point
import { runConsolidationJob, monitorJob } from "../agents/run-consolidation-job";

async function main() {
  console.log("Starting research consolidation...");

  // Launch job
  const job = await runConsolidationJob({
    documentIds: [
      "doc-001-institutional-economics",
      "doc-002-cooperative-models",
      "doc-003-pbc-structures",
    ],
    section: "03-institutional-design",
    mode: "parallel"
  });

  console.log(`Job created: ${job.id}`);

  // Monitor until completion
  let isRunning = true;
  while (isRunning) {
    const status = await monitorJob(job.id);

    console.log(`Progress: ${status.stepsCompleted}/${status.totalSteps}`);

    if (status.status === "completed") {
      console.log("✅ Consolidation complete!");
      isRunning = false;
    } else if (status.status === "failed") {
      console.log("❌ Job failed:", status.error?.message);
      console.log("Attempting resume...");
      await resumeJob(job.id);
    }

    await new Promise(r => setTimeout(r, 2000)); // Poll every 2s
  }
}

main().catch(console.error);
```

---

## 8. Docker Service (Strands Agent Backend)

```dockerfile
# agents/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
RUN npm run build

ENV NODE_ENV=production
ENV ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

```typescript
// agents/src/server.ts - Strands service
import express from "express";
import { consolidationAgent, researchAgent } from "./agents";

const app = express();
app.use(express.json());

// Endpoint to create job
app.post("/jobs/create", async (req, res) => {
  try {
    const { documentIds, section, mode } = req.body;

    const job = await consolidationAgent.createJob({
      prompt: buildPrompt(documentIds, section, mode),
      maxIterations: 50,
      timeout: 3600000,
      persistent: true
    });

    res.json({
      id: job.id,
      name: job.name,
      status: "queued"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to monitor job
app.get("/jobs/:jobId", async (req, res) => {
  try {
    const job = await consolidationAgent.getJob(req.params.jobId);

    res.json({
      id: job.id,
      status: job.status,
      stepsCompleted: job.stepsCompleted,
      totalSteps: job.totalSteps,
      lastStep: job.lastStep,
      error: job.error,
      result: job.result
    });
  } catch (error) {
    res.status(404).json({ error: "Job not found" });
  }
});

// Endpoint to resume job
app.post("/jobs/:jobId/resume", async (req, res) => {
  try {
    const job = await consolidationAgent.resumeJob(req.params.jobId);
    res.json({ id: job.id, status: "resumed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Strands agent service running on port 3000");
});

function buildPrompt(docIds: string[], section?: string, mode?: string): string {
  return `Consolidate research documents...`; // See earlier examples
}
```

---

## 9. Key Strands Features for Your Use Case

### Job Persistence
```typescript
// Jobs survive process restarts
const job = await agent.getJob(jobId);
if (job.status === "paused") {
  await agent.resumeJob(jobId);
}
```

### Tool Error Isolation
```typescript
// One tool fails, others continue
try {
  // Tool A succeeds
  // Tool B times out
  // Tool C still runs
} catch (error) {
  // Only specific tool error caught
}
```

### Built-in Retry Logic
```typescript
// Strands handles exponential backoff
errorHandling: {
  retries: 3,
  backoffMultiplier: 2  // 1s, 2s, 4s
}
```

### Agent Memory
```typescript
// Agents remember context across steps
const agent = new Agent({
  // ...
  memory: "long-term" // Remembers full conversation
});
```

---

## 10. Next Steps

1. **Initialize Strands project** in `agents/` directory
2. **Implement all tools** (WikiEdit, ZoteroFetch, WikiSearch, Deduplicate)
3. **Create consolidation agent** with error handling
4. **Deploy Strands service** in Docker
5. **Connect Celery** to queue consolidation jobs
6. **Test with 10 documents** to verify error handling
7. **Scale to 1000+** with Celery workers

---

**Strands Documentation:** https://github.com/strands-agents

Ready to build the Strands service?
