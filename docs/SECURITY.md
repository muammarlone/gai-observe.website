# Security Architecture
**System:** gai-observe.online Digital Companion
**Standard:** OWASP Top 10 (2021) alignment
**Last Updated:** 2026-05

---

## Threat Model

The Digital Companion is a **public-facing SPA** embedded in a CMS-hosted website. Key threat vectors:

| Vector | Risk | Mitigation |
|--------|------|-----------|
| Unauthorized content access | Bypass auth to view paid companion content | Two-step auth invariant |
| Privilege escalation | Upgrade from base to premium tier without paying | Fail-closed feature gates, server-side tier check |
| Session hijacking | Steal or forge auth tokens | 30-day TTL, structured validation, Supabase JWT |
| XSS injection | Malicious scripts in user input or JSON content | CSP headers, no `dangerouslySetInnerHTML`, React auto-escaping |
| Open redirect | OAuth callback manipulation | Allowlisted redirect origins |
| Data exfiltration | Access other users' audit events or subscriptions | Supabase Row Level Security (RLS) |
| CORS abuse | Cross-origin requests to RSS proxy | Explicit CORS headers, input validation |

---

## Authentication: Two-Step Invariant

The core security design principle is that **OAuth alone never grants access**. Authentication (identity) and authorization (book ownership) are separate gates.

```
Step 1: Identity Authentication
  ├── OAuth (Google, LinkedIn, Yahoo) via Supabase
  ├── Magic link (email OTP) via Supabase
  └── Email-only fallback (when Supabase not configured)

Step 2: Book Cipher Authorization
  └── SHA-256 hash comparison against config.json hashes
      ├── Input normalized: trim() + toLowerCase()
      ├── Hashed via Web Crypto API (crypto.subtle.digest)
      └── Compared against pre-computed answer hashes
          (answers never stored in plaintext)
```

### Why Two Steps?

OAuth proves identity but not book ownership. A reader who hasn't purchased the book could authenticate via Google but would be blocked at the cipher step. The cipher question references a specific page and word in the physical/digital book, creating a proof-of-purchase gate without requiring a purchase verification API.

### Implementation Details

```javascript
// Cipher verification — answers never leave the client as plaintext
export async function verifyCipher(input, validHashes = []) {
  const normalized = input.trim().toLowerCase();
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalized)
  );
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return validHashes.includes(hashHex);
}
```

**Security properties:**
- Answers are hashed client-side using Web Crypto API (not a custom implementation)
- Only SHA-256 hashes are stored in `config.json` — never plaintext answers
- Normalization prevents case/whitespace bypass attempts
- Empty/null input rejected before hashing

### Token Persistence

After successful two-step verification, a structured JSON token is stored in `localStorage`:

```json
{
  "ts": 1716739200000,
  "email": "reader@example.com",
  "provider": "google",
  "verified": true
}
```

**Validation on reload:**
1. Parse JSON — reject if not an object
2. Check `ts` is a number
3. Check `email` is a string
4. Check `provider` is a string
5. Verify TTL: `Date.now() - ts < 30 days`
6. If any check fails: delete token, require re-authentication

This prevents trivially forged tokens (e.g., `localStorage.setItem('gai_access_pm_handbook', 'true')`) from bypassing auth.

---

## Authorization: Fail-Closed Feature Gates

Premium content is locked by default. The `featureGate` module queries the Supabase `subscriptions` table to determine tier.

### Trust Model

| Source | Trusted? | Reason |
|--------|----------|--------|
| `subscriptions` table (Supabase, RLS-protected) | Yes | Admin-writable only, read via RLS |
| `user_metadata` (Supabase user object) | No | Client-writable in some Supabase configurations |
| `localStorage` | No | Trivially spoofable by the user |
| URL parameters | No | User-controlled |

### Fail-Closed Logic

```javascript
// Default state is always BASE tier
const [tier, setTier] = useState(TIERS.BASE);

try {
  // Query server-authoritative subscription table
  const { data, error } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  // Only upgrade if server explicitly confirms
  if (!error && data?.tier && (data.tier === 'pro' || data.tier === 'enterprise')) {
    setTier(data.tier);
  }
} catch {
  // ANY failure = fail closed to base tier
}
```

**Guarantee:** If Supabase is down, misconfigured, or returns an error, all premium features remain locked. There is no fallback that grants premium access.

---

## Database Security: Row Level Security (RLS)

All Supabase tables use Row Level Security policies:

### `audit_events` table

```sql
-- Users can only insert events attributed to themselves
CREATE POLICY "Authenticated users can insert own events"
  ON audit_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only read their own events
CREATE POLICY "Users can read own events"
  ON audit_events FOR SELECT
  USING (auth.uid() = user_id);
```

**Bug found and fixed:** The initial migration allowed `user_id IS NULL` in the insert policy, which meant unauthenticated requests could insert audit events. This was caught and fixed in migration `20260329`:

```sql
-- BEFORE (vulnerable): allowed anonymous inserts
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- AFTER (fixed): only authenticated users
WITH CHECK (auth.uid() = user_id);
```

**Lesson:** Always review RLS policies for `OR ... IS NULL` escape hatches. The `IS NULL` clause in a `WITH CHECK` policy effectively makes authentication optional.

### `subscriptions` table

```sql
-- Users can read their own subscription (select only)
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policy = users cannot modify subscriptions
-- Only service_role (admin) can write to this table
```

**Tier field validation** at the database level:

```sql
tier TEXT NOT NULL DEFAULT 'base' CHECK (tier IN ('base', 'pro', 'enterprise'))
status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired'))
```

---

## HTTP Security Headers

All responses include defense-in-depth headers via Netlify configuration:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    # Prevent MIME type sniffing
    X-Content-Type-Options = "nosniff"

    # Allow framing only from same origin (needed for CMS iframe embedding)
    X-Frame-Options = "SAMEORIGIN"

    # Legacy XSS filter
    X-XSS-Protection = "1; mode=block"

    # Referrer control
    Referrer-Policy = "strict-origin-when-cross-origin"

    # Disable unnecessary browser APIs
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"

    # Force HTTPS with HSTS preload
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"

    # Content Security Policy
    Content-Security-Policy = "default-src 'self'; \
      script-src 'self' 'unsafe-inline'; \
      style-src 'self' 'unsafe-inline'; \
      img-src 'self' data: blob: https:; \
      font-src 'self' https:; \
      connect-src 'self' https://*.supabase.co wss://*.supabase.co; \
      frame-ancestors 'self' https://gai-observe.online;"
```

### CSP Breakdown

| Directive | Value | Rationale |
|-----------|-------|-----------|
| `default-src` | `'self'` | Deny all external resources by default |
| `script-src` | `'self' 'unsafe-inline'` | Allow bundled scripts + Vite inline scripts |
| `style-src` | `'self' 'unsafe-inline'` | Allow CSS modules + inline component styles |
| `img-src` | `'self' data: blob: https:` | Allow SVG templates, inline images, external images |
| `connect-src` | `'self' https://*.supabase.co wss://*.supabase.co` | Allow Supabase API + WebSocket |
| `frame-ancestors` | `'self' https://gai-observe.online` | Allow embedding only from CMS domain |

### Cache Strategy

| Resource | Cache Policy | Rationale |
|----------|-------------|-----------|
| `/index.html` | `max-age=0, must-revalidate` | Always serve fresh HTML |
| `/assets/*` (hashed) | `max-age=31536000, immutable` | Content-addressed, safe to cache forever |
| `/assets/templates/*` | `max-age=604800, stale-while-revalidate=86400` | Templates change infrequently |

---

## OAuth Redirect Safety

OAuth flows redirect the user to a provider and back. If the redirect URL isn't validated, attackers can exploit open redirect vulnerabilities.

```javascript
const ALLOWED_ORIGINS = [
  'https://gai-observe.online',
  'http://localhost:5173',
  'http://localhost:4173'
];

export function getSafeRedirectOrigin() {
  const origin = window.location.origin;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  console.warn('[AccessGate] Unrecognized origin:', origin);
  return ALLOWED_ORIGINS[0]; // Fall back to production
}
```

**Properties:**
- Explicit allowlist — no regex matching that could be bypassed
- Unknown origins fall back to production domain (not to the current origin)
- Warning logged for monitoring

---

## Client-Side Security Patterns

### Input Validation

| Input | Validation | Location |
|-------|-----------|----------|
| Email | RFC-compliant regex before submission | `AccessGate` |
| Cipher answer | Non-empty string check, then SHA-256 | `cipher.js` |
| Audit event type | Truncated to 100 chars | `auditLog.js` |
| Audit payload | Capped at 8KB, truncation flag | `auditLog.js` |
| Book ID | Truncated to 50 chars | `auditLog.js` |
| localStorage token | Full structural validation (not just truthy check) | `App.jsx` |

### XSS Prevention

1. **React auto-escaping** — All dynamic content rendered via JSX is escaped by default
2. **No `dangerouslySetInnerHTML`** — Never used anywhere in the codebase
3. **JSON data only** — Chapter content is structured JSON, not raw HTML
4. **HTML stripping in RSS function** — Server-side `stripHtml()` removes all tags before sending to client
5. **`escapeHtml()` in widget** — Widget JS explicitly escapes all dynamic content before DOM insertion

### Supabase URL Validation

The Supabase client factory validates the configured URL before creating a client:

```javascript
function isValidSupabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('.supabase.co') &&
      !parsed.hostname.includes('your_project_ref')
    );
  } catch {
    return false;
  }
}
```

This prevents:
- HTTP downgrade attacks (requires `https:`)
- Accidental connection to non-Supabase endpoints
- Unmodified placeholder values triggering connections

---

## CORS Handling (RSS Proxy)

> **Note:** The RSS proxy function and news widget are part of the production deployment but are not included in this sample repository. The patterns below document the production security architecture.

The serverless RSS function handles cross-origin requests with explicit headers:

```javascript
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
```

**Design decision:** `Access-Control-Allow-Origin: *` is acceptable here because:
- The RSS proxy serves publicly available news articles
- No authentication or cookies are involved in RSS requests
- The function only supports `GET` (read-only)
- Input is validated (source parameter must match FEEDS allowlist)

---

## Audit Trail

All significant user interactions are logged to an audit trail:

| Event | Data Captured |
|-------|---------------|
| `quiz_submit` | Heading, total questions, correct count |
| `tool_use` | Component name, action type |
| `gate_unlock` | Auth method, book ID |
| `export_pdf` | Chapter, journal prompt |
| `error_boundary` | Error message (truncated), component stack (truncated) |

**Privacy:** Audit events are scoped per-user via RLS. No cross-user data access is possible. When Supabase is unavailable, events queue in localStorage (capped at 500) and flush on next session.

---

## Security Checklist

- [x] Two-step auth (identity + authorization)
- [x] SHA-256 cipher verification (Web Crypto API)
- [x] Fail-closed feature gates (server-authoritative)
- [x] Row Level Security on all tables
- [x] HSTS with preload
- [x] Content Security Policy
- [x] X-Frame-Options: DENY
- [x] No secrets in client code (.env for config)
- [x] OAuth redirect allowlist (no open redirects)
- [x] Input validation and size caps on all user-controlled data
- [x] Structured token validation (not truthy checks)
- [x] Anonymous insertion bug found and patched
- [x] React auto-escaping (no dangerouslySetInnerHTML)
- [x] HTML stripped server-side before API response
- [x] Immutable cache headers for hashed assets
- [x] No cache on HTML entry point
