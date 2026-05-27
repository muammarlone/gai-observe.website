# Design System
**System:** gai-observe.online Digital Companion
**Theme:** Dark Professional
**Standard:** WCAG 2.1 AA

---

## Design Tokens

All values are CSS custom properties defined in `src/index.css`. Components reference tokens exclusively — no hardcoded colors or spacing.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-slate` | `#0F172A` | Page background |
| `--panel-slate` | `#1E293B` | Card / panel surface |
| `--panel-border` | `#334155` | Subtle borders |
| `--text-primary` | `#F1F5F9` | Primary content (12:1 contrast on bg) |
| `--text-muted` | `#94A3B8` | Secondary text (4.6:1 contrast on panel) |
| `--accent-violet` | `#8B5CF6` | Primary CTA, brand accent |
| `--accent-violet-hover` | `#7C3AED` | Hover state |
| `--accent-cyan` | `#06B6D4` | Secondary highlight |
| `--success-emerald` | `#10B981` | Success states |
| `--warning-amber` | `#F59E0B` | Warning states |
| `--error-rose` | `#EF4444` | Error states |

### Spacing Scale (8px base)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight internal padding |
| `--space-sm` | `8px` | Default gap |
| `--space-md` | `16px` | Component padding |
| `--space-lg` | `24px` | Section spacing |
| `--space-xl` | `32px` | Page-level margins |

### Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |

---

## Accessibility

### Focus Management

```css
/* Keyboard-only focus ring — does NOT show on mouse click */
:focus-visible {
  outline: 2px solid var(--ring-color);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

:focus:not(:focus-visible) {
  outline: none;
}
```

- `--ring-color: #8B5CF6` — visible on both dark bg and panel surfaces
- `--ring-offset: #0F172A` — matches page background for crisp separation

### Skip Navigation

Hidden skip-to-content link appears on Tab:

```css
.skip-to-content {
  position: absolute;
  top: -100%;
  /* Slides into view on :focus-visible */
}
```

### ARIA Labels

All interactive elements include `aria-label` attributes:
- `aria-label="Select chapter"` on chapter dropdown
- `aria-label="Email address"` on auth input
- `aria-label="Book cipher access code"` on cipher input
- `role="alert"` on error messages

### Color Contrast

| Combination | Ratio | WCAG Level |
|-------------|-------|------------|
| `--text-primary` on `--bg-slate` | 12:1 | AAA |
| `--text-muted` on `--panel-slate` | 4.6:1 | AA |
| `--accent-violet` on `--bg-slate` | 5.2:1 | AA |
| `--error-rose` on `--bg-slate` | 4.8:1 | AA |

---

## Component Patterns

### Panel (Card)

```css
.panel {
  background: var(--panel-slate);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);    /* 12px */
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
```

### Button (Primary CTA)

```css
.btn-primary {
  background: var(--accent-violet);
  color: white;
  border: none;
  border-radius: var(--radius-md);    /* 8px */
  padding: 10px 20px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  min-height: 40px;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-violet-hover);
}
```

### Input Field

```css
.input-field {
  width: 100%;
  padding: 11px 12px;
  background: var(--bg-slate);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-md);    /* 8px */
  color: var(--text-primary);
  font-size: 0.875rem;
}
```

---

## Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Body | 16px (1rem) | 400 | 1.5 |
| H1 | 20px (1.25rem) | 700 | 1.2 |
| H2 | 18px (1.125rem) | 600 | 1.2 |
| H3 | 16px (1rem) | 600 | 1.2 |
| Small / Muted | 14px (0.875rem) | 400 | 1.4 |
| Caption | 13.6px (0.85rem) | 400 | 1.4 |

**Font Stack:** `'Inter', system-ui, -apple-system, sans-serif`

---

## Responsive Strategy

The design primarily uses CSS Grid with `auto-fit` for responsive layouts:

```css
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```

Supplemented by two explicit media queries:

| Breakpoint | Purpose |
|------------|---------|
| `max-width: 640px` | Stacks header, full-width selects, reduced panel padding |
| `prefers-reduced-motion: reduce` | Disables all animations and transitions |

Components reflow naturally via `auto-fit` grids; the 640px breakpoint handles layout elements that don't adapt intrinsically (header flex direction, select widths).

---

## Icon System

Using [Lucide React](https://lucide.dev/) for consistent, accessible SVG icons:

| Icon | Component | Usage |
|------|-----------|-------|
| `Lock` | AccessGate | Auth panel header |
| `LogIn` | AccessGate | Step 1 label |
| `Mail` | AccessGate | Email auth button |
| `FileText` | ReflectionJournal | Journal header |
| `CheckCircle` | QuizEngine | Quiz header |
| `Cpu` | MarketShiftExplorer | Tool header |
| `Download` | ReflectionJournal | PDF export button |
