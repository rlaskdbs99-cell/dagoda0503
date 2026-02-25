# Portfolio Blog Progress (2026-02-25) – Update


## Game Redesign (2026-02-25, Latest)

게임 페이지 전면 리디자인 완료. 자세한 내용은 [[game-redesign]] 참고.

### 변경 파일

- `game.html` — 완전 재작성 (사이트 톤 매칭 구조)
- `game.css` — 완전 재작성 (크림/그린 디자인, 다크 아케이드 테마 제거)
- `game.js` — 완전 재작성 (화면 전환만 가능 → 실제 플레이 가능한 완성형)
- `game-preview.html` — 디자인 프리뷰 (개발용, 배포 불필요)
- `docs/game-redesign.md` — 게임 기술 문서 (구조, 로직, CSS 맵 등)

### 백업 파일

- `game.html.bak`, `game.css.bak`, `game.js.bak` — 리디자인 전 원본

### 주요 변경 내용

- **디자인**: 다크 네온 아케이드 → 사이트 톤 매칭 (크림 배경, dashed 보더, 저채도 그린)
- **게임 로직**: 30초 타이머, 아이콘 클릭(+10), 놓침(-5), 콤보 보너스, 랭크 시스템(S/A/B/C/D)
- **UI 요소**: 스탯 바, 타이머 프로그레스(색상 변화), 실패 라인, 적중 이펙트, 점수 팝업, 콤보 태그
- **저장**: localStorage에 최고 점수 자동 저장 (`icondrop-best`)
- **시작 방법**: 상단 start 버튼 또는 대기 화면 PRESS START 클릭

### data 속성 요약

게임 DOM 조회는 `[data-game]` 루트 기준. 주요 속성:
- `data-btn="start|reset|retry|exit|ready-start"` — 버튼
- `data-stat="time|score|best"` — HUD 값
- `data-ov="ready|over"` — 오버레이 상태
- `data-stage` — 아이콘 낙하 영역
- `data-combo`, `data-miss-line`, `data-miss-label` — 게임 중 UI

---

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
- 게임 페이지 추가 + 레트로 미니게임 구성 (`game.html`, `game.css`, `game.js`)
  - ICON DROP: 아이콘 클릭 +10 / 바닥 도달 -5 / 30초 타이머
  - 최고 점수 로컬 저장
- 게임 탭 추가(모든 페이지 상단 nav에 `game` 탭 추가)
- 게임 화면 조정
  - 아이콘 깨짐 개선: `image-rendering: pixelated` 제거
  - 스테이지 높이/낙하 애니메이션 끝 위치 조정(잘림 완화)
  - 게임 패널 배경 그라데이션 제거 → 단색
  - `game` 라벨 위치 상단으로 올림 (`game.css`에서 top/padding 조정)
  - `game` 패널 라벨 잘림 수정: `overflow: visible` + 라벨 위치 재조정 (프로필 라벨 스타일과 유사하게 정리)
- 게임 페이지 동작 안정화/UX 개선
  - `ICON DROP` 로직 재정비: 시작/종료/리셋/타이머/최고점수(localStorage) 동작 안정화
  - 누락 아이콘 경로(`gallery/아이콘/1/4.png`) 제거 및 이미지 로드 실패 fallback 추가
  - 게임 상태 문구(`aria-live`) + 오버레이(`READY/GO/TIME UP`) 추가
  - 점수 피드백 표시 추가: 클릭 `+10`, 놓침 `-5` 플로팅 텍스트
  - 드롭 아이콘 박스 정렬 수정: `object-fit: contain`, `overflow: hidden`, 내부 패딩 적용
  - 낙하 애니메이션과 hover/active `transform` 충돌 제거(튀는 현상 완화)
  - 게임 설명 문구 수정: `올려봐` → `올려보세요`
  - 게임 스테이지와 `rules` 안내 박스 간격 확대
- 프로필 변경
  - 프로필 사진 `profile/profile.jpg` 적용
  - 이름 `dago 다고`로 변경
  - 이름 앞 빈 박스 제거(아이콘 슬롯 삭제)
  - 아이콘 위치: SNS 앞 → 이름 앞(`.name-chip::before`)
  - 프로필 그라데이션 오버레이 제거 (`.avatar::after` 제거)
- SNS 링크 연결
  - `Instagram`, `Grafolio` 라벨 클릭 시 바로 이동
  - 링크: `docs/SNS.md` 참고(인스타/그라폴리오)
- 관리자 페이지(로컬 전용) 구축
  - `admin.html`, `admin.css`, `admin.js`
  - 데이터 로딩: `data/content.json` → 로컬 저장은 `localStorage`
  - 이미지 경로 입력 제거(텍스트만 수정 가능)
- 데이터 구조 분리
  - `gallery/<카테고리>/<폴더>/` 구조에서 폴더별 프로젝트 분리
  - 썸네일은 `thum*` 파일 기준, 모달 이미지 첫 번째로 포함
  - `개인작/1`, `개인작/2` 각각 다른 프로젝트로 분리
  - `커미션/1`, `커미션/2` 각각 다른 프로젝트로 분리
- 썸네일 생성 자동화
  - `scripts/make_thumbs.py` (옵션: width/quality/format/recursive/overwrite/pick)
  - `docs/thumbnail-guide.md` 작성
- `data/content.json` 자동 갱신 스크립트
  - `scripts/update-content.js` 추가: 갤러리 폴더 스캔 후 JSON 갱신
  - 실행: `node scripts/update-content.js`
- 모달 개선
  - 모달 갤러리 3장씩 슬라이드 + 화살표
  - 이미지 클릭 시 확대(lightbox) + 슬라이드 이동 가능
  - 화살표는 `>` `<`, 닫기는 `×`
- 친구 배너 추가
  - 타임라인 아래 배너 추가 (친구 1인 1칸)
  - 배너 이미지 적용 가능 (있으면 overlay)

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
- 추가 미세조정
  - 모바일에서 `profile` 포함 패널 라벨(`.panel-title`)과 내부 박스가 너무 붙어 보이던 문제 완화
  - 모바일 패널 상단 여백 증가 (`.panel`, `.canvas`, `.layout--single > .canvas` 상단 패딩 조정)
  - 모바일 문장 세로 간격 개선 (`notice`, `guest`, `timeline`, 모달 본문 문단 line-height / margin 조정)
  - 게임 페이지 설명/상태/룰 텍스트 줄간격 개선 (`game.css`)

## Navigation / Tab Order Fixes (Today)
- 상단 탭 순서 재정렬: `home / notice / gallery / work / game / guest`
- `guest` 탭이 항상 가장 오른쪽에 오도록 메인 페이지들(`index`, `notice`, `gallery`, `work`, `game`, `guest`) nav 순서 재수정

## Security Note (Important)
- 로컬 개발용 `server.js`에 기상청 API 키가 하드코딩된 상태였고 GitHub에 올라간 이력이 있음
- 권장 조치:
  1) 기상청/공공데이터 API 키 재발급(또는 기존 키 폐기/교체)
  2) Cloudflare `WEATHER_KEY`를 새 키로 교체
  3) 로컬 `server.js` 키도 교체 또는 `.env` 방식으로 전환

## Current Files (Mainly Touched Today)
- `styles.css` (모바일 레이아웃 다듬기 / 서브페이지 단일 컬럼 수정 / SNS 아이콘 제거)
- `styles.css` (모바일 패널 라벨 여백 / 모바일 텍스트 줄간격 추가 조정)
- `script.js` (날씨 최저 fallback, 방문자수 fetch)
- `index.html` (방문자수 표시 연결)
- `server.js` (로컬 `/counter` 테스트용 추가)
- `functions/counter.js` (Pages KV 기반 방문자 카운터)
- `game.html`, `game.css`, `game.js`
- `game.css` (`game` 라벨 잘림 수정, 모바일 텍스트 줄간격 조정, 드롭 아이콘 정렬/간격 수정)
- `game.html`, `game.js` (게임 문구/오버레이/상태표시/로직 안정화)
- `index.html`, `notice.html`, `gallery.html`, `work.html`, `guest.html`
- `index.html`, `notice.html`, `gallery.html`, `work.html`, `guest.html`, `game.html` (상단 탭 순서 재정렬)
- `styles.css`, `script.js`
- `admin.html`, `admin.css`, `admin.js`
- `data/content.json`
- `scripts/update-content.js`, `scripts/make_thumbs.py`
- `docs/thumbnail-guide.md`

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
- 게임 개선 가능 사항: 난이도 조절, 사운드 이펙트, 터치 최적화, 리더보드

## Recommended Next Steps
1) 현재 로컬 변경 커밋 + push (게임 리디자인 포함)
2) Cloudflare Pages 자동 배포 재확인
3) `VISIT_COUNTER` 바인딩 연결 후 방문자수 동작 확인
4) 기상청 API 키 교체(보안)
5) 게임 모바일 터치 테스트
6) `admin.html` 로컬 저장 사용 시 `로컬 초기화` 필요 여부 체크

## Collaboration Notes (For Next Session)
- 사용자는 Git / Cloudflare / 배포 흐름을 아직 익히는 중이라, 설명을 아주 쉽게 해야 함
- 설명 방식은 `한 번에 한 단계`, `복붙 가능한 명령어`, `버튼 이름 그대로` 안내가 가장 잘 맞음
- 용어 설명 필요:
  - `Workers` vs `Pages`
  - `바인딩(Binding)` / `환경 변수` / `시크릿`
  - `commit`, `push`, `deploy`
- 문제 발생 시 긴 설명보다 먼저 `지금 해야 할 1줄 명령` 또는 `다음 클릭 1개`를 제시하는 방식이 효과적이었음
- 사용자가 “잘 모른다”는 전제를 유지하고, 확인 문구(예: 성공/실패 메시지) 기반으로 다음 단계 안내하기
