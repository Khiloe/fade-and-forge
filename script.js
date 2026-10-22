/* ============================================================
   FADE & FORGE — Site Scripts
   Handles: mobile nav, scroll header, popup modal,
            booking wizard, calendar generation (Google + .ics)
   ============================================================ */

'use strict';

/* ============================================================
   1. CONFIGURATION — shop details used across booking/calendar
   ============================================================ */
const SHOP = {
  name: 'Fade & Forge',
  address: '142 Heritage Lane, Braamfontein, Johannesburg, 2001',
  phone: '+27 11 555 0142',
  email: 'hello@fadeandforge.co.za',
  timezone: 'Africa/Johannesburg',
  url: window.location.origin
};

/* ============================================================
   2. DATA — services & barbers (used by the booking wizard)
   ============================================================ */
const SERVICES = [
  { id: 'classic-cut',   name: 'Classic Haircut',       price: 220, duration: 30, category: 'Haircuts' },
  { id: 'skin-fade',     name: 'Skin Fade',             price: 260, duration: 45, category: 'Haircuts' },
  { id: 'kids-cut',      name: 'Kids Cut (under 12)',   price: 140, duration: 20, category: 'Haircuts' },
  { id: 'beard-trim',    name: 'Beard Trim & Shape',    price: 150, duration: 20, category: 'Beard & Shave' },
  { id: 'hot-towel',     name: 'Hot Towel Shave',       price: 200, duration: 30, category: 'Beard & Shave' },
  { id: 'cut-beard',     name: 'Cut + Beard Combo',     price: 350, duration: 60, category: 'Packages' },
  { id: 'full-works',    name: 'The Full Works',        price: 480, duration: 75, category: 'Packages' }
];

const BARBERS = [
  { id: 'marcus', name: 'Marcus "The Blade" Dlamini', role: 'Master Barber' },
  { id: 'sipho',  name: 'Sipho Ndlovu',               role: 'Senior Barber' },
  { id: 'aisha',  name: 'Aisha Patel',                role: 'Barber & Stylist' },
  { id: 'any',    name: 'No preference',              role: 'First available barber' }
];

/* ============================================================
   3. MOBILE NAVIGATION
   ============================================================ */
function initNav() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close nav when a link is clicked
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close nav on outside click
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') &&
        !nav.contains(e.target) &&
        !hamburger.contains(e.target)) {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================================
   4. SCROLL HEADER — shrink/add shadow on scroll
   ============================================================ */
function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => {
    if (window.scrollY > 30) header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
    else header.style.boxShadow = 'none';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================================
   5. POPUP MODAL — first-visit offer
   ============================================================ */
function initPopup() {
  const overlay = document.getElementById('promoModal');
  if (!overlay) return;

  const closeBtns = overlay.querySelectorAll('[data-close-modal]');
  const SEEN_KEY = 'ff_promo_seen';

  // Show once per session
  if (!sessionStorage.getItem(SEEN_KEY)) {
    setTimeout(() => {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      sessionStorage.setItem(SEEN_KEY, '1');
    }, 3500); // wait 3.5s so it doesn't feel aggressive
  }

  const close = () => {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  closeBtns.forEach(btn => btn.addEventListener('click', close));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
}

/* ============================================================
   6. BOOKING WIZARD
   ============================================================ */
const bookingState = {
  step: 1,
  service: null,
  barber: null,
  date: null,
  time: null,
  customer: { name: '', email: '', phone: '', notes: '' }
};

function initBooking() {
  const wizard = document.getElementById('bookingWizard');
  if (!wizard) return;

  renderServiceTiles();
  renderBarberTiles();
  setupDatePicker();
  setupFormNav();
  updateProgress();
}

/* --- Step 1: Services --- */
function renderServiceTiles() {
  const container = document.getElementById('serviceTiles');
  if (!container) return;

  // Group by category
  const categories = [...new Set(SERVICES.map(s => s.category))];
  container.innerHTML = categories.map(cat => `
    <div class="service-category" style="margin-bottom:1.5rem;">
      <h4 style="color:var(--copper);margin-bottom:0.75rem;font-family:var(--font-body);
                 font-size:0.85rem;text-transform:uppercase;letter-spacing:0.1em;">${cat}</h4>
      <div class="tile-grid">
        ${SERVICES.filter(s => s.category === cat).map(s => `
          <button type="button" class="tile" data-service-id="${s.id}">
            <h4>${s.name}</h4>
            <div class="tile-price">R${s.price}</div>
            <div class="tile-meta">${s.duration} min</div>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', () => {
      container.querySelectorAll('.tile').forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');
      bookingState.service = SERVICES.find(s => s.id === tile.dataset.serviceId);
      document.getElementById('nextToStep2').disabled = false;
    });
  });
}

/* --- Step 2: Barbers --- */
function renderBarberTiles() {
  const container = document.getElementById('barberTiles');
  if (!container) return;

  container.innerHTML = BARBERS.map(b => `
    <button type="button" class="tile" data-barber-id="${b.id}">
      <h4>${b.name}</h4>
      <div class="tile-meta">${b.role}</div>
    </button>
  `).join('');

  container.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', () => {
      container.querySelectorAll('.tile').forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');
      bookingState.barber = BARBERS.find(b => b.id === tile.dataset.barberId);
      document.getElementById('nextToStep3').disabled = false;
    });
  });
}

/* --- Step 3: Date & time --- */
function setupDatePicker() {
  const dateInput = document.getElementById('bookingDate');
  if (!dateInput) return;

  // Set min = today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;

  dateInput.addEventListener('change', () => {
    bookingState.date = dateInput.value;
    bookingState.time = null;
    renderTimeSlots(dateInput.value);
  });
}

function renderTimeSlots(dateStr) {
  const container = document.getElementById('timeSlots');
  if (!container || !dateStr) return;

  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay(); // 0 Sun, 6 Sat

  let slots = [];
  if (day === 0) {
    container.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;">We are closed on Sundays. Please choose another day.</p>';
    return;
  } else if (day === 6) {
    slots = generateSlots('08:00', '17:00', 30);
  } else {
    slots = generateSlots('09:00', '19:00', 30);
  }

  // Randomly disable a few slots to simulate real availability
  const seed = dateStr.split('-').join('');
  const disabled = slots.filter((_, i) => (parseInt(seed) + i) % 7 === 0);

  container.innerHTML = slots.map(t => {
    const isDisabled = disabled.includes(t);
    return `<button type="button" class="time-slot ${isDisabled ? 'disabled' : ''}"
              data-time="${t}" ${isDisabled ? 'disabled' : ''}>${t}</button>`;
  }).join('');

  container.querySelectorAll('.time-slot:not(.disabled)').forEach(slot => {
    slot.addEventListener('click', () => {
      container.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      bookingState.time = slot.dataset.time;
      document.getElementById('nextToStep4').disabled = false;
    });
  });
}

function generateSlots(start, end, intervalMin) {
  const slots = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur < endMin) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0');
    const m = String(cur % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    cur += intervalMin;
  }
  return slots;
}

/* --- Step 4: Customer details --- */
function setupFormNav() {
  const next1 = document.getElementById('nextToStep2');
  const next2 = document.getElementById('nextToStep3');
  const next3 = document.getElementById('nextToStep4');
  const back2 = document.getElementById('backToStep1');
  const back3 = document.getElementById('backToStep2');
  const back4 = document.getElementById('backToStep3');
  const confirm = document.getElementById('confirmBooking');

  if (next1) next1.addEventListener('click', () => goToStep(2));
  if (next2) next2.addEventListener('click', () => goToStep(3));
  if (next3) next3.addEventListener('click', () => goToStep(4));
  if (back2) back2.addEventListener('click', () => goToStep(1));
  if (back3) back3.addEventListener('click', () => goToStep(2));
  if (back4) back4.addEventListener('click', () => goToStep(3));
  if (confirm) confirm.addEventListener('click', handleConfirm);
}

function goToStep(n) {
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  const step = document.querySelector(`.form-step[data-step="${n}"]`);
  if (step) step.classList.add('active');
  bookingState.step = n;
  updateProgress();
  document.getElementById('bookingWizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateProgress() {
  document.querySelectorAll('.booking-progress .step').forEach((el, i) => {
    el.classList.toggle('active', i < bookingState.step);
  });
}

/* --- Confirm booking --- */
function handleConfirm() {
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const notes = document.getElementById('custNotes').value.trim();

  if (!name || !email || !phone) {
    alert('Please fill in your name, email and phone number.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  bookingState.customer = { name, email, phone, notes };

  renderConfirmation();
  goToStep(5);
}

/* --- Step 5: Confirmation + calendar --- */
function renderConfirmation() {
  const s = bookingState.service;
  const b = bookingState.barber;
  const c = bookingState.customer;
  const dateObj = new Date(bookingState.date + 'T' + bookingState.time + ':00');

  const nice = dateObj.toLocaleDateString('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const summary = document.getElementById('bookingSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="summary-row"><span>Service</span><span>${s.name}</span></div>
      <div class="summary-row"><span>Barber</span><span>${b.name}</span></div>
      <div class="summary-row"><span>Date</span><span>${nice}</span></div>
      <div class="summary-row"><span>Time</span><span>${bookingState.time}</span></div>
      <div class="summary-row"><span>Duration</span><span>${s.duration} minutes</span></div>
      <div class="summary-row"><span>Total</span><span>R${s.price}</span></div>
      <div class="summary-row"><span>Name</span><span>${c.name}</span></div>
      <div class="summary-row"><span>Contact</span><span>${c.email}</span></div>
    `;
  }

  // Wire up calendar buttons with the actual booking
  const gcalBtn = document.getElementById('addToGoogle');
  const icsBtn = document.getElementById('addToApple');

  if (gcalBtn) gcalBtn.onclick = () => addToGoogleCalendar();
  if (icsBtn)  icsBtn.onclick  = () => downloadICS();
}

/* ============================================================
   7. CALENDAR INTEGRATION
   ============================================================ */

/* --- Build event start/end Date objects --- */
function getEventDates() {
  const s = bookingState.service;
  const start = new Date(bookingState.date + 'T' + bookingState.time + ':00');
  const end = new Date(start.getTime() + s.duration * 60 * 1000);
  return { start, end };
}

/* --- Format Date as YYYYMMDDTHHMMSS (floating local time) --- */
function fmtLocal(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

/* --- Format Date as UTC YYYYMMDDTHHMMSSZ (for .ics) --- */
function fmtUTC(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/* --- Build the event title & description --- */
function getEventContent() {
  const s = bookingState.service;
  const b = bookingState.barber;
  const c = bookingState.customer;

  const title = `${s.name} at ${SHOP.name}`;
  const description =
    `Appointment: ${s.name} with ${b.name}\n` +
    `Duration: ${s.duration} minutes\n` +
    `Price: R${s.price}\n` +
    `Booked for: ${c.name}\n` +
    `Contact: ${c.email} | ${c.phone}\n` +
    (c.notes ? `Notes: ${c.notes}\n` : '') +
    `\nPlease arrive 5 minutes early. To reschedule, call ${SHOP.phone}.`;

  return { title, description };
}

/* --- Google Calendar link --- */
function addToGoogleCalendar() {
  const { start, end } = getEventDates();
  const { title, description } = getEventContent();

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmtLocal(start)}/${fmtLocal(end)}`,
    details: description,
    location: SHOP.address,
    ctz: SHOP.timezone
  });

  const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
  window.open(url, '_blank', 'noopener');
}

/* --- Apple / Outlook / any-calendar .ics download --- */
function downloadICS() {
  const { start, end } = getEventDates();
  const { title, description } = getEventContent();

  // Escape newlines and commas for ICS format
  const esc = (str) => str
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

  const uid = `ff-${Date.now()}@fadeandforge.co.za`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fade & Forge//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmtUTC(new Date())}`,
    `DTSTART;TZID=${SHOP.timezone}:${fmtLocal(start)}`,
    `DTEND;TZID=${SHOP.timezone}:${fmtLocal(end)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(SHOP.address)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fade-and-forge-${bookingState.date}-${bookingState.time.replace(':','')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ============================================================
   8. HIGHLIGHT TODAY IN HOURS TABLE
   ============================================================ */
function highlightToday() {
  const rows = document.querySelectorAll('.hours-table tr[data-day]');
  if (!rows.length) return;
  const today = new Date().getDay(); // 0 Sun .. 6 Sat
  rows.forEach(row => {
    if (parseInt(row.dataset.day) === today) row.classList.add('today');
  });
}

/* ============================================================
   9. SET ACTIVE NAV LINK
   ============================================================ */
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
}

/* ============================================================
   10. FOOTER YEAR
   ============================================================ */
function setFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   11. BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollHeader();
  initPopup();
  initBooking();
  highlightToday();
  setActiveNav();
  setFooterYear();
});