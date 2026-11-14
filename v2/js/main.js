// Mahidol x Harvard HSIL Hackathon — Thailand Hub landing page, v2 ("Official programme")
// Progressive enhancement only: every section is readable without this file.

// Flip REGISTRATION_OPEN to true and set APPLY_URL when applications open (Dec 2026).
const REGISTRATION_OPEN = false;
const APPLY_URL = '';

// 16 Apr 2027, 08:00 Bangkok (UTC+7)
const HACKATHON_START_UTC = Date.UTC(2027, 3, 16, 1, 0, 0);
const MS_PER_DAY = 86400000;

const CALENDAR_URL =
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text=Mahidol%20x%20Harvard%20HSIL%20Hackathon%202027' +
  '&dates=20270416/20270418&location=Mahidol%20University%2C%20Bangkok';

const CTA = REGISTRATION_OPEN
  ? { href: APPLY_URL || '#', label: 'สมัครเข้าร่วม Hackathon', short: 'สมัครเลย', note: 'เปิดรับสมัครแล้ว ถึงกลาง ก.พ. 2570', status: 'เปิดรับสมัครแล้ว' }
  : { href: CALENDAR_URL, label: 'บันทึกวันแข่งลงปฏิทิน', short: 'บันทึกวันแข่ง', note: 'เปิดรับสมัคร ธ.ค. 2569 – กลาง ก.พ. 2570', status: 'ยังไม่เปิดรับสมัคร' };

function applyCta(cta) {
  // data-cta="label|short" links get href + text; data-cta-note elements get the note text
  document.querySelectorAll('[data-cta]').forEach((el) => {
    el.href = cta.href;
    el.textContent = cta[el.dataset.cta];
  });
  document.querySelectorAll('[data-cta-note]').forEach((el) => {
    el.textContent = cta.note;
  });
  // v2 only: the fact sheet's status row and the status dot follow the same switch
  document.querySelectorAll('[data-reg-status]').forEach((el) => {
    el.textContent = cta.status;
  });
  document.documentElement.classList.toggle('is-registration-open', REGISTRATION_OPEN);
}

// ---- Countdown: four tabular numerals, aria-hidden; screen readers get one static sentence ----
const pad = (n, len = 2) => String(n).padStart(len, '0');

function splitRemaining(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

function setupCountdown() {
  const box = document.querySelector('[data-countdown]');
  if (!box) return;
  const remaining = HACKATHON_START_UTC - Date.now();
  if (remaining <= 0) return; // after the start the no-JS date fallback is the right thing to show

  const grid = box.querySelector('.countdown__grid');
  const cells = {};
  grid.querySelectorAll('[data-unit]').forEach((el) => { cells[el.dataset.unit] = el; });
  const text = box.querySelector('[data-countdown-text]');
  if (text) text.textContent = `อีก ${Math.ceil(remaining / MS_PER_DAY)} วันถึงวันแข่ง 16–17 เม.ย. 2570`;

  const render = () => {
    const t = splitRemaining(HACKATHON_START_UTC - Date.now());
    cells.d.textContent = pad(t.d, 3);
    cells.h.textContent = pad(t.h);
    cells.m.textContent = pad(t.m);
    cells.s.textContent = pad(t.s);
  };
  // Reduced motion: no per-second ticking. Drop the seconds cell and refresh once a minute.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) cells.s.parentElement.hidden = true;
  render();
  grid.hidden = false;
  box.classList.add('is-live');
  setInterval(render, reduce ? 60000 : 1000);
}

// ---- Pathway: badge the first stage that hasn't ended ----
const bangkokEndOfDay = (isoDate) => Date.parse(`${isoDate}T23:59:59+07:00`);

// Same rule as the main site: "ตอนนี้" once it has started, otherwise "ถัดไป".
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
    status.append(label, started ? 'ตอนนี้' : 'ถัดไป');
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

// ---- Keyword strip: it only moves once JS can also offer a pause button (WCAG 2.2.2) ----
function setupTicker() {
  const ticker = document.querySelector('[data-ticker]');
  if (!ticker || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ticker__toggle';
  const setRunning = (running) => {
    ticker.classList.toggle('is-running', running);
    button.textContent = running ? 'หยุด' : 'เล่น';
    button.setAttribute('aria-label', running ? 'หยุดแถบข้อความเลื่อน' : 'เล่นแถบข้อความเลื่อน');
  };
  button.addEventListener('click', () => setRunning(!ticker.classList.contains('is-running')));
  ticker.append(button);
  setRunning(true);
}

applyCta(CTA);
setupNavToggle();
setupTicker();
setupMobileBar();
setupCountdown();
markCurrentStep(Date.now());
setupCountUps();
