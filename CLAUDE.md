# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static landing page for the **Mahidol x Harvard HSIL Hackathon 2027 — Official Thailand Hub** (Mahidol University hosting Harvard T.H. Chan's Health Systems Innovation Lab hackathon). The copy is in Thai. There's no build step, framework or dependencies.

It was ported from the Claude Design canvas at https://claude.ai/artifact/BaNRDTtWKQRhPy5mDTynjh (artboard `project/Main.dc.html`). That canvas is the design source of truth. If the design changes there, port the change here.

## Files

- `index.html`: all content and markup. Every section is static HTML, so the page works without JS.
- `css/styles.css`: design tokens live on `:root` in two layers. Primitive scales (`--green-*`, `--teal-*`, `--red-*`, `--gray-*`) hold the raw hex values. Semantic aliases (`--ink`, `--green`, `--mint`, `--deep`, `--crimson`, …) point at them, and components use those. Put no raw hex outside `:root`. Components use BEM-style classes (`.hero__title`, `.step--boston`). The main breakpoint is `max-width: 720px`, and the sticky mobile CTA bar `.m-bar` only shows below it.
- Hero: follows the client artwork `assets/aw/Harvard Hackathon 2027_ComingSoon.jpg`. The background is `assets/hero-bg.webp`, a 2400px copy of `assets/aw/Harvard Hackathon 2027_BG.jpg` (regenerate with `ffmpeg -i "assets/aw/Harvard Hackathon 2027_BG.jpg" -vf scale=2400:-1 -q:v 78 assets/hero-bg.webp`). The original artwork in `assets/aw/` is kept out of git because the files are large. The title and theme line use Hubot Sans, the artwork's font. Everything else stays in Kanit.
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
- Logos in `assets/logos/` are official, unedited files: Mahidol from https://mahidol.ac.th/th/logo-corporate-identity/ and NIA from https://www.nia.or.th/. The Harvard T.H. Chan logo (partners strip) was taken from the hsph.harvard.edu page header, because official downloads need a HarvardKey. Harvard marks need approval (trademark.harvard.edu), so confirm the Collaborative Hub agreement covers this use and replace the file with one HSIL supplies. The square "HSIL" box in the header is still a placeholder. Sponsor logos are still gray `.logo-slot` placeholders.
- The fonts are Kanit, plus Hubot Sans for the hero title (both from Google Fonts), and the icons are inline stroke SVGs. Don't use emoji.
- The TH/EN toggle and the footer language links are visual only. There's no English version yet.

## Running

Open `index.html` directly, or serve the folder:

```
python3 -m http.server 8000
```
