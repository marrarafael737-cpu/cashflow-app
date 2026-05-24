# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Financeiro Minimalista
**Generated:** 2026-04-30 00:38:00
**Category:** Fintech / Personal Finance

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#2563EB` | `--color-primary` |
| Success | `#059669` | `--color-success` |
| Danger | `#DC2626` | `--color-danger` |
| Background | `#F8FAFC` | `--color-background` |
| Surface | `#FFFFFF` | `--color-surface` |
| Text Main | `#0F172A` | `--color-text-main` |
| Text Muted | `#64748B` | `--color-text-muted` |
| Border | `#E2E8F0` | `--color-border` |

**Color Notes:** Minimalist, clean, and professional. Uses high contrast for readability and subtle grays for hierarchy.

### Typography

- **Heading Font:** Inter
- **Body Font:** Inter
- **Mood:** Clean, modern, trustworthy, minimalist
- **Google Fonts:** [Inter](https://fonts.google.com/specimen/Inter)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tiny gaps |
| `--space-sm` | `8px` | Small elements |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle border enhancement |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Standard cards |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Hover states, modals |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  border: none;
  transition: background 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1d4ed8;
}

/* Outline Button */
.btn-outline {
  background: transparent;
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-outline:hover {
  background: var(--color-background);
  border-color: var(--color-text-muted);
}
```

### Cards

```css
.card {
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

### Inputs

```css
.input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-main);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

---

## Style Guidelines

**Style:** Modern Minimalist

**Keywords:** White space, high contrast, soft shadows, rounded corners, professional.

**Best For:** Fintech, Banking, Personal Finance.

### Page Pattern

**Pattern Name:** Clean Dashboard

- **Hero:** Financial summary cards at the top.
- **Main:** Two-column layout on desktop (70/30). Left: Transactions list. Right: Charts and quick actions.
- **Navigation:** Simple top bar or slim sidebar.

---

## Anti-Patterns (Do NOT Use)

- ❌ **Dark backgrounds for main content** — Stay light and airy.
- ❌ **Vibrant gradients** — Use solid colors or very subtle tints.
- ❌ **Sharp corners (0px radius)** — Use 6px to 12px for a modern feel.
- ❌ **Heavy borders** — Use light borders (`#E2E8F0`) or shadows for separation.

---

## Pre-Delivery Checklist

- [ ] All colors use CSS variables from palette.
- [ ] Typography follows hierarchy (H1 Semibold, Body Regular).
- [ ] No emojis as icons.
- [ ] Hover states implemented for all interactive elements.
- [ ] Responsive grid layout (stacking on mobile).
