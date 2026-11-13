# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static landing page for the **Mahidol x Harvard HSIL Hackathon 2027 — Official Thailand Hub** (Mahidol University hosting Harvard T.H. Chan's Health Systems Innovation Lab hackathon). The copy is in Thai. There's no build step, framework or dependencies.

It was ported from the Claude Design canvas at https://claude.ai/artifact/BaNRDTtWKQRhPy5mDTynjh (artboard `project/Main.dc.html`). That canvas is the design source of truth. If the design changes there, port the change here.

## Files

- `index.html`: all content and markup. Every section is static HTML, so the page works without JS.
- `css/styles.css`: design tokens live on `:root` in two layers. Primitive scales (`--green-*`, `--teal-*`, `--red-*`, `--gray-*`) hold the raw hex values. Semantic aliases (`--ink`, `--green`, `--mint`, `--deep`, `--crimson`, …) point at them, and components use those. Put no raw hex outside `:root`. Components use BEM-style classes (`.hero__title`, `.step--boston`). There's one breakpoint at `max-width: 720px`, and the sticky mobile CTA bar `.m-bar` only shows below it.
- `js/main.js`: progressive enhancement only. It fills the countdown (`[data-days-left]`), swaps the CTA state, collapses the mobile nav behind `.nav-toggle`, badges the current pathway step and runs count-ups.

## Registration CTA switch

The CTA has two states, set by `REGISTRATION_OPEN` / `APPLY_URL` at the top of `js/main.js`:
- **Closed** (default): buttons link to an "add to Google Calendar" link for 16–17 Apr 2027 (the link says `20270416/20270418` because Google's end date is exclusive).
- **Open**: buttons link to `APPLY_URL` with the "สมัคร" labels.

JS rewrites any element with `data-cta="label"` or `data-cta="short"` (href and text) and any element with `data-cta-note` (text). The HTML holds the closed-state text as the no-JS fallback. Keep the two in sync when you edit copy.

## Content conventions

- Text in `[square brackets]` is a placeholder awaiting real content: logos, team names, photos, contact details, counts. Unconfirmed facts also carry the `.todo` class, which renders them in crimson. Never invent values for them.
- Brand: the Thailand Hub leads and Harvard HSIL appears as the global partner. The palette is teal/mint plus Harvard crimson as the accent (`--crimson` for text on light backgrounds, `--crimson-bright` on dark ones). This intentionally differs from the original canvas.
- Dates use the Thai Buddhist year with the Gregorian year in parentheses, e.g. `2570 (2027)`.
- The fonts are Kanit (from Google Fonts) and the icons are inline stroke SVGs. Don't use emoji.
- The TH/EN toggle and the footer language links are visual only. There's no English version yet.

## Running

Open `index.html` directly, or serve the folder:

```
python3 -m http.server 8000
```
