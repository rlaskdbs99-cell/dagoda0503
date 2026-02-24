const tabs = document.querySelectorAll('.tab');

if (tabs.length) {
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
    });
  });
}

const guestForm = document.querySelector('.guest-form');
const guestName = document.querySelector('#guest-name');
const guestMsg = document.querySelector('#guest-msg');
const guestList = document.querySelector('.guest-list');
const guestBtn = document.querySelector('.guest-btn');
const storageKey = 'guestbookEntries';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function loadDefaultEntries() {
  if (!guestList) return [];
  const items = [...guestList.querySelectorAll('.guest-item')];
  return items.map((item) => {
    const meta = item.querySelector('.guest-meta')?.textContent || '';
    const body = item.querySelector('.guest-body')?.textContent || '';
    const [name, date] = meta.split('·').map((v) => v.trim());
    return {
      name: name || 'guest',
      date: date || formatDate(new Date()),
      message: body
    };
  });
}

function getEntries() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return loadDefaultEntries();
}

function saveEntries(entries) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

function renderEntries(entries) {
  if (!guestList) return;
  guestList.innerHTML = '';

  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'guest-empty';
    empty.textContent = '아직 방명록이 없어요.';
    guestList.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'guest-item';

    const meta = document.createElement('div');
    meta.className = 'guest-meta';
    meta.textContent = `${entry.name} · ${entry.date}`;

    const body = document.createElement('div');
    body.className = 'guest-body';
    body.textContent = entry.message;

    item.appendChild(meta);
    item.appendChild(body);
    guestList.appendChild(item);
  });
}

function handleSubmit() {
  if (!guestName || !guestMsg) return;
  const name = guestName.value.trim() || 'guest';
  const message = guestMsg.value.trim();
  if (!message) return;

  const entries = getEntries();
  entries.unshift({
    name,
    message,
    date: formatDate(new Date())
  });
  saveEntries(entries);
  renderEntries(entries);
  guestName.value = '';
  guestMsg.value = '';
}

if (guestForm) {
  const entries = getEntries();
  renderEntries(entries);

  guestForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit();
  });
}

if (guestBtn) {
  guestBtn.addEventListener('click', handleSubmit);
}

const weatherText = document.querySelector('.weather-text');
const weatherHigh = document.querySelector('.weather-high');
const weatherLow = document.querySelector('.weather-low');

const calendars = document.querySelectorAll('.mini-calendar');
const galleryTabs = document.querySelectorAll('[data-gallery-tabs]');

const WEATHER_CONFIG = {
  NX: 60,
  NY: 127
};

function formatKstDate(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}${map.month}${map.day}`;
}

function formatKstHour(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    hour12: false
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return Number(map.hour);
}

function getBaseCandidates() {
  const now = new Date();
  const baseTimes = [23, 20, 17, 14, 11, 8, 5, 2];
  const nowHour = formatKstHour(now);
  const today = formatKstDate(now);
  const yesterday = formatKstDate(new Date(now.getTime() - 86400000));

  const todayCandidates = baseTimes
    .filter((h) => h <= nowHour)
    .map((h) => ({ baseDate: today, baseTime: `${String(h).padStart(2, '0')}00` }));

  if (todayCandidates.length) return todayCandidates;

  return baseTimes.map((h) => ({
    baseDate: yesterday,
    baseTime: `${String(h).padStart(2, '0')}00`
  }));
}

function mapWeatherCode({ pty, sky, wind }) {
  const ptyMap = {
    1: '비',
    2: '비/눈',
    3: '눈',
    4: '소나기'
  };

  if (pty !== undefined && pty !== 0 && ptyMap[pty]) {
    return ptyMap[pty];
  }

  if (wind !== undefined && wind >= 14) {
    return '강풍';
  }

  const skyMap = {
    1: '맑음',
    3: '구름많음',
    4: '흐림'
  };

  return skyMap[sky] || '날씨';
}

function pickClosestForecast(items, category, targetDate, targetTime) {
  const candidates = items.filter((item) => item.category === category && item.fcstDate === targetDate);
  if (!candidates.length) return null;

  if (!targetTime) return candidates[0];

  let best = candidates[0];
  let bestGap = Math.abs(Number(best.fcstTime) - Number(targetTime));

  candidates.forEach((item) => {
    const gap = Math.abs(Number(item.fcstTime) - Number(targetTime));
    if (gap < bestGap) {
      best = item;
      bestGap = gap;
    }
  });

  return best;
}

async function fetchWeather() {
  if (!weatherText || !weatherHigh || !weatherLow) return;

  const candidates = getBaseCandidates();
  const now = new Date();
  const targetDate = formatKstDate(now);
  const targetTime = `${String(formatKstHour(now)).padStart(2, '0')}00`;

  for (const candidate of candidates) {
    const params = new URLSearchParams({
      dataType: 'JSON',
      numOfRows: '1000',
      pageNo: '1',
      base_date: candidate.baseDate,
      base_time: candidate.baseTime,
      nx: String(WEATHER_CONFIG.NX),
      ny: String(WEATHER_CONFIG.NY)
    });

    try {
      const res = await fetch(`/weather?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      const items = data?.response?.body?.items?.item || [];
      if (!items.length) continue;

      const tmx = pickClosestForecast(items, 'TMX', targetDate);
      const tmn = pickClosestForecast(items, 'TMN', targetDate);
      const pty = pickClosestForecast(items, 'PTY', targetDate, targetTime);
      const sky = pickClosestForecast(items, 'SKY', targetDate, targetTime);
      const wsd = pickClosestForecast(items, 'WSD', targetDate, targetTime);

      const weatherLabel = mapWeatherCode({
        pty: pty ? Number(pty.fcstValue) : undefined,
        sky: sky ? Number(sky.fcstValue) : undefined,
        wind: wsd ? Number(wsd.fcstValue) : undefined
      });

      const tmxValue = tmx ? `${Math.round(Number(tmx.fcstValue))}°` : '--°';
      const tmnValue = tmn ? `${Math.round(Number(tmn.fcstValue))}°` : '--°';

      weatherText.textContent = weatherLabel;
      weatherHigh.textContent = tmxValue;
      weatherLow.textContent = tmnValue;
      return;
    } catch (error) {
      console.warn('weather fetch failed', error);
    }
  }
}

fetchWeather();

function formatKstParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

function renderCalendar() {
  if (!calendars.length) return;
  const now = new Date();
  const parts = formatKstParts(now);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const today = Number(parts.day);

  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const firstKst = new Date(firstDay.getTime() + 9 * 60 * 60 * 1000);
  const startWeekday = firstKst.getUTCDay(); // 0=Sun

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [];
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  weekDays.forEach((d) => {
    cells.push(`<span>${d}</span>`);
  });

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(`<span class="muted">${i + 1 - startWeekday}</span>`);
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    const cls = d === today ? 'is-today' : '';
    cells.push(`<span class="${cls}">${d}</span>`);
  }

  calendars.forEach((calendar) => {
    const header = calendar.querySelector('.cal-header');
    const grid = calendar.querySelector('.cal-grid');
    if (header) header.textContent = `${year}.${String(month).padStart(2, '0')}`;
    if (grid) grid.innerHTML = cells.join('');
  });
}

renderCalendar();

function setupGalleryTabs() {
  if (!galleryTabs.length) return;

  galleryTabs.forEach((tabs) => {
    const buttons = tabs.querySelectorAll('.cat[data-cat]');
    const grid = tabs.parentElement?.querySelector('[data-gallery-grid]');
    const cards = grid ? grid.querySelectorAll('.card[data-category]') : [];

    if (!buttons.length || !cards.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-cat');
        buttons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        cards.forEach((card) => {
          const category = card.getAttribute('data-category');
          card.classList.toggle('is-hidden', category !== target);
        });
      });
    });

    const active = tabs.querySelector('.cat.is-active') || buttons[0];
    if (active) active.click();
  });
}

setupGalleryTabs();

const modalButtons = document.querySelectorAll('[data-detail]');
const modals = document.querySelectorAll('.modal');

function closeModals() {
  modals.forEach((modal) => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  });
}

modalButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-detail');
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  });
});

modals.forEach((modal) => {
  modal.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('[data-close]')) {
      closeModals();
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModals();
  }
});
