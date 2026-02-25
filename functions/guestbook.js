const MAX_ENTRIES = 200;
const NAME_MAX = 24;
const MESSAGE_MAX = 500;
const STORAGE_KEY = 'entries';

function formatKstDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}.${map.month}.${map.day}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function normalizeEntry(entry) {
  const name = String(entry.name || 'guest').trim().slice(0, NAME_MAX) || 'guest';
  const message = String(entry.message || '').trim().slice(0, MESSAGE_MAX);
  if (!message) return null;
  return {
    name,
    message,
    date: formatKstDate()
  };
}

async function readEntries(kv) {
  const data = await kv.get(STORAGE_KEY, { type: 'json' });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.entries)) return data.entries;
  return [];
}

async function writeEntries(kv, entries) {
  await kv.put(STORAGE_KEY, JSON.stringify(entries));
}

export async function onRequest({ request, env }) {
  const kv = env.GUESTBOOK;
  if (!kv) {
    return json({ error: 'Missing GUESTBOOK binding' }, 500);
  }

  if (request.method === 'GET') {
    const entries = await readEntries(kv);
    return json({ entries });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const entry = normalizeEntry(payload);
  if (!entry) {
    return json({ error: 'Message required' }, 400);
  }

  const entries = await readEntries(kv);
  entries.unshift(entry);
  const trimmed = entries.slice(0, MAX_ENTRIES);
  await writeEntries(kv, trimmed);

  return json({ entries: trimmed });
}
