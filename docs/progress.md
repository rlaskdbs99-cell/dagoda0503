# Portfolio Blog Progress (2026-02-25) – Update

## Today Summary (What Was Done)
- Git 설치 인식 확인 완료: `git version 2.53.0.windows.1`
- 프로젝트 폴더 Git 초기화 완료 (`git init`)
- Git 작성자 정보 설정 완료
  - `user.name`: `yoonna`
  - `user.email`: GitHub noreply 이메일 사용
- GitHub 저장소 연결 및 첫 업로드 완료
  - repo: `https://github.com/rlaskdbs99-cell/dagoda0503`
  - branch: `master`
- Weather / calendar / gallery / notice / footer 등 기존 작업 GitHub 반영 완료

## Git / GitHub Progress
- 초기 커밋 완료: `Initial portfolio site setup`
- 추가 커밋 완료:
  - `Fix weather low temp fallback`
  - `Add visitor counter with Pages KV binding`
  - `Fix canvas grid alignment`
- `dubious ownership` 에러 발생 → 사용자 PowerShell에서 `safe.directory` 등록으로 해결
- 이 작업 환경(Codex sandbox)에서는 `git push` 인증 창을 띄울 수 없어, 실제 push는 사용자 PowerShell에서 진행 필요

## Cloudflare Pages Progress
- 핵심 정리: `Workers`가 아니라 `Pages + Connect to Git (GitHub)`로 생성해야 함
- `functions/weather.js` 사용 구조로 Pages Functions 준비됨
- `WEATHER_KEY`는 Cloudflare Pages 변수/시크릿으로 등록 필요
- 사용자 쪽에서 `Pages`로 새 프로젝트 생성 완료
- 이슈:
  - 일부 배포 시도에서 `Failed: unable to submit build job` 발생 (Cloudflare 빌드 작업 제출 실패)
  - 이 에러는 코드 문법보다 Cloudflare 큐/연결 문제 가능성이 큼

## Weather Updates
- 날씨 UI 3줄 표시 유지 (상태 / 최고 / 최저)
- `PTY=0`일 때 `없음` 대신 `SKY` 기반 날씨명 표시
- 강풍(>= 14m/s) 표시 로직 유지
- 최저/최고(`TMN`,`TMX`) 값이 특정 시점에 비는 문제 대응:
  - 같은 날짜에 값이 없으면 가장 가까운 날짜의 예보값으로 fallback

## Visitor Counter (Real Counter for Pages)
- 실제 방문자 수 표시용 endpoint 추가: `functions/counter.js`
  - `/counter` `POST`: today/total 증가 후 반환
  - `/counter` `GET`: 현재 today/total 조회
- 홈 화면 표시 연결:
  - `index.html`의 `today / total` 텍스트를 동적 표시 대상으로 변경
  - `script.js`에서 `/counter` 호출 후 UI 갱신
- 로컬 테스트용 `/counter` 추가 (`server.js`)
  - 메모리 기반 카운터 (서버 재시작 시 초기화)
- Cloudflare에서 추가로 필요한 것:
  - KV Namespace 생성
  - Pages 바인딩 추가 (`VISIT_COUNTER`)

## Mobile UI Refinements (Today)
- 홈 화면 모바일 레이아웃 개선 (간격/탭/모달/갤러리/타임라인)
- 모바일 프로필 영역 조정:
  - 프로필 사진 축소
  - 이름 + SNS 옆 배치
  - SNS 앞 작은 아이콘 제거 (전체 화면 공통)
- 홈 제외 페이지(`notice`, `gallery`, `work`, `guest`) 모바일 처리:
  - 프로필 패널 숨김
  - 단일 컬럼 레이아웃 강제 (`.layout.layout--single`)
  - 왼쪽으로 붙고 오른쪽 여백이 크게 남던 문제 수정
- 홈 화면 모바일 레이아웃은 유지 (추가 수정하지 않음)

## Security Note (Important)
- 로컬 개발용 `server.js`에 기상청 API 키가 하드코딩된 상태였고 GitHub에 올라간 이력이 있음
- 권장 조치:
  1) 기상청/공공데이터 API 키 재발급(또는 기존 키 폐기/교체)
  2) Cloudflare `WEATHER_KEY`를 새 키로 교체
  3) 로컬 `server.js` 키도 교체 또는 `.env` 방식으로 전환

## Current Files (Mainly Touched Today)
- `styles.css` (모바일 레이아웃 다듬기 / 서브페이지 단일 컬럼 수정 / SNS 아이콘 제거)
- `script.js` (날씨 최저 fallback, 방문자수 fetch)
- `index.html` (방문자수 표시 연결)
- `server.js` (로컬 `/counter` 테스트용 추가)
- `functions/counter.js` (Pages KV 기반 방문자 카운터)

## Local Run (Test)
```powershell
cd "C:\Users\FAMILY\Desktop\포트폴리오"
node server.js
```
Open:
- `http://localhost:5173`
- `http://localhost:5173/notice.html`
- `http://localhost:5173/gallery.html`
- `http://localhost:5173/work.html`
- `http://localhost:5173/guest.html`

## Current Pending Work (as of this note)
- 로컬 미커밋 변경이 있을 수 있으므로 업로드 전 `git status` 확인 필요
- Cloudflare Pages 빌드 제출 실패(`unable to submit build job`) 재시도 필요
- Pages 바인딩 설정 필요:
  - `WEATHER_KEY` (secret/variable)
  - `VISIT_COUNTER` (KV binding)

## Recommended Next Steps
1) 현재 로컬 변경 커밋 + push
2) Cloudflare Pages 자동 배포 재확인
3) `VISIT_COUNTER` 바인딩 연결 후 방문자수 동작 확인
4) 기상청 API 키 교체(보안)
