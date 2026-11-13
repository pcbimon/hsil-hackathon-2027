// Mahidol x Harvard HSIL Hackathon — Thailand Hub landing page

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
  ? { href: APPLY_URL || '#', label: 'สมัครเข้าร่วม Hackathon', short: 'สมัครเลย', note: 'เปิดรับสมัครแล้ว ถึงกลาง ก.พ. 2570' }
  : { href: CALENDAR_URL, label: 'เพิ่มวันแข่งลงปฏิทิน', short: 'บันทึกวันแข่ง', note: 'เปิดรับสมัคร ธ.ค. 2569 – กลาง ก.พ. 2570' };

function daysUntil(targetMs, nowMs) {
  return Math.max(0, Math.ceil((targetMs - nowMs) / MS_PER_DAY));
}

function applyCta(cta) {
  // data-cta="label|short" links get href + text; data-cta-note elements get the note text
  document.querySelectorAll('[data-cta]').forEach((el) => {
    el.href = cta.href;
    el.textContent = cta[el.dataset.cta];
  });
  document.querySelectorAll('[data-cta-note]').forEach((el) => {
    el.textContent = cta.note;
  });
}

function renderCountdown() {
  const el = document.querySelector('[data-days-left]');
  if (el) el.textContent = `${daysUntil(HACKATHON_START_UTC, Date.now())} วัน`;
}

const COUNT_UP_MS = 1200;

function bangkokEndOfDay(isoDate) {
  return Date.parse(`${isoDate}T23:59:59+07:00`);
}

// Badge the first pathway step that hasn't ended: "ตอนนี้" once it has started, otherwise "ถัดไป".
// A step starts when the previous one ends; the first step carries its own data-start.
function markCurrentStep(nowMs) {
  const steps = [...document.querySelectorAll('.step[data-end]')];
  const i = steps.findIndex((el) => bangkokEndOfDay(el.dataset.end) >= nowMs);
  if (i < 0) return;
  const current = steps[i];
  const startMs = i > 0 ? bangkokEndOfDay(steps[i - 1].dataset.end) : Date.parse(`${current.dataset.start}T00:00:00+07:00`);
  const badge = document.createElement('span');
  badge.className = 'step__now';
  badge.textContent = startMs <= nowMs ? 'ตอนนี้' : 'ถัดไป';
  current.classList.add('step--now');
  current.prepend(badge);
}

function countUp(el) {
  const target = Number(el.dataset.count);
  const start = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - start) / COUNT_UP_MS);
    el.textContent = Math.round(target * (1 - (1 - p) ** 3)).toLocaleString('en-US');
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Without JS, IntersectionObserver, or with reduced motion, numbers keep their final HTML value.
function setupCountUps() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e) => {
      io.unobserve(e.target);
      countUp(e.target);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => {
    el.textContent = '0';
    io.observe(el);
  });
}

applyCta(CTA);
renderCountdown();
markCurrentStep(Date.now());
setupCountUps();
