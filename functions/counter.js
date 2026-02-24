function getKstDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}${map.month}${map.day}`;
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

async function readNumber(kv, key) {
  const value = await kv.get(key);
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export async function onRequest({ request, env }) {
  const kv = env.VISIT_COUNTER;
  if (!kv) {
    return json({ error: 'Missing VISIT_COUNTER binding' }, 500);
  }

  const todayKey = `today:${getKstDateKey()}`;
  const totalKey = 'total';

  if (request.method === 'GET') {
    const [today, total] = await Promise.all([
      readNumber(kv, todayKey),
      readNumber(kv, totalKey)
    ]);
    return json({ today, total });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const [today, total] = await Promise.all([
    readNumber(kv, todayKey),
    readNumber(kv, totalKey)
  ]);

  const nextToday = today + 1;
  const nextTotal = total + 1;

  await Promise.all([
    kv.put(todayKey, String(nextToday)),
    kv.put(totalKey, String(nextTotal))
  ]);

  return json({ today: nextToday, total: nextTotal });
}
