# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static landing page for the **Mahidol x Harvard Hackathon 2027 — Official Thailand Hub** (Mahidol University hosting Harvard T.H. Chan's Health Systems Innovation Lab hackathon). The copy is in Thai. There's no framework and no runtime dependencies. The only dev dependency is Sass, and the compiled CSS is committed, so the site runs without a build step.

The page was first ported from the Claude Design canvas at https://claude.ai/artifact/BaNRDTtWKQRhPy5mDTynjh (artboard `project/Main.dc.html`). The current design ("ศูนย์ประเทศไทย: the artwork, carried through the page", developed as `v3/` and promoted to the root after the client's review) has moved away from that canvas. The client artwork in `assets/aw/` is now the visual reference.

## Files

- `index.html`: all content and markup. Every section is static HTML, so the page works without JS.
- `scss/`: the stylesheet source. Edit these files, never `css/styles.css`. `npm run build` compiles `scss/main.scss` to `css/styles.css` (and `v2/`, below), and the compiled file is committed so the site still runs without a build step. Always rebuild and commit both together.
  - `abstracts/`: the breakpoint variables and the `tablet-down` / `mobile` mixins. This folder emits no CSS.
  - `base/`: `_tokens.scss` (the `:root` custom properties) and `_base.scss` (reset, body, links, focus, `.sr-only`, `.nowrap`).
  - `layout/`: container, status bar, header and nav, the numbered `.section` frame and `.split` rows, footer, and the sticky mobile bar `.m-bar`.
  - `components/`: reusable pieces (eyebrow, buttons, ruled `.facts` definition lists, `.numbered` lists, photo frames, placeholder/todo/`data-mock`).
  - `sections/`: one partial per page section, in page order (hero, key-facts, numbers, about, benefits, pathway, archive, partners, faq).
  - `main.scss` sets the cascade order: tokens, then base, layout, components, sections. A new partial goes into the matching folder and gets a `@use` line in `main.scss`.
  - Tokens stay CSS custom properties, not Sass variables, because they change at runtime (`--gutter` on mobile, the `--on-*` set inside dark bands). Primitive scales hold the raw hex values; semantic aliases (`--ink`, `--green`, `--mint`, `--deep`, `--crimson`, …) point at them, and components use those. Put no raw hex outside `base/_tokens.scss`.
  - Components use BEM-style classes written with `&__element` / `&--modifier` nesting. Keep nesting to one or two levels. Put each media query inside the rule it changes (`@include mobile { … }`), not in a separate responsive file.
- Hero: the client artwork `assets/aw/Harvard Hackathon 2027_ComingSoon.jpg` brought to life. The background is `assets/hero-bg.webp`, a 2400px copy of `assets/aw/Harvard Hackathon 2027_BG.jpg` (regenerate with `ffmpeg -i "assets/aw/Harvard Hackathon 2027_BG.jpg" -vf scale=2400:-1 -q:v 78 assets/hero-bg.webp`), under a left scrim that keeps the copy readable. Chrome "HSIL Hackathon", mint "2027" and the mint theme line are Mona Sans, which has the artwork's plain zero and I (Hubot Sans on Google Fonts renders a barred zero and serifed I). The original artwork files in `assets/aw/` are large; don't reference them from the page.
- Palette: taken from the artwork. White and light green-tint grounds, teal→green gradient dark bands (pathway, closing section), mint only on dark grounds (hero year and theme line, buttons on dark). Harvard crimson is the accent, placed as in `v2/`: section index numbers, list numerals, the role separators, FAQ markers, archive rank labels and quote rule, link hovers, focus rings on light grounds, status dots and `data-mock` underlines. On light grounds use `--crimson`; on the dark bands use `--crimson-soft` for text (5.3:1 at the gradient's light end) and `--crimson-rule` for rules, bars and dots (decorative only, it fails text contrast there). The hero keeps the artwork's colours. Large figures and the prize bars stay dark green.
- Header: the Mahidol seal alone leads at every width, then a crimson mono "×" and the Harvard Chan logo, as in `v2/`. The full Thai/English lockup appears only in the partners section. Below 1024px the nav collapses behind a hamburger button (`.nav-toggle`, an inline SVG that turns into a cross; `aria-label="เมนู"` plus `aria-expanded`; Esc closes it).
- `js/main.js`: progressive enhancement only. Its language comes from `<html lang>` (see Content conventions). It swaps the CTA state, fills the "อีก N วันถึงวันแข่งขัน" line (`[data-days-left]`), collapses the nav behind `.nav-toggle`, tucks `.m-bar` away while the hero CTA is on screen, marks the current pathway stage (with an sr-only "สถานะ:"), and runs count-ups that keep the real figure for screen readers.

## v2 (alternative design, for comparison)

`v2/` is an earlier alternative design ("Official programme, Bangkok → Boston"): light paper ground, typography-led, crimson accents, monospace labels, a fact-sheet panel with a countdown, and the pathway as a route table. It is served at `/v2/` and kept for comparison only. It has its own `v2/index.html`, `v2/scss/` → `v2/css/styles.css` (`npm run build:v2` / `watch:v2`) and `v2/js/main.js`, and shares `../assets/`. It now shares the root page's formal Thai copy and its "Coming Soon" CTA state (same `REGISTRATION_OPEN` / `APPLY_URL` switch and `.btn:not([href])` rule), so make copy changes in both pages. It is bilingual the same way as the root: `v2/en/index.html` (assets via `../../`) is the English copy, and `v2/js/main.js` takes its runtime strings (CTA, countdown sentence, pathway status, ticker pause button) from `STRINGS` by `<html lang>`. A copy change therefore touches four files: `index.html`, `en/index.html`, `v2/index.html`, `v2/en/index.html`.

`/v3/` used to hold the current design before it moved to the root; `vercel.json` redirects `/v3/…` to `/`.

## Responsive

The page has to work at every width from 360px to 1440px+, not just at the breakpoints.

- There are two breakpoints. `max-width: 1023px` (tablet and below) collapses the nav behind `.nav-toggle`. `max-width: 720px` (mobile) shrinks the gutter to 16px and shows the sticky CTA bar `.m-bar`. Don't add a breakpoint for one component when fluid sizing can do the job.
- Size display text with `clamp(min, vw, max)` so it scales smoothly. A fixed px size that jumps at a breakpoint overflows the widths in between. For example, the hero's "Hackathon 2027" is about 9.5em wide, so it uses `clamp(32px, 9vw, 100px)`.
- Text that never wraps (`white-space: nowrap`, the hero title) must fit the narrowest viewport. `.hero` has `overflow: hidden`, so anything that overflows gets clipped without showing a scrollbar. Checking `scrollWidth` won't catch it.
- Before calling a layout change done, check it at 390, 768, 1024 and 1440. For each width, confirm that no element's bounding box goes past the viewport edge and that the header stays on a single row. Then take a screenshot of the hero and any section you changed.
- Grids should wrap without leaving a lone orphan card on the last row if that can be avoided. Tap targets are at least `var(--tap)` tall.

## Registration CTA switch

The CTA has two states, set by `REGISTRATION_OPEN` / `APPLY_URL` at the top of `js/main.js`:
- **Closed** (default): every CTA (header, hero, closing section, mobile bar) reads "Coming Soon" and has no `href`, so it is plain text styled as a button (`.btn:not([href])` drops the arrow and the hover). The status texts read "เปิดรับสมัครเร็ว ๆ นี้". There is no separate "Coming Soon" label elsewhere on the page.
- **Open**: JS turns the CTAs into links to `APPLY_URL` with the "สมัครเข้าร่วมการแข่งขัน" / "สมัคร" labels and sets the status texts to "เปิดรับสมัครแล้ว".

JS rewrites elements with `data-cta="label"` or `data-cta="short"` (href, text, and drops `lang="en"`), and elements with `data-cta-note` or `data-reg-status` (text). The HTML holds the closed state as the no-JS fallback, so in the closed state JS changes nothing. Keep the two in sync when you edit copy.

## Content conventions

- Text in `[square brackets]` is a placeholder awaiting real content: logos, team names, photos, contact details, counts. Unconfirmed or mock facts carry `data-mock`, which renders a dotted underline (and a dashed frame on photos); the footer explains it. `.todo` marks an unconfirmed fact in dark green. Never invent values for them.
- Copy: Thai is the primary voice and is written in the register of an official university announcement: full sentences, ผู้สมัคร/ผู้เข้าแข่งขัน rather than คุณ/เรา, full month names, ปัญญาประดิษฐ์ (AI) on first mention. Labels are Thai; keep English only for programme names (Hackathon, Bootcamp, Demo Day, Thailand Hub, HSIL …). Mahidol is named as the organiser.
- Brand: the Thailand Hub (Mahidol) leads and Harvard HSIL appears as the global partner.
- Dates use the Thai Buddhist year with the Gregorian year in parentheses, e.g. `2570 (2027)`.
- Logos in `assets/logos/` are official, unedited files: Mahidol from https://mahidol.ac.th/th/logo-corporate-identity/ and NIA from https://www.nia.or.th/. The page shows `mahidol-th-en-400.png`, a 400px-wide resize of the untouched official `mahidol-th-en.png` (2x the size it is shown at); regenerate it from the original if the logo changes. The header seal (root and `v2/`, 44px, 36px on mobile) is `mahidol-seal-160.webp`, a 160px WebP of the untouched official `mahidol-seal.png` from https://mahidol.ac.th/documents/CI/update/Mahidol/1.png (regenerate with `ffmpeg -i assets/logos/mahidol-seal.png -vf scale=160:-1:flags=lanczos -c:v libwebp -quality 92 -pix_fmt yuva420p assets/logos/mahidol-seal-160.webp`). The Harvard T.H. Chan logo (header and partners) was taken from the hsph.harvard.edu page header, because official downloads need a HarvardKey. Harvard marks need approval (trademark.harvard.edu), so confirm the Collaborative Hub agreement covers this use and replace the file with one HSIL supplies. Sponsor logos are still `.logo-slot` placeholders.
- The fonts are Kanit for all Thai and body text, Mona Sans for the hero display type, and IBM Plex Mono for digits and dates only (never set Thai in mono), all from Google Fonts. There are no decorative icons; the only icon is the hamburger/close in `.nav-toggle`. Don't use emoji. Chrome's Thai word breaker splits some compounds badly (ปัญญาประดิษฐ์, รายบุคคล …), so those are wrapped in `.nowrap`.
- The site is bilingual. `index.html` is Thai (`<html lang="th">`) and `en/index.html` is English (`<html lang="en">`, assets via `../`). Both are full static pages, so make every copy change in both. The status-bar TH/EN toggle and the footer ไทย/English links point at each other, and both pages declare `hreflang` alternates. `js/main.js` reads `<html lang>` and takes its runtime strings (CTA labels, days-left line, pathway status) from `STRINGS`. In English, use Gregorian dates only (`16–17 April 2027`), drop the Thai-only `.nowrap` wrappers, and mark any Thai text `lang="th"`.

## Running

Open `index.html` directly, or serve the folder:

```
python3 -m http.server 8000
```

To edit styles:

```
npm install
npm run watch   # recompiles css/styles.css whenever an scss/ file changes
npm run build   # one-off compile of the root page and v2/ before committing
```
