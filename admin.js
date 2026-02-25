const STORAGE_KEY = 'portfolioContent';

const galleryList = document.querySelector('[data-gallery-list]');
const timelineList = document.querySelector('[data-timeline-list]');
const friendList = document.querySelector('[data-friend-list]');
const statusLine = document.querySelector('[data-status]');
const workFields = {
  notice: document.querySelector('[data-work-field="notice"]'),
  active: document.querySelector('[data-work-field="active"]'),
  reserved: document.querySelector('[data-work-field="reserved"]')
};

const actions = {
  save: document.querySelector('[data-action="save"]'),
  export: document.querySelector('[data-action="export"]'),
  reset: document.querySelector('[data-action="reset"]'),
  addGallery: document.querySelector('[data-action="add-gallery"]'),
  addTimeline: document.querySelector('[data-action="add-timeline"]'),
  addFriend: document.querySelector('[data-action="add-friend"]'),
  runThumbs: document.querySelector('[data-action="run-thumbs"]')
};

const defaultGalleryItem = {
  id: '',
  category: '홈페이지',
  title: '',
  thumb: '',
  meta: '',
  created: '',
  updated: '',
  link: '',
  description: [],
  hashtags: [],
  images: []
};

const defaultTimelineItem = { date: '', event: '' };
const defaultFriendItem = { name: '', url: '', banner: '' };
const defaultWork = { notice: '', active: [], reserved: [] };

let content = {
  gallery: [],
  timeline: [],
  friends: [],
  work: { ...defaultWork }
};

function setStatus(text) {
  if (statusLine) statusLine.textContent = text;
}

function readLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function loadContent() {
  const local = readLocal();
  if (local) {
    content = local;
    if (!content.work) content.work = { ...defaultWork };
    setStatus('로컬 데이터 로드됨');
    return;
  }
  try {
    const res = await fetch('data/content.json');
    if (!res.ok) throw new Error('fetch failed');
    content = await res.json();
    if (!content.work) content.work = { ...defaultWork };
    setStatus('기본 데이터 로드됨');
  } catch {
    setStatus('데이터 로드 실패');
  }
}

function createField(labelText, fieldName, value, type = 'input') {
  const label = document.createElement('label');
  label.textContent = labelText;
  const field = type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
  if (type === 'select') {
    return label;
  }
  field.value = value || '';
  field.setAttribute('data-field', fieldName);
  label.appendChild(field);
  return label;
}

function parseHashtagsText(raw) {
  if (!raw) return [];
  return raw
    .split(/\r?\n|,/)
    .flatMap((chunk) => chunk.split(/\s+/))
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.replace(/^#+/, ''))
    .filter(Boolean);
}

function renderGallery() {
  if (!galleryList) return;
  galleryList.innerHTML = '';

  content.gallery.forEach((item, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'admin-item';
    wrap.setAttribute('data-index', String(index));

    const header = document.createElement('header');
    const title = document.createElement('div');
    title.className = 'admin-item-title';
    title.textContent = item.title || `갤러리 ${index + 1}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'admin-remove';
    remove.textContent = '삭제';
    remove.addEventListener('click', () => {
      content.gallery.splice(index, 1);
      renderGallery();
    });
    header.appendChild(title);
    header.appendChild(remove);

    const grid = document.createElement('div');
    grid.className = 'admin-grid';

    grid.appendChild(createField('id', 'id', item.id));
    grid.appendChild(createField('카테고리', 'category', item.category));
    grid.appendChild(createField('타이틀', 'title', item.title));
    grid.appendChild(createField('메타', 'meta', item.meta));
    grid.appendChild(createField('제작일', 'created', item.created));
    grid.appendChild(createField('최종 수정일', 'updated', item.updated));
    grid.appendChild(createField('링크', 'link', item.link));

    const desc = createField('설명 (줄바꿈)', 'description', (item.description || []).join('\n'), 'textarea');
    const tags = createField('해시태그 (줄바꿈/공백)', 'hashtags', (item.hashtags || []).join('\n'), 'textarea');

    wrap.appendChild(header);
    wrap.appendChild(grid);
    wrap.appendChild(desc);
    wrap.appendChild(tags);
    galleryList.appendChild(wrap);
  });
}

function renderTimeline() {
  if (!timelineList) return;
  timelineList.innerHTML = '';

  content.timeline.forEach((item, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'admin-item';
    wrap.setAttribute('data-index', String(index));

    const header = document.createElement('header');
    const title = document.createElement('div');
    title.className = 'admin-item-title';
    title.textContent = item.event || `타임라인 ${index + 1}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'admin-remove';
    remove.textContent = '삭제';
    remove.addEventListener('click', () => {
      content.timeline.splice(index, 1);
      renderTimeline();
    });
    header.appendChild(title);
    header.appendChild(remove);

    const grid = document.createElement('div');
    grid.className = 'admin-grid';
    grid.appendChild(createField('날짜', 'date', item.date));
    grid.appendChild(createField('내용', 'event', item.event));

    wrap.appendChild(header);
    wrap.appendChild(grid);
    timelineList.appendChild(wrap);
  });
}

function renderFriends() {
  if (!friendList) return;
  friendList.innerHTML = '';

  content.friends.forEach((item, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'admin-item';
    wrap.setAttribute('data-index', String(index));

    const header = document.createElement('header');
    const title = document.createElement('div');
    title.className = 'admin-item-title';
    title.textContent = item.name || `친구 ${index + 1}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'admin-remove';
    remove.textContent = '삭제';
    remove.addEventListener('click', () => {
      content.friends.splice(index, 1);
      renderFriends();
    });
    header.appendChild(title);
    header.appendChild(remove);

    const grid = document.createElement('div');
    grid.className = 'admin-grid';
    grid.appendChild(createField('이름', 'name', item.name));
    grid.appendChild(createField('링크', 'url', item.url));

    wrap.appendChild(header);
    wrap.appendChild(grid);
    friendList.appendChild(wrap);
  });
}

function renderWorkAdmin() {
  if (!workFields.notice || !workFields.active || !workFields.reserved) return;
  const work = content.work || { ...defaultWork };
  workFields.notice.value = work.notice || '';
  workFields.active.value = Array.isArray(work.active) ? work.active.join('\n') : '';
  workFields.reserved.value = Array.isArray(work.reserved) ? work.reserved.join('\n') : '';
}

function readGalleryInputs(oldList) {
  return [...galleryList.querySelectorAll('.admin-item')].map((item) => {
    const read = (name) => item.querySelector(`[data-field="${name}"]`)?.value.trim() || '';
    const descriptionRaw = read('description');
    const hashtagsRaw = read('hashtags');
    const index = Number(item.getAttribute('data-index') || '0');
    const old = oldList[index] || {};
    return {
      id: read('id'),
      category: read('category'),
      title: read('title'),
      thumb: old.thumb || '',
      meta: read('meta'),
      created: read('created'),
      updated: read('updated'),
      link: read('link'),
      description: descriptionRaw ? descriptionRaw.split('\n').filter(Boolean) : [],
      hashtags: hashtagsRaw ? parseHashtagsText(hashtagsRaw) : Array.isArray(old.hashtags) ? old.hashtags : [],
      images: Array.isArray(old.images) ? old.images : []
    };
  });
}

function readTimelineInputs() {
  return [...timelineList.querySelectorAll('.admin-item')].map((item) => {
    const read = (name) => item.querySelector(`[data-field="${name}"]`)?.value.trim() || '';
    return { date: read('date'), event: read('event') };
  });
}

function readFriendInputs(oldList) {
  return [...friendList.querySelectorAll('.admin-item')].map((item) => {
    const read = (name) => item.querySelector(`[data-field="${name}"]`)?.value.trim() || '';
    const index = Number(item.getAttribute('data-index') || '0');
    const old = oldList[index] || {};
    return { name: read('name'), url: read('url'), banner: old.banner || '' };
  });
}

function readWorkInputs() {
  if (!workFields.notice || !workFields.active || !workFields.reserved) {
    return { ...defaultWork };
  }
  const notice = workFields.notice?.value.trim() || '';
  const active = workFields.active?.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const reserved = workFields.reserved?.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return { notice, active, reserved };
}

function updateContentFromInputs() {
  const oldGallery = content.gallery;
  const oldFriends = content.friends;
  content.gallery = readGalleryInputs(oldGallery);
  content.timeline = readTimelineInputs();
  content.friends = readFriendInputs(oldFriends);
  content.work = readWorkInputs();
}

function saveLocal() {
  updateContentFromInputs();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content, null, 2));
  setStatus('로컬 저장 완료');
}

function exportJson() {
  updateContentFromInputs();
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'content.json';
  link.click();
  URL.revokeObjectURL(url);
  setStatus('JSON 내보내기 완료');
}

function resetLocal() {
  localStorage.removeItem(STORAGE_KEY);
  loadContent().then(() => {
    renderAll();
    setStatus('로컬 데이터 초기화');
  });
}

function renderAll() {
  renderGallery();
  renderTimeline();
  renderWorkAdmin();
  renderFriends();
}

function readThumbOptions() {
  const read = (name) => document.querySelector(`[data-thumb-field="${name}"]`);
  const inputDir = read('inputDir')?.value.trim() || 'gallery';
  const width = Number(read('width')?.value) || 700;
  const quality = Number(read('quality')?.value) || 88;
  const format = read('format')?.value || 'webp';
  const name = read('name')?.value.trim() || 'thums';
  const pick = read('pick')?.value || 'first';
  const recursive = Boolean(read('recursive')?.checked);
  const overwrite = Boolean(read('overwrite')?.checked);
  return { inputDir, width, quality, format, name, pick, recursive, overwrite };
}

async function runThumbs() {
  const options = readThumbOptions();
  setStatus('썸네일 생성 중...');
  try {
    const res = await fetch('/admin/thumbs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(`실패: ${data.error || 'unknown error'}`);
      return;
    }
    setStatus(data.message || '완료');
  } catch (error) {
    setStatus(`실패: ${error.message}`);
  }
}

actions.save?.addEventListener('click', saveLocal);
actions.export?.addEventListener('click', exportJson);
actions.reset?.addEventListener('click', resetLocal);
actions.addGallery?.addEventListener('click', () => {
  content.gallery.push({ ...defaultGalleryItem });
  renderGallery();
});
actions.addTimeline?.addEventListener('click', () => {
  content.timeline.push({ ...defaultTimelineItem });
  renderTimeline();
});
actions.addFriend?.addEventListener('click', () => {
  content.friends.push({ ...defaultFriendItem });
  renderFriends();
});
actions.runThumbs?.addEventListener('click', runThumbs);

loadContent().then(renderAll);
