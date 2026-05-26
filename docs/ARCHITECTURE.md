# System Architecture
**System:** gai-observe.online Digital Companion
**Standard:** C4-Inspired Architectural Modeling (L1 Context, L2 Container, L3 Component)
**Last Updated:** 2026-05

---

## Level 1: System Context

Maps high-level interactions between external actors, the primary system, and third-party dependencies.

```mermaid
graph TD
    Reader([Book Reader]) -->|Scans QR / visits URL| Website[gai-observe.online<br/>Publishing Hub]
    Website -->|Embeds iframe| Companion[Digital Companion<br/>React SPA]
    Companion -->|OAuth + magic link| Supabase[Supabase Auth]
    Companion -->|Premium checkout| Stripe[Stripe Gateway]
    Website -->|Links to bookstore| Retailer[Book Retailer]
    Reader -->|Subscribes| YouTube[YouTube Channel<br/>@gai-observe.online]
    Reader -->|Reads feed| NewsFeed[RSS/Atom Sources]

    classDef Actor fill:#8B5CF6,stroke:#F8FAFC,color:#fff
    classDef System fill:#06B6D4,stroke:#F8FAFC,color:#fff
    classDef External fill:#334155,stroke:#94A3B8,color:#fff

    class Reader Actor
    class Website,Companion System
    class Supabase,Stripe,Retailer,YouTube,NewsFeed External
```

### L1 Decisions
- **Single system boundary** encompasses both the CMS-hosted website and the SPA companion
- **Supabase** chosen for auth because of generous free tier (50K MAU) and built-in OAuth providers
- **No custom backend** — eliminates server maintenance, hosting costs, and attack surface

---

## Level 2: Container Diagram

Zooms into the system boundary to show deployment containers, data stores, and communication patterns.

```mermaid
graph TD
    subgraph "CMS-Hosted Website"
        Homepage[Homepage<br/>Link Hub]
        BookPages[Book Landing Pages]
        IframeHost[Companion<br/>iframe Container]
    end

    subgraph "Static SPA (CDN-Deployed)"
        ReactApp[React 19 SPA<br/>Vite 8 Build]
        ChapterJSON[(Chapter JSON<br/>Static Assets)]
        SVGTemplates[(SVG Template<br/>Library)]
    end

    subgraph "Client Browser"
        LocalStorage[(localStorage<br/>Auth Token + Journals)]
        BlobExport[PDF/Blob Export<br/>Native Browser API]
    end

    subgraph "External Services"
        SupabaseAuth[Supabase Auth<br/>OAuth + Magic Link]
        StripeAPI[Stripe Checkout<br/>Premium Tier]
        RSSFeeds[RSS/Atom Feeds<br/>News Aggregation]
    end

    Homepage -->|Navigate| IframeHost
    IframeHost -->|Loads via CDN| ReactApp
    ReactApp -->|Reads| ChapterJSON
    ReactApp -->|Renders| SVGTemplates
    ReactApp <-->|Read/Write| LocalStorage
    ReactApp -->|Generates| BlobExport
    ReactApp -->|Auth flow| SupabaseAuth
    ReactApp -->|Checkout flow| StripeAPI
    ReactApp -->|Fetches| RSSFeeds

    classDef CMS fill:#1E293B,stroke:#06B6D4,color:#fff
    classDef SPA fill:#0F172A,stroke:#8B5CF6,color:#fff
    classDef Browser fill:#1E293B,stroke:#10B981,color:#fff
    classDef External fill:#334155,stroke:#F59E0B,color:#fff

    class Homepage,BookPages,IframeHost CMS
    class ReactApp,ChapterJSON,SVGTemplates SPA
    class LocalStorage,BlobExport Browser
    class SupabaseAuth,StripeAPI,RSSFeeds External
```

### L2 Decisions
- **iframe embedding** isolates companion code from CMS context (security boundary)
- **Static JSON** instead of API — zero latency, zero server cost, works offline
- **localStorage** for journals/tokens — no server-side session storage needed
- **CDN deployment** via Netlify — global edge caching, automatic HTTPS

---

## Level 3: Component Diagram

Zooms into the React SPA container to detail internal modules, data flow, and responsibilities.

```mermaid
graph TD
    subgraph "Entry Point"
        Main[main.jsx<br/>React Root Mount]
    end

    subgraph "Core Engine (App.jsx)"
        Router[Section Router<br/>Type-based dispatch]
        AccessGate[AccessGate<br/>Two-step Auth UI]
    end

    subgraph "Security Layer"
        Cipher[cipher.js<br/>SHA-256 Hash Verify]
        FeatureGate[featureGate.js<br/>Tier Check + Supabase]
        AuditLog[auditLog.js<br/>Event Queue + Flush]
        SupabaseClient[supabase.js<br/>Client Factory]
    end

    subgraph "Interactive Components"
        QuizEngine[QuizEngine<br/>Multi-Q Scoring]
        Journal[ReflectionJournal<br/>Auto-save + PDF]
        RICE[RICESandbox<br/>Priority Calculator]
        ABTest[ABTestCalculator<br/>Statistical Significance]
        Churn[ChurnCalculator<br/>NRR Analysis]
        GTM[GTMScorecard<br/>Go-to-Market Scoring]
        Funnel[FunnelAnalyzer<br/>Conversion Metrics]
        Template[TemplateViewer<br/>SVG Download]
    end

    subgraph "Data Layer"
        ConfigJSON[(config.json<br/>Book Auth Rules)]
        ChapterData[(chapterN.json<br/>Section Definitions)]
        DataIndex[data/index.js<br/>Lazy Loader]
    end

    Main --> AccessGate
    AccessGate -->|Step 1| SupabaseClient
    AccessGate -->|Step 2| Cipher
    AccessGate -->|Unlocked| Router

    Router --> FeatureGate
    FeatureGate -->|Base tier| QuizEngine
    FeatureGate -->|Base tier| Journal
    FeatureGate -->|Base tier| RICE
    FeatureGate -->|Base tier| ABTest
    FeatureGate -->|Premium check| Churn
    FeatureGate -->|Premium check| GTM
    FeatureGate -->|Premium check| Funnel
    FeatureGate -->|Base tier| Template

    Router --> DataIndex
    DataIndex --> ConfigJSON
    DataIndex --> ChapterData

    QuizEngine --> AuditLog
    Journal --> AuditLog
    RICE --> AuditLog

    classDef Entry fill:#8B5CF6,stroke:#fff,color:#fff
    classDef Security fill:#EF4444,stroke:#fff,color:#fff
    classDef UI fill:#06B6D4,stroke:#fff,color:#1E293B
    classDef Data fill:#10B981,stroke:#fff,color:#1E293B

    class Main Entry
    class AccessGate,Cipher,FeatureGate,AuditLog,SupabaseClient Security
    class QuizEngine,Journal,RICE,ABTest,Churn,GTM,Funnel,Template,Router UI
    class ConfigJSON,ChapterData,DataIndex Data
```

### L3 Component Specifications

| Component | Responsibility | State Management |
|-----------|---------------|-----------------|
| **AccessGate** | Two-step auth UI (OAuth → cipher) | Local state + Supabase session listener |
| **QuizEngine** | Multi-question assessment with scoring | Local selections + submitted flag |
| **ReflectionJournal** | Auto-saving textarea with PDF export | Debounced localStorage writes |
| **RICESandbox** | RICE priority scoring calculator | Local feature array + sort |
| **ABTestCalculator** | Statistical significance calculator | Local form state |
| **TemplateViewer** | SVG template gallery with download | Static asset references |
| **FeatureGate** | Tier-based access control | Supabase subscription query |
| **AuditLog** | Client-side event queue with batch flush | In-memory queue + localStorage fallback |

---

## Data Flow

```mermaid
sequenceDiagram
    participant R as Reader
    participant A as AccessGate
    participant S as Supabase
    participant C as Cipher Module
    participant E as Engine (App.jsx)
    participant D as Chapter JSON

    R->>A: Visit companion URL
    A->>S: OAuth sign-in (Google/LinkedIn)
    S-->>A: Session token + user email
    A->>R: Prompt for book cipher
    R->>A: Enter cipher answer
    A->>C: verifyCipher(answer, hashes)
    C-->>A: true/false
    A->>E: onUnlock(true)
    E->>D: getChapterData(bookId, chapterId)
    D-->>E: {title, sections[]}
    E->>R: Render quiz/journal/calculator sections
```

---

## Deployment Architecture

```mermaid
graph LR
    subgraph "Developer"
        Code[Source Code] -->|git push| GitHub[GitHub Repo]
    end

    subgraph "CI/CD"
        GitHub -->|Trigger| Actions[GitHub Actions<br/>lint + test + build]
        Actions -->|Deploy| Netlify[Netlify CDN<br/>Static Hosting]
    end

    subgraph "Runtime"
        Netlify -->|Serves| Browser[Reader Browser]
        Browser <-->|Auth| Supabase[Supabase<br/>Free Tier]
    end

    classDef Dev fill:#8B5CF6,stroke:#fff,color:#fff
    classDef CI fill:#F59E0B,stroke:#fff,color:#1E293B
    classDef Prod fill:#10B981,stroke:#fff,color:#1E293B

    class Code,GitHub Dev
    class Actions,Netlify CI
    class Browser,Supabase Prod
```

### Infrastructure Costs

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| GitHub | Free | $0 |
| GitHub Actions | Free (2,000 min/mo) | $0 |
| Netlify | Free (100GB bandwidth) | $0 |
| Supabase | Free (50K MAU) | $0 |
| **Total** | | **$0** |
