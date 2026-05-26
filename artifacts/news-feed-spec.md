# News Feed Feature Specification

**Status:** Designed (not yet implemented)
**Priority:** P2

---

## Overview

Add a real-time news feed aggregation feature to the Digital Companion that pulls and displays content from RSS/Atom sources relevant to product management, AI governance, and enterprise architecture.

---

## Requirements

### Functional

| ID | Requirement |
|----|------------|
| NF-01 | Aggregate RSS/Atom feeds from configurable source list |
| NF-02 | Display feed items in reverse chronological order |
| NF-03 | Show title, source, date, and excerpt for each item |
| NF-04 | Support filtering by source/category |
| NF-05 | Link to original article (opens in new tab) |
| NF-06 | Auto-refresh on configurable interval (default: 30 min) |
| NF-07 | Graceful fallback when feeds are unavailable |

### Non-Functional

| ID | Requirement |
|----|------------|
| NNF-01 | Feed parsing must run server-side (CORS restrictions on client-side RSS fetch) |
| NNF-02 | Response time < 500ms for cached feeds |
| NNF-03 | Maximum 50 items per feed source |

---

## Architecture

### Option A: Netlify Serverless Function (Recommended)

```
Client → Netlify Function → RSS/Atom Sources
                ↓
        Parse + Cache (in-memory)
                ↓
        Return JSON response
```

**Pros:** Zero-cost (Netlify free tier includes 125K function invocations/month), no new infrastructure
**Cons:** Cold start latency (~200ms), in-memory cache resets on function recycle

### Option B: Static Pre-Build

```
GitHub Actions (cron) → Fetch feeds → Write JSON → Commit → Deploy
```

**Pros:** Zero runtime cost, no function overhead
**Cons:** Stale data between builds, increased CI usage

---

## Data Model

### Feed Source Configuration

```json
{
  "feeds": [
    {
      "id": "pm-weekly",
      "name": "Product Management Weekly",
      "url": "https://example.com/feed.xml",
      "category": "product-management",
      "enabled": true
    }
  ]
}
```

### Feed Item Response

```json
{
  "items": [
    {
      "id": "hash-of-guid",
      "title": "Article Title",
      "source": "pm-weekly",
      "sourceName": "Product Management Weekly",
      "url": "https://example.com/article",
      "published": "2026-05-20T10:00:00Z",
      "excerpt": "First 200 characters...",
      "category": "product-management"
    }
  ],
  "lastUpdated": "2026-05-20T12:00:00Z"
}
```

---

## UI Design

```
┌─────────────────────────────────────────┐
│  News Feed                    [Filter ▾] │
├─────────────────────────────────────────┤
│  ● Article Title                         │
│    Source Name · 2 hours ago             │
│    First 200 characters of excerpt...    │
│    [Read More →]                         │
├─────────────────────────────────────────┤
│  ● Article Title                         │
│    Source Name · 5 hours ago             │
│    First 200 characters of excerpt...    │
│    [Read More →]                         │
└─────────────────────────────────────────┘
```

---

## Implementation Plan

1. Create `netlify/functions/rss.mjs` — serverless RSS fetcher + parser
2. Create feed source configuration JSON
3. Build `NewsFeed.jsx` component with loading/error states
4. Add to App.jsx section router
5. Test with 3-5 real RSS feeds
6. Add to chapter navigation
