# Quality Gates

Every commit and CI run enforces four non-negotiable quality gates.

---

## Gate 1: Lint

```bash
npm run lint
```

**Threshold:** 0 errors
**Config:** ESLint 9 with React Hooks + React Refresh plugins
**Scope:** All `.js` and `.jsx` files in `src/`

---

## Gate 2: Test

```bash
npm run test
```

**Threshold:** All tests pass
**Framework:** Vitest 4 + Testing Library + jsdom
**Coverage areas:**
- `lib/cipher.js` — SHA-256 hash verification
- `lib/featureGate.js` — tier access logic
- `lib/auditLog.js` — event queue formatting
- `components/RICESandbox.jsx` — interactive calculator
- `data/chapterData.test.js` — JSON schema validation

---

## Gate 3: Build

```bash
npm run build
```

**Threshold:** 0 errors
**Output:** `dist/` with optimized chunks:
- `vendor` — React + ReactDOM
- `supabase` — Supabase client
- `tools` — Interactive components

**Chunk size limit:** 600KB (warning threshold)

---

## Gate 4: Audit

```bash
npm audit
```

**Threshold:** 0 critical or high severity vulnerabilities
**Scope:** Production + dev dependencies

---

## CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - run: npm audit --audit-level=high
```

---

## Enforcement

- **Pre-push:** Developers run all four gates locally before pushing
- **CI:** GitHub Actions blocks merge if any gate fails
- **No exceptions:** Zero tolerance for lint errors, test failures, build errors, or security vulnerabilities
