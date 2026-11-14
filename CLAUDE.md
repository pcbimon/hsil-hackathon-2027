# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static landing page for the **Mahidol x Harvard HSIL Hackathon 2027 — Official Thailand Hub** (Mahidol University hosting Harvard T.H. Chan's Health Systems Innovation Lab hackathon). The copy is in Thai. There's no framework and no runtime dependencies. The only dev dependency is Sass, and the compiled CSS is committed, so the site runs without a build step.

It was ported from the Claude Design canvas at https://claude.ai/artifact/BaNRDTtWKQRhPy5mDTynjh (artboard `project/Main.dc.html`). That canvas is the design source of truth. If the design changes there, port the change here.

## Files

- `index.html`: all content and markup. Every section is static HTML, so the page works without JS.
- `scss/`: the stylesheet source. Edit these files, never `css/styles.css`. `npm run build` compiles `scss/main.scss` to `css/styles.css`, and the compiled file is committed so the site still runs without a build step. Always rebuild and commit both together.
  - `abstracts/`: the breakpoint variables and the `tablet-down` / `mobile` mixins. This folder emits no CSS.
  - `base/`: `_tokens.scss` (the `:root` custom properties) and `_base.scss` (reset, body, links).
  - `layout/`: container, header and nav, footer, and the sticky mobile bar `.m-bar`.
  - `components/`: reusable pieces (eyebrow, section-head, placeholder/todo, buttons).
  - `sections/`: one partial per page section, in page order (hero, partners, benefits, about, pathway, archive, faq, notify).
  - `main.scss` sets the cascade order: tokens, then base, layout, components, sections. A new partial goes into the matching folder and gets a `@use` line in `main.scss`.
  - Tokens stay CSS custom properties, not Sass variables, because they change at runtime (`--gutter` on mobile, `--step-*` per variant). Primitive scales (`--green-*`, `--teal-*`, `--red-*`, `--gray-*`) hold the raw hex values. Semantic aliases (`--ink`, `--green`, `--mint`, `--deep`, `--crimson`, …) point at them, and components use those. Put no raw hex outside `base/_tokens.scss`.
  - Components use BEM-style classes written with `&__element` / `&--modifier` nesting. Keep nesting to one or two levels. Put each media query inside the rule it changes (`@include mobile { … }`), not in a separate responsive file.
- Hero: follows the client artwork `assets/aw/Harvard Hackathon 2027_ComingSoon.jpg`. The background is `assets/hero-bg.webp`, a 2400px copy of `assets/aw/Harvard Hackathon 2027_BG.jpg` (regenerate with `ffmpeg -i "assets/aw/Harvard Hackathon 2027_BG.jpg" -vf scale=2400:-1 -q:v 78 assets/hero-bg.webp`). The original artwork in `assets/aw/` is kept out of git because the files are large. The title and theme line use Hubot Sans, the artwork's font. Everything else stays in Kanit.
- `js/main.js`: progressive enhancement only. It fills the countdown (`[data-days-left]`), swaps the CTA state, collapses the nav behind `.nav-toggle`, badges the current pathway step and runs count-ups.

## v2 (alternative design, for comparison)

`v2/` is a second, self-contained design of the same page ("Official programme, Bangkok → Boston"): light paper ground, typography-led, no icons, a fact-sheet panel with a countdown, numbered sections, and the pathway as a route table. It is served at `/v2/` and exists so the client can compare it with the root page. It has its own `v2/index.html`, `v2/scss/` → `v2/css/styles.css` (`npm run build:v2` / `watch:v2`; `npm run build` compiles both) and `v2/js/main.js`, and shares `../assets/`. The same content rules apply. Differences from the root page: display type is Mona Sans (plain zero and I, as in the client artwork), Latin/numeric labels are IBM Plex Mono (never set Thai in mono), and `data-mock` content is visibly marked with a dotted crimson underline. Keep facts in the two pages in sync when copy changes.

## Responsive

The page has to work at every width from 360px to 1440px+, not just at the breakpoints.

- There are two breakpoints. `max-width: 1023px` (tablet and below) collapses the nav behind `.nav-toggle`. `max-width: 720px` (mobile) shrinks the gutter to 16px and shows the sticky CTA bar `.m-bar`. Don't add a breakpoint for one component when fluid sizing can do the job.
- Size display text with `clamp(min, vw, max)` so it scales smoothly. A fixed px size that jumps at a breakpoint overflows the widths in between. For example, the hero's "Hackathon 2027" is about 9.5em wide, so it uses `clamp(32px, 9vw, 100px)`.
- Text that never wraps (`white-space: nowrap`, the hero title) must fit the narrowest viewport. `.hero` has `overflow: hidden`, so anything that overflows gets clipped without showing a scrollbar. Checking `scrollWidth` won't catch it.
- Before calling a layout change done, check it at 390, 768, 1024 and 1440. For each width, confirm that no element's bounding box goes past the viewport edge and that the header stays on a single row. Then take a screenshot of the hero and any section you changed.
- Grids should wrap without leaving a lone orphan card on the last row if that can be avoided. Tap targets are at least `var(--tap)` tall.

## Registration CTA switch

The CTA has two states, set by `REGISTRATION_OPEN` / `APPLY_URL` at the top of `js/main.js`:
- **Closed** (default): buttons link to an "add to Google Calendar" link for 16–17 Apr 2027 (the link says `20270416/20270418` because Google's end date is exclusive).
- **Open**: buttons link to `APPLY_URL` with the "สมัคร" labels.

JS rewrites any element with `data-cta="label"` or `data-cta="short"` (href and text) and any element with `data-cta-note` (text). The HTML holds the closed-state text as the no-JS fallback. Keep the two in sync when you edit copy.

## Content conventions

- Text in `[square brackets]` is a placeholder awaiting real content: logos, team names, photos, contact details, counts. Unconfirmed facts also carry the `.todo` class, which renders them in crimson. Never invent values for them.
- Brand: the Thailand Hub leads and Harvard HSIL appears as the global partner. The palette is teal/mint plus Harvard crimson as the accent (`--crimson` for text on light backgrounds, `--crimson-bright` on dark ones). This intentionally differs from the original canvas.
- Dates use the Thai Buddhist year with the Gregorian year in parentheses, e.g. `2570 (2027)`.
- Logos in `assets/logos/` are official, unedited files: Mahidol from https://mahidol.ac.th/th/logo-corporate-identity/ and NIA from https://www.nia.or.th/. The page shows `mahidol-th-en-400.png`, a 400px-wide resize of the untouched official `mahidol-th-en.png` (2x the size it is shown at); regenerate it from the original if the logo changes. The Harvard T.H. Chan logo (partners strip) was taken from the hsph.harvard.edu page header, because official downloads need a HarvardKey. Harvard marks need approval (trademark.harvard.edu), so confirm the Collaborative Hub agreement covers this use and replace the file with one HSIL supplies. The square "HSIL" box in the header is still a placeholder. Sponsor logos are still gray `.logo-slot` placeholders.
- The fonts are Kanit, plus Hubot Sans for the hero title (both from Google Fonts), and the icons are inline stroke SVGs. Don't use emoji.
- The TH/EN toggle and the footer language links are visual only. There's no English version yet.

## Running

Open `index.html` directly, or serve the folder:

```
python3 -m http.server 8000
```

To edit styles:

```
npm install
npm run watch   # recompiles css/styles.css whenever an scss/ file changes
npm run build   # one-off compile before committing
```
