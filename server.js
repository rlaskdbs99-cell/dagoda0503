const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { spawn } = require('child_process');

const root = process.cwd();
const port = 5173;
const SERVICE_KEY = 'd23cbd40d31221df16b94635b47a730d8468f69c95dd8f7b84eea3581d749259';
let localTotalCount = 0;
const localGuestEntries = [];
const guestbookLimits = { name: 24, message: 500, max: 200 };
const localTodayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date()).replaceAll('-', '');
const localDailyCounts = { [localTodayKey]: 0 };

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/admin/thumbs') && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      let payload = {};
      try {
        payload = JSON.parse(body || '{}');
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      const inputDir = String(payload.inputDir || 'gallery');
      const resolved = path.resolve(root, inputDir);
      if (!resolved.startsWith(root)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid path' }));
        return;
      }

      const args = [
        path.join(root, 'scripts', 'make_thumbs.py'),
        resolved,
        '--width', String(payload.width || 700),
        '--quality', String(payload.quality || 88),
        '--name', String(payload.name || 'thums'),
        '--format', String(payload.format || 'webp'),
        '--pick', String(payload.pick || 'first')
      ];
      if (payload.recursive) args.push('--recursive');
      if (payload.overwrite) args.push('--overwrite');

      const tryRun = (command) =>
        new Promise((resolve) => {
          const proc = spawn(command, args, { cwd: root });
          let output = '';
          let error = '';

          proc.stdout.on('data', (chunk) => {
            output += chunk.toString();
          });
          proc.stderr.on('data', (chunk) => {
            error += chunk.toString();
          });
          proc.on('error', (err) => {
            resolve({ ok: false, error: err });
          });
          proc.on('close', (code) => {
            resolve({ ok: code === 0, code, output, error });
          });
        });

      (async () => {
        let result = await tryRun('python');
        if (!result.ok) {
          result = await tryRun('py');
        }

        if (!result.ok) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(
            JSON.stringify({
              error: '썸네일 생성 실패. python이 설치되어 있는지 확인하세요.',
              detail: result.error?.message || result.error || result.output || result.error
            })
          );
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: result.output.trim() || '완료' }));
      })();
    });
    return;
  }

  if (req.url.startsWith('/counter')) {
    const todayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date()).replaceAll('-', '');

    if (!localDailyCounts[todayKey]) {
      localDailyCounts[todayKey] = 0;
    }

    if (req.method === 'POST') {
      localTotalCount += 1;
      localDailyCounts[todayKey] += 1;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ today: localDailyCounts[todayKey], total: localTotalCount }));
    return;
  }

  if (req.url.startsWith('/guestbook')) {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ entries: localGuestEntries }));
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      let payload = {};
      try {
        payload = JSON.parse(body || '{}');
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      const name = String(payload.name || 'guest').trim().slice(0, guestbookLimits.name) || 'guest';
      const message = String(payload.message || '').trim().slice(0, guestbookLimits.message);
      if (!message) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Message required' }));
        return;
      }

      const date = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date()).replaceAll('-', '.');

      localGuestEntries.unshift({ name, message, date });
      if (localGuestEntries.length > guestbookLimits.max) {
        localGuestEntries.length = guestbookLimits.max;
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ entries: localGuestEntries }));
    });
    return;
  }

  if (req.url.startsWith('/weather')) {
    const reqUrl = new URL(req.url, `http://localhost:${port}`);
    const params = reqUrl.searchParams;
    params.set('serviceKey', SERVICE_KEY);

    const upstream = new URL('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst');
    upstream.search = params.toString();

    https
      .get(upstream, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => {
          data += chunk;
        });
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode || 200, {
            'Content-Type': 'application/json; charset=utf-8'
          });
          res.end(data);
        });
      })
      .on('error', () => {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'weather proxy failed' }));
      });
    return;
  }

  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(root, decodeURIComponent(urlPath));

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
