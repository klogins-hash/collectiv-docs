---
title: Stage 2: Strands Agent Framework - Complete Summary
description: The Collectiv documentation
---

# Stage 2: Strands Agent Framework - Complete Summary

**Completion Date:** January 14, 2026
**Status:** ✅ COMPLETE
**Commits:** 7 (78a9cbd through current)

---

## Overview

Stage 2 implements the complete Strands agent framework for research consolidation with comprehensive error handling, tool integration, and job persistence. The stage is divided into three substages:

- **2.1**: Agent Infrastructure (Job Store & Express Server)
- **2.2**: Tool Development (4 production tools)
- **2.3**: Agent Configuration (Error handling & workflows)

---

## Stage 2.1: Agent Infrastructure ✅

### JobStore (PostgreSQL Persistence)

**File:** `agents/src/store/JobStore.ts` (268 lines)

Provides complete job lifecycle management with PostgreSQL backend:

**Features:**
- Job creation with automatic UUID generation
- Status tracking: pending → running → completed/failed/partial_failure
- Retry count tracking with automatic status escalation
- Parent-child job relationships for hierarchical workflows
- Timestamp management (createdAt, startedAt, completedAt, updatedAt)
- Full query interface: getJob, getJobsByStatus, getJobHistory, deleteJob

**Database Schema:**
- `jobs` table with comprehensive indexing
- Job status supports 5 states: pending, running, completed, failed, partial_failure
- JSONB columns for flexible data storage (inputData, outputData, metadata)
- Foreign key constraints for hierarchical relationships
- Automatic timestamp triggers

**Connection Pool:**
- Min: 5 connections
- Max: 20 connections (configurable)
- Uses PG client pooling with singleton pattern

### Express Server

**File:** `agents/src/server.ts` (105 lines)

Production-ready Express server with:
- Full Winston logging (console + file logs)
- Environment-based configuration
- Health check endpoint (`/health`)
- Job management routes (`/jobs/*`)
- Error handling middleware
- Server startup with connection verification

**Endpoints:**
- `GET /health` - Service health check
- `GET /` - Service info
- `POST /jobs` - Create new job (via routes)
- `GET /jobs/:jobId` - Get job details (via routes)
- `PUT /jobs/:jobId/status` - Update job status (via routes)
- `GET /jobs/:jobId/history` - Get resume history (via routes)
- `GET /jobs/status/:status` - Query by status (via routes)

---

## Stage 2.2: Tool Development ✅

### 4 Production Tools

All tools share consistent architecture with error handling and batch support.

#### WikiEditTool (140 lines)

**File:** `agents/src/tools/WikiEditTool.ts`

REST API wrapper for wiki page operations:

**Methods:**
- `createPage(page)` - Create new wiki page
- `updatePage(id, updates)` - Update existing page
- `getPage(slug)` - Retrieve page by slug
- `deletePage(id)` - Delete page
- `createPages(pages)` - Batch create multiple pages

**Response Format:**
```typescript
{ success: boolean, id?: string, error?: string }
{ success: number, failed: number, errors: string[] }
```

**Tool Description:**
Registered with Strands agent framework with comprehensive parameter schema for create/update/get/delete operations.

#### ZoteroFetchTool (165 lines)

**File:** `agents/src/tools/ZoteroFetchTool.ts`

REST API wrapper for Zotero citation management:

**Methods:**
- `searchCitations(query)` - Search Zotero for citations
- `getTags()` - Retrieve all available tags
- `getCitationsByTag(tag)` - Filter citations by tag
- `getCitation(citationId)` - Get specific citation
- `searchRecent(yearsBack)` - Search recent papers
- `fetchCitations(citationIds)` - Batch fetch citations

**Response Format:**
```typescript
{ success: boolean, data?: Citation[], error?: string }
```

**Features:**
- Year-based filtering for recent searches
- Tag-based filtering and organization
- Batch operations for bulk retrieval
- Rate limiting compatible

#### WikiSearchTool (115 lines)

**File:** `agents/src/tools/WikiSearchTool.ts`

REST API wrapper for semantic and full-text search:

**Methods:**
- `search(query)` - Semantic vector search
- `searchByConcepts(concepts)` - Search by concept tags
- `findRelated(query)` - Find semantically related pages
- `fullTextSearch(query)` - Full-text fallback search

**Response Format:**
```typescript
{ success: boolean, results?: WikiPage[], error?: string }
```

**Features:**
- Supports semantic similarity search
- Full-text fallback for robustness
- Concept-based discovery
- Related page suggestions

#### DeduplicateTool (140 lines)

**File:** `agents/src/tools/DeduplicateTool.ts`

REST API wrapper for duplicate detection and merging:

**Methods:**
- `findDuplicates(documents)` - Detect duplicates with threshold
- `findDuplicatePairs(documents)` - Return paired duplicates
- `mergeDuplicates(sourceId, targetId)` - Merge two documents
- `markDuplicates(sourceId, targetId)` - Mark without merging
- `getReport()` - Deduplication metrics

**Response Format:**
```typescript
{ success: boolean, duplicates?: any[], error?: string }
```

**Features:**
- SHA256 hash-based deduplication
- Configurable similarity thresholds (default 0.85)
- Graceful handling of duplicates without merging
- Metrics and reporting

### Tool Index

**File:** `agents/src/tools/index.ts`

Central export point for all 4 tools:
```typescript
export { WikiEditTool } from './WikiEditTool';
export { ZoteroFetchTool } from './ZoteroFetchTool';
export { WikiSearchTool } from './WikiSearchTool';
export { DeduplicateTool } from './DeduplicateTool';
```

---

## Stage 2.3: Agent Configuration ✅

### ConsolidationAgent (470 lines)

**File:** `agents/src/agents/ConsolidationAgent.ts`

Complete agent orchestration with 4-layer error handling:

#### Architecture

```
Layer 1: Strands Agent Framework (external)
    ↓
Layer 2: Tool-Level Error Handling (individual tool calls)
    ↓
Layer 3: Workflow-Level Error Handling (multi-step operations)
    ↓
Layer 4: System-Level Error Handling (circuit breaker)
```

#### Error Handling Configuration

```typescript
interface ErrorHandlingConfig {
  // Retry: exponential backoff with bounds
  maxRetries: 3
  initialDelayMs: 500
  maxDelayMs: 30000
  backoffMultiplier: 2

  // Timeout: per-tool and per-workflow limits
  toolTimeoutMs: 30000
  workflowTimeoutMs: 120000

  // Circuit Breaker: cascading failure protection
  failureThreshold: 5 consecutive failures
  recoveryTimeMs: 60 seconds

  // Fallbacks: degraded mode operations
  enableFallbacks: true
  fallbackOptions: {
    searchFallback: true      // Full-text if semantic fails
    wikiFallback: true        // Simple pages if structured fails
    deduplicationFallback: true // Manual review hints
  }
}
```

#### Tool Execution with Retry Logic

```typescript
executeToolWithRetry<T>(
  toolName: string,
  execution: () => Promise<T>,
  shouldRetry?: (result: T) => boolean
): Promise<ToolResult>
```

**Features:**
- Exponential backoff: 500ms → 1s → 2s → 4s (capped at 30s)
- Timeout racing: Promise.race with timeout handler
- Circuit breaker check before each attempt
- Automatic retry on tool failure
- Return detailed execution metrics

#### Circuit Breaker

**State Machine:**
- Normal → Open (after N consecutive failures)
- Open → Attempting Recovery (after recovery timeout)
- Attempting Recovery → Normal (if success)

**Metrics Tracked:**
- consecutiveFailures counter
- circuitBreakerOpen state
- lastFailureTime for recovery timing

**Behavior:**
- Rejects all tool calls when open
- Returns circuit breaker error without attempting tool
- Prevents cascading system failures

#### Workflow Execution

```typescript
async runConsolidationWorkflow(documents: any[]): Promise<WorkflowResult>
```

**Four-Step Workflow:**

1. **Deduplication** - Check for duplicate documents
2. **Citation Search** - Fetch academic sources (parallel)
3. **Content Search** - Search existing wiki content (parallel)
4. **Wiki Creation** - Create wiki pages for new content (parallel)

**Error Handling Per Step:**
- Each step tracks success/failure individually
- Warnings logged but don't stop workflow
- Failures compared against fallback settings
- Final status: completed | partial_failure | failed

**Output Metrics:**
```typescript
interface WorkflowResult {
  jobId: string
  success: boolean
  steps: ToolResult[]         // All tool invocations
  warnings: string[]          // Non-fatal issues
  errors: string[]            // Fatal issues
  executionTimeMs: number
  completedAt: Date
}
```

#### Tool Result Structure

```typescript
interface ToolResult {
  toolName: string
  success: boolean
  data?: any                  // Success payload
  error?: string              // Error message
  retriesUsed: number         // Attempt count
  executionTimeMs: number     // Duration
  timestamp: Date
}
```

#### Methods

**Tool Wrappers (with automatic retry + fallback):**
- `searchContent(query)` - WikiSearchTool with full-text fallback
- `fetchCitations(query)` - ZoteroFetchTool
- `createWikiPage(page)` - WikiEditTool with simple page fallback
- `deduplicateContent(documents)` - DeduplicateTool

**Utilities:**
- `generateSlug(title)` - URL-friendly slugs
- `getJobId()` - Agent job identifier
- `getStatus()` - Circuit breaker and error state

#### Logging Integration

All operations logged via Winston:
- Agent initialization with config
- Tool execution: started, succeeded, failed, retriesLeft
- Workflow: step completion, document counts, final status
- Circuit breaker: opened, closed, recovery attempts

### Agents Index

**File:** `agents/src/agents/index.ts`

Exports for easy module integration:
```typescript
export { ConsolidationAgent }
export type { ErrorHandlingConfig, ToolResult, WorkflowResult }
```

---

## Service Integration

### TypeScript Configuration

**File:** `agents/tsconfig.json` (updated)

- Added `DOM` to lib array (for setTimeout types)
- Strict mode enabled
- Path aliases configured
- Source maps enabled for debugging

### Package Dependencies

**File:** `agents/package.json` (updated)

Core dependencies (already present):
```json
{
  "@strands-ai/sdk": "^0.1.0",
  "express": "^4.18.0",
  "axios": "^1.6.0",
  "winston": "^3.11.0",
  "uuid": "^9.0.0",
  "zod": "^3.22.0",
  "pg": "^8.x.x"  // For JobStore
}
```

### Server Integration

**File:** `agents/src/server.ts` (updated)

- Fixed import: `import { ConsolidationAgent }` (named export)
- Job store initialization on startup
- Error handling middleware
- Graceful shutdown on connection failure

---

## File Structure

```
agents/
├── src/
│   ├── agents/
│   │   ├── ConsolidationAgent.ts    (470 lines) ← NEW Stage 2.3
│   │   └── index.ts                 (7 lines) ← NEW
│   ├── tools/
│   │   ├── WikiEditTool.ts          (140 lines) ← NEW Stage 2.2
│   │   ├── ZoteroFetchTool.ts       (165 lines) ← NEW Stage 2.2
│   │   ├── WikiSearchTool.ts        (115 lines) ← NEW Stage 2.2
│   │   ├── DeduplicateTool.ts       (140 lines) ← NEW Stage 2.2
│   │   └── index.ts                 (4 lines) ← NEW Stage 2.2
│   ├── store/
│   │   └── JobStore.ts              (268 lines) ← Stage 2.1
│   ├── routes/
│   │   └── index.ts                 (existing)
│   ├── server.ts                    (105 lines) ← Updated Stage 2.1
│   └── package.json                 (updated)
├── tsconfig.json                    (updated)
└── README.md                        (existing)
```

**Total New Code:** ~1,220 lines

---

## Key Achievements

✅ **Complete Job Persistence**
- Database schema with comprehensive indexing
- Job lifecycle: pending → running → completed/failed/partial_failure
- Retry tracking and parent-child relationships
- Connection pooling for scalability

✅ **Production Tools**
- 4 fully-implemented REST API wrappers
- Consistent error handling across all tools
- Batch operation support
- Strands agent framework compatible

✅ **Advanced Error Handling**
- 4-layer strategy: Strands → Tool → Workflow → System
- Exponential backoff retry logic
- Circuit breaker for cascading failure prevention
- Automatic fallback options
- Comprehensive logging

✅ **Multi-Step Workflows**
- 4-step research consolidation process
- Parallel tool invocation (citations, search, creation)
- Partial failure handling
- Detailed execution metrics

✅ **Production Quality**
- Strict TypeScript with proper typing
- Winston logging integration
- Environment-based configuration
- Error handling middleware
- Health check endpoints

---

## Testing Considerations

### Unit Testing (Ready)
- Tool classes can be mocked
- Each tool independently testable
- JobStore queries independently verifiable
- Error handling logic can be unit tested

### Integration Testing (Ready)
- Full workflow execution with mock backend
- Job persistence through PostgreSQL
- Error recovery behavior
- Circuit breaker state transitions

### Load Testing (Ready)
- Connection pooling under load
- Parallel tool execution
- Batch operations
- Timeout behavior

---

## Next Steps: Stage 3

**RAG & Search System (Week 3-4)**

- Weaviate schema implementation
- Embedding pipeline (OpenAI)
- Semantic + fallback search
- Context window management

---

## Validation

**Code Quality:**
- ✅ TypeScript strict mode
- ✅ Comprehensive error handling
- ✅ No implicit any types
- ✅ Full source maps

**Architecture:**
- ✅ Clean separation of concerns
- ✅ Tool/Agent/Store independence
- ✅ Extensible design
- ✅ Production-ready patterns

**Documentation:**
- ✅ Inline code comments
- ✅ Interface documentation
- ✅ Method signatures clear
- ✅ Error handling documented

---

## Git Commits

| Commit | Stage | Description |
|--------|-------|-------------|
| 78a9cbd | 2.1 | Agent Infrastructure: JobStore + Express server |
| (current) | 2.2 | Tool Development: 4 production tools |
| (current) | 2.3 | Agent Configuration: ConsolidationAgent + error handling |

---

## Summary

Stage 2 delivers a production-ready agent framework with comprehensive error handling and tool integration. The ConsolidationAgent orchestrates complex research consolidation workflows with automatic retry logic, circuit breaker protection, and fallback behaviors. All 4 tools are fully implemented with consistent error handling and batch support. Job persistence via PostgreSQL enables resumable operations and complete audit trails.

**Status:** ✅ READY FOR STAGE 3