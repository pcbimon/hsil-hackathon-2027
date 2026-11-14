// Mahidol x Harvard HSIL Hackathon — Thailand Hub landing page ("ศูนย์ประเทศไทย: the artwork, carried through the page")
// Progressive enhancement only: every section is readable without this file.

// Flip REGISTRATION_OPEN to true and set APPLY_URL when applications open (Dec 2026).
const REGISTRATION_OPEN = false;
const APPLY_URL = '';

// 16 Apr 2027, 08:00 Bangkok (UTC+7)
const HACKATHON_START_UTC = Date.UTC(2027, 3, 16, 1, 0, 0);
const MS_PER_DAY = 86400000;

// Closed state: every CTA reads "Coming Soon" and is plain text, not a link (index.html holds the same
// markup as the no-JS fallback, so nothing is rewritten). Open state: the CTAs become links to APPLY_URL.
const CTA = REGISTRATION_OPEN
  ? { href: APPLY_URL || '#', label: 'สมัครเข้าร่วมการแข่งขัน', short: 'สมัคร', note: 'เปิดรับสมัครแล้ว', status: 'เปิดรับสมัครแล้ว' }
  : null;

function applyCta(cta) {
  document.documentElement.classList.toggle('is-registration-open', REGISTRATION_OPEN);
  if (!cta) return;
  // data-cta="label|short" become links with Thai labels; data-cta-note / data-reg-status get the status text
  document.querySelectorAll('[data-cta]').forEach((el) => {
    el.href = cta.href;
    el.removeAttribute('lang');
    el.textContent = cta[el.dataset.cta];
  });
  document.querySelectorAll('[data-cta-note]').forEach((el) => { el.textContent = cta.note; });
  document.querySelectorAll('[data-reg-status]').forEach((el) => { el.textContent = cta.status; });
}

// ---- Days left: one quiet line under the facts strip, days only (no ticking). Hidden without JS ----
function setupDaysLeft() {
  const el = document.querySelector('[data-days-left]');
  if (!el) return;
  const remaining = HACKATHON_START_UTC - Date.now();
  if (remaining <= 0) return; // after the start the facts strip already says everything
  const days = Math.ceil(remaining / MS_PER_DAY);
  const num = document.createElement('span');
  num.className = 'mono';
  num.textContent = days.toLocaleString('en-US');
  el.replaceChildren('อีก ', num, ' วันถึงวันแข่งขัน');
  el.hidden = false;
}

// ---- Pathway: badge the first stage that hasn't ended ----
const bangkokEndOfDay = (isoDate) => Date.parse(`${isoDate}T23:59:59+07:00`);

// Same rule as the main site: "ช่วงปัจจุบัน" once it has started, otherwise "ลำดับถัดไป".
// A stage starts when the previous one ends; the first stage carries its own data-start.
function markCurrentStep(nowMs) {
  const rows = [...document.querySelectorAll('.route__row[data-end]')];
  const i = rows.findIndex((el) => bangkokEndOfDay(el.dataset.end) >= nowMs);
  rows.forEach((el, j) => { if (i < 0 || j < i) el.classList.add('is-past'); });
  if (i < 0) return;
  const current = rows[i];
  const startMs = i > 0 ? bangkokEndOfDay(rows[i - 1].dataset.end) : Date.parse(`${current.dataset.start}T00:00:00+07:00`);
  const started = startMs <= nowMs;
  current.classList.add('is-now');
  if (started) current.setAttribute('aria-current', 'step');
  const status = current.querySelector('.route__status');
  if (status) {
    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = 'สถานะ: ';
    status.append(label, started ? 'ช่วงปัจจุบัน' : 'ลำดับถัดไป');
  }
}

// ---- Count-ups: without JS, IntersectionObserver, or with reduced motion, numbers keep their HTML value ----
const COUNT_UP_MS = 1200;

function countUp(el, target) {
  const start = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - start) / COUNT_UP_MS);
    el.textContent = Math.round(target * (1 - (1 - p) ** 3)).toLocaleString('en-US');
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function setupCountUps() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e) => {
      io.unobserve(e.target);
      countUp(e.target.querySelector('[data-count-visual]'), Number(e.target.dataset.count));
    });
  }, { threshold: 0.6 });
  // The real figure stays in the DOM for screen readers; only an aria-hidden copy animates from 0.
  document.querySelectorAll('[data-count]').forEach((el) => {
    const real = document.createElement('span');
    real.className = 'sr-only';
    real.textContent = el.textContent;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.dataset.countVisual = '';
    visual.textContent = '0';
    el.replaceChildren(real, visual);
    io.observe(el);
  });
}

// ---- Nav: collapses only once JS runs, so the no-JS page keeps the full nav ----
function setupNavToggle() {
  const header = document.querySelector('.site-header');
  const toggle = header && header.querySelector('.nav-toggle');
  if (!toggle) return;
  const setOpen = (open) => {
    header.classList.toggle('is-nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  header.classList.add('has-nav-toggle');
  setOpen(false);
  toggle.addEventListener('click', () => setOpen(!header.classList.contains('is-nav-open')));
  header.querySelectorAll('.main-nav a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('is-nav-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

// ---- Mobile CTA bar: tucked away while the hero CTA is on screen. Without JS it simply stays visible ----
function setupMobileBar() {
  const bar = document.querySelector('.m-bar');
  const heroCta = document.querySelector('[data-hero-cta]');
  if (!bar || !heroCta || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    bar.classList.toggle('is-tucked', entry.isIntersecting);
  }).observe(heroCta);
}

applyCta(CTA);
setupNavToggle();
setupMobileBar();
setupDaysLeft();
markCurrentStep(Date.now());
setupCountUps();
