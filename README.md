# gai-observe.online | Digital Companion Platform

> A production-grade React SPA that transforms published books into interactive digital learning experiences with quizzes, reflection journals, calculators, and downloadable SVG templates.

[![CI](https://github.com/muammarlone/gai-observe.website/actions/workflows/ci.yml/badge.svg)](https://github.com/muammarlone/gai-observe.website/actions)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase)](https://supabase.com)

---

## What This Is

**gai-observe.online** is a personal branding and publishing platform built by [Muammar Lone](https://www.linkedin.com/in/muammarlone/) to accompany a catalog of 14+ published books on product management, AI governance, and enterprise architecture.

This repository contains the **Digital Companion 1.0** engine — a React-based interactive web application that readers unlock with a book-specific cipher code after OAuth authentication. Each chapter provides:

- Interactive quizzes with instant scoring
- Reflection journals with auto-save and PDF export
- Domain-specific calculators (RICE scoring, A/B test, churn analysis)
- Downloadable SVG templates (stakeholder maps, GTM canvases)
- Feature-gated premium tiers via Stripe integration
- Real-time news feed aggregation

### Built Entirely with Claude Code

This project was designed, architected, and implemented using [Claude Code](https://claude.ai/claude-code) as the primary development orchestrator. See [docs/CLAUDE-USAGE.md](docs/CLAUDE-USAGE.md) for the full breakdown of how AI-assisted development was applied across architecture, implementation, testing, and deployment.

---

## Architecture Overview

The platform follows a **C4-inspired multi-tier architecture** documented at three levels:

| Level | Scope | Diagram |
|-------|-------|---------|
| **L1 — System Context** | Users, external services, system boundary | [View](docs/diagrams/l1-system-context.mmd) |
| **L2 — Container** | SPA, CMS, CDN, data stores | [View](docs/diagrams/l2-container.mmd) |
| **L3 — Component** | Internal React modules, auth flow, data pipeline | [View](docs/diagrams/l3-component.mmd) |

Full architecture narrative: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19, Vite 8 | SPA with HMR |
| Auth | Supabase Auth + Book Cipher | Two-step verification |
| Styling | CSS custom properties | Dark-mode design system |
| Data | Static JSON per chapter | Zero-server content delivery |
| Export | jsPDF, native Blob | Client-side PDF generation |
| Icons | Lucide React | Accessible SVG icon library |
| Testing | Vitest + Testing Library | Unit + integration tests |
| E2E | Playwright | Browser regression tests |
| CI/CD | GitHub Actions | Lint, test, build gates |
| Hosting | Netlify (static) | CDN-backed deployment |

---

## Project Structure

```
gai-observe.website/
├── docs/                    # Architecture, PRD, design system, Claude usage
│   ├── ARCHITECTURE.md      # L1-L3 with Mermaid diagrams
│   ├── PRD.md               # Product requirements document
│   ├── DESIGN-SYSTEM.md     # Tokens, components, accessibility
│   ├── CLAUDE-USAGE.md      # AI-assisted development showcase
│   ├── DEVELOPMENT-GUIDE.md # Setup, run, test, deploy
│   └── diagrams/            # Mermaid source files (.mmd)
├── artifacts/               # Sprint backlog, quality gates, news feed spec
├── src/
│   ├── App.jsx              # Core engine + section router
│   ├── index.css            # Design system tokens + base styles
│   ├── lib/                 # Auth, feature gates, audit, PDF export
│   ├── components/          # Interactive tools (calculators, quizzes)
│   ├── data/                # Chapter JSON content (zero-code content rule)
│   └── assets/templates/    # Downloadable SVG frameworks
├── public/                  # Static assets (favicon, icons)
├── .github/workflows/       # CI pipeline
└── package.json
```

---

## Key Design Decisions

1. **Zero-Code Content Rule** — All chapter text, quiz questions, and tool configurations live in JSON files, never hardcoded in JSX. Enables non-developer content updates.

2. **Two-Step Auth Invariant** — OAuth (Google/LinkedIn/Yahoo) authenticates identity; a book-specific cipher code authorizes access. OAuth alone never unlocks content.

3. **Fail-Closed Feature Gates** — Premium features are locked by default. The `featureGate` module checks Supabase tier metadata; any failure defaults to base tier.

4. **Client-Side Everything** — No backend server. Auth via Supabase, content from static JSON, PDF export via jsPDF, audit events queued in localStorage.

5. **Progressive Enhancement** — App works without Supabase configured (email-only fallback). Works without Stripe (premium gates show upgrade prompt).

---

## Quick Start

```bash
# Clone
git clone https://github.com/muammarlone/gai-observe.website.git
cd gai-observe.website

# Install
npm install

# Configure (optional — app works without Supabase)
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# Develop
npm run dev

# Test
npm run test

# Build
npm run build
```

See [docs/DEVELOPMENT-GUIDE.md](docs/DEVELOPMENT-GUIDE.md) for full setup instructions.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements, personas, success metrics |
| [Architecture](docs/ARCHITECTURE.md) | L1-L3 system design with Mermaid diagrams |
| [Design System](docs/DESIGN-SYSTEM.md) | CSS tokens, component patterns, accessibility |
| [Claude Usage](docs/CLAUDE-USAGE.md) | AI-assisted development methodology and examples |
| [Development Guide](docs/DEVELOPMENT-GUIDE.md) | Local setup, testing, deployment |
| [Product Backlog](artifacts/backlog.md) | Sprint-organized user stories |
| [Quality Gates](artifacts/quality-gates.md) | CI/CD quality enforcement |
| [News Feed Spec](artifacts/news-feed-spec.md) | RSS aggregation feature design |

---

## License

MIT License. See [LICENSE](LICENSE).

---

**Author:** Muammar Lone | [gai-observe.online](https://gai-observe.online) | [LinkedIn](https://www.linkedin.com/in/muammarlone/) | [YouTube @gai-observe.online](https://youtube.com/@gai-observe.online)
