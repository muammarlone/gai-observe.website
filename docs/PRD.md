# Product Requirements Document (PRD)
**Product:** gai-observe.online Digital Companion 1.0
**Author:** Muammar Lone
**Status:** Production (Live)
**Last Updated:** 2026-05

---

## 1. Problem Statement

Published nonfiction books are static artifacts. Readers absorb concepts passively with no mechanism for self-assessment, personalized application, or ongoing engagement. Authors lose connection with readers after the point of sale.

**Digital Companion** solves this by transforming each book chapter into an interactive learning module — quizzes validate retention, calculators apply frameworks to the reader's context, reflection journals capture personal action plans, and downloadable templates provide ready-to-use professional tools.

---

## 2. Target Personas

### Primary: The Practitioner Reader
- **Profile:** Mid-career product manager, enterprise architect, or AI governance professional
- **Goal:** Apply book frameworks to their real-world context, not just read about them
- **Pain:** Traditional books provide theory but no interactive practice environment
- **Behavior:** Reads on commute, revisits chapters during project planning, exports tools for team use

### Secondary: The Knowledge Explorer
- **Profile:** Graduate student, career switcher, or professional preparing for certification
- **Goal:** Test understanding, track learning progress, build a portfolio of completed assessments
- **Pain:** No self-assessment mechanism beyond re-reading
- **Behavior:** Completes quizzes chapter-by-chapter, uses journal prompts for study notes

### Tertiary: The Enterprise Leader
- **Profile:** Director/VP evaluating frameworks for team adoption
- **Goal:** Quickly assess a book's practical value before recommending to their org
- **Pain:** Cannot evaluate tool quality without purchasing and reading the entire book
- **Behavior:** Skips directly to calculators and templates, exports artifacts for team review

---

## 3. Product Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| FR-01 | Two-step authentication (OAuth + book cipher) | P0 | Done |
| FR-02 | Chapter-scoped quiz engine with multi-question support | P0 | Done |
| FR-03 | Auto-saving reflection journal with PDF export | P0 | Done |
| FR-04 | Interactive domain calculators (RICE, A/B test, churn, etc.) | P0 | Done |
| FR-05 | SVG template viewer with download capability | P0 | Done |
| FR-06 | Feature-gated premium tier (fail-closed) | P1 | Done |
| FR-07 | Audit event logging (client-side queue) | P1 | Done |
| FR-08 | Multi-book support via config-driven routing | P1 | Done |
| FR-09 | News feed aggregation (RSS/Atom) | P2 | Designed |
| FR-10 | Platform status dashboard (ecosystem health) | P2 | Done |

### 3.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|------------|--------|
| NFR-01 | Initial load time | < 2s on 3G |
| NFR-02 | Lighthouse accessibility score | > 90 |
| NFR-03 | Zero-server dependency for core features | Content works offline after first load |
| NFR-04 | Build size (gzipped) | < 200KB main chunk |
| NFR-05 | Browser support | ES2020+ (Chrome 80+, Firefox 78+, Safari 14+) |
| NFR-06 | WCAG 2.1 AA compliance | Focus rings, ARIA labels, color contrast |

---

## 4. Information Architecture

```
Book Catalog
└── Book (e.g., "PM Field Guide")
    ├── Config (auth rules, cipher prompt, tier settings)
    └── Chapters[]
        └── Sections[]
            ├── quiz        → QuizEngine component
            ├── reflection  → ReflectionJournal component
            ├── tool        → Dynamic calculator component
            ├── templates   → TemplateViewer component
            └── platform_status → PlatformStatusPanel
```

### Content Pipeline
```
Author writes chapter → JSON schema → data/book_id/chapterN.json → App router renders sections
```

All content follows the **zero-code content rule**: text, questions, options, and tool configurations live in JSON, never hardcoded in JSX.

---

## 5. Auth Flow

```
Reader purchases book → Scans QR code → Lands on gai-observe.online
    → Step 1: OAuth (Google / LinkedIn / Yahoo) OR email magic link
    → Step 2: Book cipher (e.g., "Enter the 3rd word from page 15")
    → Access granted → 30-day persistent token in localStorage
```

**Invariant:** OAuth alone never grants access. The book cipher is the authorization gate. This ensures only book purchasers can access companion content.

---

## 6. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly Active Readers | 500+ | Supabase auth events |
| Quiz completion rate | > 70% per chapter | Audit log analysis |
| Journal entries created | > 2 per reader per session | localStorage + PDF export events |
| Template downloads | > 1,000/month | Click tracking |
| Avg. session duration | > 8 minutes | Analytics |
| Reader retention (30-day) | > 40% | Token renewal rate |

---

## 7. Release Roadmap

### v1.0 (Current - Production)
- 13-chapter PM Handbook companion
- 15 interactive tools and calculators
- SVG template library (26 templates)
- OAuth + cipher auth
- Feature gating infrastructure

### v1.1 (Planned)
- News feed aggregation
- Chapter 14-22 content expansion
- Dark/light theme toggle

### v2.0 (Design Phase)
- Multi-book support (Neural Architecture companion)
- Plugin architecture for third-party tool integration
- Pro licensing with Stripe subscriptions
- Embeddable widget for external websites

---

## 8. Constraints

1. **Zero-cost infrastructure** — No paid cloud services. Supabase free tier, Netlify static hosting, GitHub Actions CI.
2. **No backend server** — All logic runs client-side. Auth delegated to Supabase. Content served as static JSON.
3. **Privacy-first** — No third-party analytics. Audit events stay client-side unless user opts in.
4. **Content ownership** — Book text is never embedded in the companion. Only assessment questions, tool configurations, and framework references.
