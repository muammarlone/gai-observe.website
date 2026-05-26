# Development Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Git**

Optional:
- **Supabase account** (free tier) for OAuth authentication
- **Stripe account** (test mode) for premium tier testing

---

## Setup

```bash
# Clone the repository
git clone https://github.com/muammarlone/gai-observe.website.git
cd gai-observe.website

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Environment Configuration

Edit `.env` with your Supabase credentials (optional):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

The app works without Supabase — it falls back to email-only authentication with the book cipher.

---

## Development

```bash
# Start dev server with HMR
npm run dev

# The app is available at http://localhost:5173
```

### Project Structure

```
src/
├── App.jsx              # Main application + section router
├── index.css            # Design system (tokens + base styles)
├── main.jsx             # React root mount
├── lib/
│   ├── supabase.js      # Supabase client (validates config)
│   ├── featureGate.js   # Tier-based feature access
│   ├── cipher.js        # SHA-256 book cipher verification
│   ├── auditLog.js      # Client-side event queue
│   └── pdfExport.js     # jsPDF journal export
├── components/
│   ├── RICESandbox.jsx       # RICE priority calculator
│   ├── ABTestCalculator.jsx  # A/B test significance
│   ├── ChurnCalculator.jsx   # NRR/GRR analysis
│   ├── TemplateViewer.jsx    # SVG template gallery
│   ├── ErrorBoundary.jsx     # React error boundary
│   └── ...                   # 10+ more interactive tools
├── data/
│   ├── index.js              # Data loader (lazy chapter import)
│   └── pm_handbook/
│       ├── config.json       # Book auth configuration
│       ├── chapter1.json     # Chapter 1 content
│       └── ...               # Chapters 2-13
└── assets/
    └── templates/            # 26 downloadable SVG templates
```

### Adding a New Chapter

1. Create `src/data/pm_handbook/chapterN.json`:

```json
{
  "id": "chapterN",
  "title": "Chapter N: Title Here",
  "sections": [
    {
      "type": "quiz",
      "heading": "Test Your Knowledge",
      "questions": [
        {
          "id": "q1_chN",
          "text": "Question text?",
          "options": ["Option A", "Option B", "Option C"],
          "correctAnswer": "Option B",
          "hint": "Explanation text."
        }
      ]
    },
    {
      "type": "reflection",
      "heading": "Action Planning",
      "prompt": "Journal prompt text..."
    }
  ]
}
```

2. Register in `src/data/index.js`

3. Content appears automatically in the chapter dropdown.

---

## Testing

```bash
# Run all tests
npm run test

# Watch mode (re-runs on file change)
npm run test:watch
```

### Test Structure

```
src/
├── test/
│   └── setup.js                        # Vitest globals + jsdom setup
├── lib/__tests__/
│   ├── cipher.test.js                  # Cipher hash verification
│   ├── featureGate.test.js             # Feature tier logic
│   └── auditLog.test.js               # Audit event formatting
├── components/__tests__/
│   └── RICESandbox.test.jsx            # Component interaction tests
└── data/__tests__/
    └── chapterData.test.js             # JSON schema validation
```

---

## Build

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

Build output goes to `dist/`. The Vite config includes:
- **Manual chunking** — vendor (React), supabase, and tools are split for caching
- **Source maps disabled** in production
- **ES2020 target** for modern browser support

---

## Linting

```bash
npm run lint
```

ESLint is configured with:
- React Hooks rules
- React Refresh rules (Vite HMR compatibility)

---

## Quality Gates

Every commit must pass these four gates:

| Gate | Command | Threshold |
|------|---------|-----------|
| Lint | `npm run lint` | 0 errors |
| Test | `npm run test` | All pass |
| Build | `npm run build` | 0 errors |
| Audit | `npm audit` | 0 critical/high |

The CI pipeline enforces these automatically on push and pull request.

---

## Deployment

The app deploys to Netlify as a static site:

1. Push to `main` branch
2. GitHub Actions runs quality gates
3. Netlify builds and deploys automatically

### Netlify Configuration

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## Supabase Setup (Optional)

If you want OAuth authentication:

1. Create a free Supabase project at [supabase.com](https://supabase.com)
2. Enable auth providers (Google, LinkedIn OIDC, Yahoo)
3. Set redirect URL to your deployment URL
4. Copy project URL and anon key to `.env`
5. Run migrations: `npm run db:push`

Without Supabase, the app falls back to email-only auth where the reader enters their email and the book cipher code.
