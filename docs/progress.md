# Portfolio Blog Progress (2026-02-25) – Update

## Recent Updates
- Weather display now split into 3 rows: weather text, high, low.
- Weather label shown as `weather` above the box (left-aligned).
- Calendar now auto-renders current month and highlights today via JS.
- Weather proxy:
  - Local dev uses `server.js` with `/weather` proxy (CORS workaround).
  - Cloudflare Pages Functions prepared at `functions/weather.js` for production.
- Strong wind display added (>= 14 m/s) using KMA 기준.
- Home gallery: category tabs filter previews; cards open modal detail views.
- Gallery page: all categories open modal detail views.
- Notice page: old entries removed; new message from `docs/공지사항.md`.
- Home notice text: “홈페이지 공사중!”
- Timeline now only one entry (02.24 포트폴리오 홈 정리 시작).
- Logo text changed to `PORTFOLIO`.
- Footer: copyright line added `© 2026 yoonna. All rights reserved.`
- Mobile tweaks added (page padding, tabs wrap, gallery grid columns).

## Deployment (Cloudflare Pages + Functions)
- Functions file created: `functions/weather.js` (uses `WEATHER_KEY` secret).
- Steps to deploy (A 방식):
  1) Push repo to GitHub
  2) Connect repo to Cloudflare Pages
  3) Add secret `WEATHER_KEY`
  4) Deploy

## Git Status
- Git is NOT recognized yet after install attempt.
- Need to close/reopen PowerShell after installing Git.
- Then run: `git --version` to confirm.

## Current Issue Notes
- User reported weather showing "없음" → fixed to show SKY when PTY=0.
- HTML corruption with backslashes fixed.

## Files Modified Recently
- `index.html`
- `notice.html`
- `gallery.html`
- `guest.html`
- `work.html`
- `styles.css`
- `script.js`
- `server.js`
- `functions/weather.js`
- `docs/공지사항.md`

## How to Run Locally
```powershell
cd "C:\Users\FAMILY\Desktop\포트폴리오"
node server.js
```
Open: `http://localhost:5173`

## Next Step Needed
- Confirm Git install via new PowerShell: `git --version`.
- Then proceed to GitHub push & Cloudflare Pages deploy.
