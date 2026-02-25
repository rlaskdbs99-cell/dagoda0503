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
const storageKey = 'guestbookEntries';
const guestbookEndpoint = '/guestbook';
const workBoards = document.querySelectorAll('[data-work-board]');
const workNoticeTargets = document.querySelectorAll('[data-work-notice]');
const contactForm = document.querySelector('[data-contact-form]');
const contactHelp = document.querySelector('[data-contact-help]');
const FONT_SCALE_KEY = 'portfolioUiScale';
const FONT_SCALE_DEFAULT = 1;
const FONT_SCALE_MIN = 0.9;
const FONT_SCALE_MAX = 1.15;
const FONT_SCALE_STEP = 0.05;
const WORK_DEFAULTS = { activeSlots: 3, reservedSlots: 5, emptyLabel: '비어 있음' };

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

function clampFontScale(value) {
  const next = Number(value);
  if (!Number.isFinite(next)) return FONT_SCALE_DEFAULT;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, next));
}

function roundFontScale(value) {
  return Math.round(clampFontScale(value) / FONT_SCALE_STEP) * FONT_SCALE_STEP;
}

function applyFontScale(value) {
  const scale = roundFontScale(value);
  const page = document.querySelector('.page');
  if (page) page.style.zoom = String(scale);

  document.querySelectorAll('[data-font-scale-value]').forEach((el) => {
    el.textContent = `${Math.round(scale * 100)}%`;
  });
  document.querySelectorAll('[data-font-scale-range]').forEach((el) => {
    if (el instanceof HTMLInputElement) el.value = String(Math.round(scale * 100));
  });
  return scale;
}

function loadFontScale() {
  const raw = localStorage.getItem(FONT_SCALE_KEY);
  if (!raw) return FONT_SCALE_DEFAULT;
  return roundFontScale(Number(raw));
}

function saveFontScale(value) {
  localStorage.setItem(FONT_SCALE_KEY, String(roundFontScale(value)));
}

function setupFontScaleWidget() {
  const moodBoxes = document.querySelectorAll('.mood-box');
  if (!moodBoxes.length) return;

  const initialScale = applyFontScale(loadFontScale());

  moodBoxes.forEach((moodBox) => {
    if (moodBox.nextElementSibling?.classList?.contains('font-scale-box')) return;

    const widget = document.createElement('div');
    widget.className = 'font-scale-box';
    widget.setAttribute('data-font-scale-widget', 'true');
    widget.innerHTML = `
      <div class="font-scale-head">
        <span class="font-scale-title">text size</span>
        <span class="font-scale-value" data-font-scale-value>${Math.round(initialScale * 100)}%</span>
      </div>
      <div class="font-scale-controls">
        <button type="button" class="font-scale-btn" data-font-scale-action="down" aria-label="글자 크기 줄이기">A-</button>
        <input
          class="font-scale-range"
          data-font-scale-range
          type="range"
          min="${Math.round(FONT_SCALE_MIN * 100)}"
          max="${Math.round(FONT_SCALE_MAX * 100)}"
          step="${Math.round(FONT_SCALE_STEP * 100)}"
          value="${Math.round(initialScale * 100)}"
          aria-label="글자 크기 조절"
        />
        <button type="button" class="font-scale-btn" data-font-scale-action="up" aria-label="글자 크기 키우기">A+</button>
        <button type="button" class="font-scale-btn is-reset" data-font-scale-action="reset" aria-label="글자 크기 기본값">기본</button>
      </div>
    `;

    const changeScale = (next) => {
      const scale = applyFontScale(next);
      saveFontScale(scale);
    };

    widget.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.getAttribute('data-font-scale-action');
      if (!action) return;
      const current = loadFontScale();
      if (action === 'down') changeScale(current - FONT_SCALE_STEP);
      if (action === 'up') changeScale(current + FONT_SCALE_STEP);
      if (action === 'reset') changeScale(FONT_SCALE_DEFAULT);
    });

    const range = widget.querySelector('[data-font-scale-range]');
    if (range instanceof HTMLInputElement) {
      range.addEventListener('input', () => {
        changeScale(Number(range.value) / 100);
      });
    }

    moodBox.insertAdjacentElement('afterend', widget);
  });
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((entry) => entry && typeof entry.message === 'string')
    .map((entry) => ({
      name: String(entry.name || 'guest').slice(0, 24),
      message: String(entry.message || '').slice(0, 500),
      date: String(entry.date || formatDate(new Date()))
    }));
}

async function fetchGuestbookEntries() {
  if (!guestList) return [];
  try {
    const res = await fetch(guestbookEndpoint, { method: 'GET' });
    if (!res.ok) throw new Error('guestbook fetch failed');
    const data = await res.json();
    const entries = normalizeEntries(data.entries || data);
    if (entries.length) {
      saveEntries(entries);
    }
    return entries;
  } catch {
    return normalizeEntries(getEntries());
  }
}

async function submitGuestbookEntry(name, message) {
  try {
    const res = await fetch(guestbookEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message })
    });
    if (!res.ok) throw new Error('guestbook submit failed');
    const data = await res.json();
    const entries = normalizeEntries(data.entries || data);
    if (entries.length) {
      saveEntries(entries);
    }
    return entries;
  } catch {
    const entries = normalizeEntries(getEntries());
    entries.unshift({
      name,
      message,
      date: formatDate(new Date())
    });
    saveEntries(entries);
    return entries;
  }
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

async function handleSubmit() {
  if (!guestName || !guestMsg) return;
  const name = guestName.value.trim() || 'guest';
  const message = guestMsg.value.trim();
  if (!message) return;

  const entries = await submitGuestbookEntry(name, message);
  renderEntries(entries);
  guestName.value = '';
  guestMsg.value = '';
}

if (guestForm) {
  fetchGuestbookEntries().then(renderEntries);

  guestForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit();
  });
}

function setContactHelp(message, tone = '') {
  if (!contactHelp) return;
  contactHelp.textContent = message;
  contactHelp.classList.remove('is-error', 'is-success');
  if (tone) contactHelp.classList.add(tone);
}

function setupContactForm() {
  if (!contactForm) return;

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) {
      setContactHelp('필수 항목을 먼저 확인해 주세요.', 'is-error');
      return;
    }

    const formData = new FormData(contactForm);
    const name = String(formData.get('name') || '').trim();
    const contact = String(formData.get('contact') || '').trim();
    const type = String(formData.get('type') || '').trim();
    const reference = String(formData.get('reference') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const agreed = formData.get('agree') === 'on';

    if (!name || !contact || !type || !message || !agreed) {
      setContactHelp('필수 항목을 모두 입력하고 동의 체크를 해 주세요.', 'is-error');
      return;
    }

    const subject = `[Portfolio 문의] ${type} / ${name}`;
    const bodyLines = [
      '안녕하세요, work 페이지 문의폼으로 보냅니다.',
      '',
      `이름/닉네임: ${name}`,
      `연락처: ${contact}`,
      `문의 종류: ${type}`,
      `참고 링크: ${reference || '(없음)'}`,
      '',
      '[문의 내용]',
      message,
      '',
      '---',
      '상세 작업 안내는 notice 페이지를 확인했습니다.'
    ];
    const body = bodyLines.join('\n');
    const mailto =
      `mailto:dagoda0503@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setContactHelp('메일 앱을 엽니다. 열리지 않으면 notice 안내 확인 후 직접 메일로 보내 주세요.', 'is-success');
    window.location.href = mailto;
  });
}

setupContactForm();
setupFontScaleWidget();


const weatherText = document.querySelector('.weather-text');
const weatherHigh = document.querySelector('.weather-high');
const weatherLow = document.querySelector('.weather-low');
const visitTodayTargets = document.querySelectorAll('[data-visit-today]');
const visitTotalTargets = document.querySelectorAll('[data-visit-total]');
const noticeList = document.querySelector('[data-notice-list]');

const calendars = document.querySelectorAll('.mini-calendar');
const galleryTabs = document.querySelectorAll('[data-gallery-tabs]');
const CONTENT_STORAGE_KEY = 'portfolioContent';

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

function pickNearestDateForecast(items, category, targetDate) {
  const candidates = items.filter((item) => item.category === category);
  if (!candidates.length) return null;

  const exact = candidates.find((item) => item.fcstDate === targetDate);
  if (exact) return exact;

  let best = candidates[0];
  let bestGap = Math.abs(Number(best.fcstDate) - Number(targetDate));

  candidates.forEach((item) => {
    const gap = Math.abs(Number(item.fcstDate) - Number(targetDate));
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

      const tmx = pickNearestDateForecast(items, 'TMX', targetDate);
      const tmn = pickNearestDateForecast(items, 'TMN', targetDate);
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

function formatVisitCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return num.toLocaleString('ko-KR');
}

function renderVisitCounts(today, total) {
  const todayText = `today ${formatVisitCount(today)}`;
  const totalText = `total ${formatVisitCount(total)}`;

  visitTodayTargets.forEach((el) => {
    el.textContent = todayText;
  });

  visitTotalTargets.forEach((el) => {
    el.textContent = totalText;
  });
}

async function fetchVisitCounts() {
  if (!visitTodayTargets.length || !visitTotalTargets.length) return;

  try {
    const res = await fetch('/counter', { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    renderVisitCounts(data.today, data.total);
  } catch (error) {
    console.warn('visit counter fetch failed', error);
  }
}

fetchVisitCounts();

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

function readLocalContent() {
  const raw = localStorage.getItem(CONTENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchContentFile() {
  try {
    const res = await fetch('data/content.json');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function buildThumbStyle(path) {
  if (!path) return '';
  return `background-image: url('${path.replace(/'/g, '%27')}');`;
}

function buildMetaLine(item) {
  const parts = [];
  if (item.meta) parts.push(item.meta);
  if (item.created) parts.push(`제작 ${item.created}`);
  if (item.updated) parts.push(`최종 수정 ${item.updated}`);
  return parts.join(' · ');
}

function renderHomeGallery(items) {
  const grid = document.querySelector('[data-gallery-grid]');
  if (!grid) return;
  grid.innerHTML = items
    .map((item) => {
      const style = buildThumbStyle(item.thumb);
      const styleAttr = style ? ` style="${style}"` : '';
      return `
        <button class="card card-button" type="button" data-category="${item.category}" data-detail="${item.id}">
          <div class="thumb"${styleAttr}></div>
          <div class="card-title">${item.title}</div>
        </button>
      `;
    })
    .join('');
}

function renderGallerySections(items) {
  const sections = document.querySelectorAll('[data-gallery-section]');
  if (!sections.length) return;

  sections.forEach((section) => {
    const category = section.getAttribute('data-gallery-section');
    const grid = section.querySelector('[data-gallery-grid]');
    if (!grid || !category) return;
    const filtered = items.filter((item) => item.category === category);
    grid.innerHTML = filtered
      .map((item) => {
        const style = buildThumbStyle(item.thumb);
        const styleAttr = style ? ` style="${style}"` : '';
        return `
          <button class="card card-button" type="button" data-detail="${item.id}">
            <div class="thumb"${styleAttr}></div>
            <div class="card-title">${item.title}</div>
          </button>
        `;
      })
      .join('');
  });
}

function renderTimeline(items) {
  const list = document.querySelector('.timeline-list');
  if (!list) return;
  list.innerHTML = items
    .map(
      (entry) => `
        <li>
          <span class="time">${entry.date}</span>
          <span class="event">${entry.event}</span>
        </li>
      `
    )
    .join('');
}

function renderFriends(items) {
  const list = document.querySelector('.friend-list');
  if (!list) return;
  list.innerHTML = items
    .map((friend) => {
      const style = buildThumbStyle(friend.banner);
      const styleAttr = style ? ` style="${style}"` : '';
      const extraClass = friend.banner ? ' friend-item--image' : '';
      const url = friend.url || '#';
      return `<a class="friend-item${extraClass}" href="${url}" target="_blank" rel="noopener"${styleAttr}>${friend.name}</a>`;
    })
    .join('');
}

function renderNotices(items) {
  if (!noticeList) return;
  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    noticeList.innerHTML = '';
    noticeList.style.display = 'none';
    return;
  }
  noticeList.style.display = '';
  noticeList.innerHTML = list
    .map(
      (item) => `
        <div class="notice-item">
          ${item.date ? `<div class="notice-date">${item.date}</div>` : ''}
          <div class="notice-body">${item.body || ''}</div>
        </div>
      `
    )
    .join('');
}

function normalizeWorkList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => String(item || '').trim()).filter(Boolean);
}

function buildWorkSlots(list, count) {
  const items = list.slice(0, count);
  while (items.length < count) {
    items.push('');
  }
  return items;
}

function renderWorkSlots(target, list, count) {
  if (!target) return;
  const items = buildWorkSlots(list, count);
  target.innerHTML = items
    .map((item) => {
      const isFilled = Boolean(item);
      const label = item || WORK_DEFAULTS.emptyLabel;
      const cls = isFilled ? 'slot is-filled' : 'slot';
      return `<li class="${cls}">${label}</li>`;
    })
    .join('');
}

function renderWork(work) {
  if (!work) return;
  const active = normalizeWorkList(work.active);
  const reserved = normalizeWorkList(work.reserved);

  workNoticeTargets.forEach((el) => {
    if (work.notice) el.textContent = work.notice;
  });

  workBoards.forEach((board) => {
    const activeTarget = board.querySelector('[data-work-active]');
    const reservedTarget = board.querySelector('[data-work-reserved]');
    renderWorkSlots(activeTarget, active, WORK_DEFAULTS.activeSlots);
    renderWorkSlots(reservedTarget, reserved, WORK_DEFAULTS.reservedSlots);
  });
}

function normalizeHashtags(value) {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\s+/)
      : [];
  return list
    .map((tag) => String(tag || '').trim())
    .filter(Boolean)
    .map((tag) => tag.replace(/^#+/, ''))
    .filter(Boolean)
    .map((tag) => `#${tag}`);
}

function renderModals(items) {
  document.querySelectorAll('.modal').forEach((modal) => modal.remove());
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = item.id;
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('data-dynamic', 'true');

    const metaLine = buildMetaLine(item);
    const body = (item.description || []).map((line) => `<p>${line}</p>`).join('');
    const hashtags = normalizeHashtags(item.hashtags || item.tags || item.tag);
    const hashtagsMarkup = hashtags.length
      ? `<div class="post-tags" aria-label="해시태그">${hashtags
          .map((tag) => `<span class="post-tag">${tag}</span>`)
          .join('')}</div>`
      : '';
    const galleryImages = item.images?.length ? item.images : item.thumb ? [item.thumb] : [];
    const slides = [];
    for (let i = 0; i < galleryImages.length; i += 3) {
      const chunk = galleryImages.slice(i, i + 3);
      const thumbs = chunk
        .map(
          (img) =>
            `<button type="button" class="thumb thumb-button" data-full="${img.replace(/"/g, '&quot;')}" style="${buildThumbStyle(img)}"></button>`
        )
        .join('');
      slides.push(`<div class="modal-slide">${thumbs}</div>`);
    }
    const hasControls = slides.length > 1;
    const slider = `
      <div class="modal-slider" data-slider>
        <div class="modal-track" data-track>${slides.join('')}</div>
        ${hasControls ? '<button type="button" class="slider-btn prev" data-slide="prev" aria-label="이전">&lt;</button>' : ''}
        ${hasControls ? '<button type="button" class="slider-btn next" data-slide="next" aria-label="다음">&gt;</button>' : ''}
      </div>
    `;
    const linkMarkup = item.link
      ? `<a class="post-link" href="${item.link}" target="_blank" rel="noopener">사이트 열기</a>`
      : '';

    modal.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal-content" role="dialog" aria-modal="true" aria-label="${item.title} 상세">
        <button class="modal-close" type="button" data-close aria-label="닫기">×</button>
        <div class="post-detail">
          <div class="post-title">${item.title}</div>
          <div class="post-meta">${metaLine}</div>
          ${hashtagsMarkup}
          <div class="post-body">${body}</div>
          ${linkMarkup}
          ${slider}
        </div>
      </div>
    `;

    fragment.appendChild(modal);
  });

  document.body.appendChild(fragment);
}

async function loadContentAndRender() {
  const localData = readLocalContent();
  const fileData = await fetchContentFile();
  const data = localData || fileData;
  if (!data && !fileData) return;

  const merged = {
    gallery: Array.isArray(data?.gallery) && data.gallery.length ? data.gallery : fileData?.gallery || [],
    timeline: Array.isArray(data?.timeline) && data.timeline.length ? data.timeline : fileData?.timeline || [],
    friends: Array.isArray(data?.friends) && data.friends.length ? data.friends : fileData?.friends || [],
    work: data?.work || fileData?.work || null,
    notices: Array.isArray(data?.notices) && data.notices.length ? data.notices : fileData?.notices || []
  };

  renderHomeGallery(merged.gallery);
  renderGallerySections(merged.gallery);
  renderModals(merged.gallery);
  if (Array.isArray(merged.timeline)) renderTimeline(merged.timeline);
  if (Array.isArray(merged.friends)) renderFriends(merged.friends);
  if (Array.isArray(merged.notices)) renderNotices(merged.notices);
  renderWork(merged.work);
  setupGalleryTabs();
}

function setupGalleryTabs() {
  if (!galleryTabs.length) return;

  galleryTabs.forEach((tabs) => {
    const buttons = tabs.querySelectorAll('.cat[data-cat]');
    const grid = tabs.parentElement?.querySelector('[data-gallery-grid]');
    const cards = grid ? grid.querySelectorAll('.card[data-category]') : [];

    if (!buttons.length || !cards.length) return;

    buttons.forEach((btn) => {
      if (btn.dataset.tabBound) return;
      btn.dataset.tabBound = 'true';
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

function closeModals() {
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  });
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const openBtn = target.closest('[data-detail]');
  if (openBtn) {
    const id = openBtn.getAttribute('data-detail');
    const modal = id ? document.getElementById(id) : null;
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  if (target.closest('[data-close]')) {
    closeModals();
  }

  const slideBtn = target.closest('[data-slide]');
  if (slideBtn) {
    const slider = slideBtn.closest('[data-slider]');
    if (!slider) return;
    const track = slider.querySelector('[data-track]');
    if (!track) return;
    const slides = track.children.length || 1;
    const current = Number(slider.getAttribute('data-index') || '0');
    const dir = slideBtn.getAttribute('data-slide');
    const nextIndex = dir === 'next' ? (current + 1) % slides : (current - 1 + slides) % slides;
    slider.setAttribute('data-index', String(nextIndex));
    track.style.transform = `translateX(${-100 * nextIndex}%)`;
  }

  const thumbBtn = target.closest('.thumb-button');
  if (thumbBtn) {
    const full = thumbBtn.getAttribute('data-full');
    if (!full) return;
    const siblings = [...(thumbBtn.closest('.modal-slider')?.querySelectorAll('.thumb-button') || [])];
    const list = siblings.map((btn) => btn.getAttribute('data-full')).filter(Boolean);
    const index = Math.max(0, list.indexOf(full));
    openLightbox(full, list, index);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModals();
    closeLightbox();
  }
});

loadContentAndRender();

const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.setAttribute('aria-hidden', 'true');
lightbox.innerHTML = `
  <div class="lightbox-backdrop" data-lightbox-close></div>
  <div class="lightbox-content">
    <div class="lightbox-slider" data-lightbox-slider>
      <div class="lightbox-track" data-lightbox-track></div>
    </div>
    <button type="button" class="lightbox-nav prev" data-lightbox-slide="prev" aria-label="이전">&lt;</button>
    <button type="button" class="lightbox-nav next" data-lightbox-slide="next" aria-label="다음">&gt;</button>
    <button type="button" class="lightbox-close" data-lightbox-close aria-label="닫기">×</button>
  </div>
`;
document.body.appendChild(lightbox);

function openLightbox(src, list = [], index = 0) {
  const track = lightbox.querySelector('[data-lightbox-track]');
  if (!track) return;
  const items = list.length ? list : [src];
  track.innerHTML = items
    .map((item) => `<div class="lightbox-slide"><img src="${item}" alt="미리보기" /></div>`)
    .join('');
  lightbox.dataset.list = JSON.stringify(items);
  lightbox.dataset.index = String(index);
  track.style.transform = `translateX(${-100 * index}%)`;
  toggleLightboxNav(items.length > 1);
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
}

lightbox.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest('[data-lightbox-close]')) {
    closeLightbox();
  }
  const nav = target.closest('[data-lightbox-slide]');
  if (nav) {
    const dir = nav.getAttribute('data-lightbox-slide');
    moveLightbox(dir === 'next' ? 1 : -1);
  }
});

function toggleLightboxNav(show) {
  lightbox.querySelectorAll('.lightbox-nav').forEach((btn) => {
    btn.style.display = show ? 'inline-flex' : 'none';
  });
}

function moveLightbox(delta) {
  const list = JSON.parse(lightbox.dataset.list || '[]');
  if (!list.length) return;
  const current = Number(lightbox.dataset.index || '0');
  const nextIndex = (current + delta + list.length) % list.length;
  const track = lightbox.querySelector('[data-lightbox-track]');
  if (!track) return;
  track.style.transform = `translateX(${-100 * nextIndex}%)`;
  lightbox.dataset.index = String(nextIndex);
}
