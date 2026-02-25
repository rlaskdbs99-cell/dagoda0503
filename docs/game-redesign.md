# ICON DROP 게임 리디자인 기록

> 작성일: 2026-02-25
> 상태: 완료 (플레이 가능)

## 개요

기존 투박한 다크 아케이드 테마의 게임 UI를 포트폴리오 사이트 톤(크림/그린/종이 질감)에 맞게 전면 리디자인했다. 게임 로직도 프로토타입(화면 전환만 가능)에서 실제 플레이 가능한 완성형으로 교체했다.


## 디자인 결정 과정

### 1차 시도 — 다크 네온 아케이드 (기각)

처음에는 어두운 배경에 네온 그린(`#51f2c5`), 핫 핑크(`#ff6bf2`) 컬러의 CRT 스캔라인 스타일로 제작했다. `game-preview.html`로 사용자에게 보여줬으나, 사이트 전체 톤과 통일감이 없다는 이유로 기각.

### 2차 시도 — 사이트 톤 매칭 (채택)

사이트 스크린샷을 참고해서 기존 디자인 토큰을 그대로 사용하는 방향으로 재작성. 크림 배경, dashed 보더, 저채도 그린 팔레트, frosted glass 오버레이 적용. `game-preview.html`로 대기/플레이/종료 3개 상태를 미리 보여준 후 승인받고 실제 적용.

### 핵심 디자인 원칙

- 사이트 CSS 변수(`--green-900`, `--cream`, `--paper` 등)를 그대로 사용
- 게임 전용 추가 변수: `--amber: #b8935a`, `--coral: #b85c5c`
- 게임 전용 폰트: `Press Start 2P` (Google Fonts)
- 나머지 폰트/보더/라운딩은 사이트와 동일


## 파일 구조

| 파일 | 역할 |
|------|------|
| `game.html` | 게임 페이지 마크업 |
| `game.css` | 게임 전용 스타일 (사이트 톤 매칭) |
| `game.js` | 게임 로직 (IIFE, 바닐라 JS) |
| `game-preview.html` | 디자인 프리뷰 (개발용, 배포 불필요) |
| `game.html.bak` | 리디자인 전 백업 |
| `game.css.bak` | 리디자인 전 백업 |
| `game.js.bak` | 리디자인 전 백업 |


## HTML 구조 (data 속성 맵)

`game.html`은 `layout--single` 레이아웃(프로필 + 캔버스)을 사용한다. 게임 패널의 루트는 `[data-game]`이고, 모든 DOM 조회는 이 루트 기준으로 한다.

```
[data-game]                    ← 게임 패널 루트
├── [data-btn="start"]         ← 상단 start 버튼
├── [data-btn="reset"]         ← 상단 reset 버튼
├── [data-stat="time"]         ← TIME 값 표시
├── [data-stat="score"]        ← SCORE 값 표시
├── [data-stat="best"]         ← BEST 값 표시
├── [data-timer-fill]          ← 타이머 프로그레스 바
├── [data-status]              ← 상태 메시지 라인
├── [data-stage]               ← 게임 스테이지 (아이콘 낙하 영역)
│   ├── [data-ov="ready"]      ← 대기 오버레이
│   │   ├── [data-btn="ready-start"]  ← PRESS START 버튼
│   │   └── [data-hiscore]     ← HI-SCORE 표시
│   ├── [data-ov="over"]       ← 게임오버 오버레이
│   │   ├── [data-over-score]  ← 최종 점수
│   │   ├── [data-over-best]   ← 최고 점수
│   │   ├── [data-over-rank]   ← 랭크 원형 (S/A/B/C/D)
│   │   ├── [data-over-rank-label]  ← 랭크 이름
│   │   ├── [data-over-rank-desc]   ← 랭크 설명
│   │   ├── [data-over-hit]    ← 적중 수
│   │   ├── [data-over-miss]   ← 놓침 수
│   │   ├── [data-over-acc]    ← 정확도
│   │   ├── [data-new-badge]   ← NEW! 뱃지
│   │   ├── [data-btn="retry"] ← retry 버튼
│   │   └── [data-btn="exit"]  ← exit 버튼
│   ├── [data-combo]           ← 콤보 태그
│   ├── [data-miss-line]       ← 하단 실패 라인
│   └── [data-miss-label]      ← MISS 라벨
└── .rules                     ← 규칙 안내
```


## 게임 로직 (game.js)

### 상수

| 이름 | 값 | 설명 |
|------|-----|------|
| `DURATION` | 30 | 게임 시간(초) |
| `SPAWN_MS` | 850 | 아이콘 생성 간격(ms) |
| `FALL_BASE` | 2600 | 낙하 기본 시간(ms) |
| `FALL_VARY` | 900 | 낙하 랜덤 변동폭(ms) |

### 상태 흐름

```
ready → (start/PRESS START 클릭) → playing → (30초 경과) → over
  ↑                                                          │
  └──────────── (exit/reset 클릭) ◄────────── (retry 클릭) ──┘
```

### 점수 체계

- 아이콘 클릭: **+10**
- 콤보 3+ 연속: **추가 +combo** (최대 +10)
- 아이콘 바닥 도달(miss): **-5** (최소 0)

### 랭크 기준

| 랭크 | 점수 | 라벨 |
|------|------|------|
| S | 1500+ | PERFECT |
| A | 1000+ | EXCELLENT |
| B | 600+ | GREAT |
| C | 300+ | NICE TRY |
| D | 0+ | TRY AGAIN |

### 최고점수 저장

`localStorage` 키: `icondrop-best`

### 아이콘 경로

```
gallery/아이콘/1/1.png  ← 석류
gallery/아이콘/1/2.png  ← 나뭇잎
gallery/아이콘/1/3.png  ← 레몬
gallery/아이콘/1/5.png  ← 사과
```

투명 배경 PNG, 사용자(dago)가 직접 그린 일러스트.


## CSS 구조 (game.css)

### 주요 섹션

1. **게임 헤더** — `.game-head`, `.game-title`, `.game-sub`, `.game-controls`
2. **버튼** — `.btn`, `.btn--primary`, `.btn--ghost`
3. **스탯 바** — `.stats-bar`, `.stat-box`, `.timer-track`, `.timer-fill`
4. **상태 라인** — `.status-line`
5. **스테이지** — `.stage` (dashed 보더 + 줄무늬 배경)
6. **실패 라인** — `.miss-line`, `.miss-line-label` (게임 중에만 `.is-visible`)
7. **오버레이** — `.overlay`, `.ov-ready`, `.ov-over` (frosted glass)
8. **스코어 카드** — `.score-card`, `.sc-row`, `.rank-circle--{s,a,b,c,d}`
9. **낙하 아이콘** — `.drop-icon` (`g-fall` 애니메이션, CSS 커스텀 속성으로 제어)
10. **이펙트** — `.game-burst` (적중), `.game-float` (점수 팝업)
11. **콤보** — `.combo-tag`
12. **규칙** — `.rules`, `.rules-list`

### 커스텀 속성 (아이콘별 동적 설정)

```css
--rot-start   /* 시작 회전 각도 */
--rot-end     /* 종료 회전 각도 */
--fall-dist   /* 낙하 거리(px) */
--fall-dur    /* 낙하 시간(ms) */
```

### 애니메이션 목록

| 이름 | 용도 |
|------|------|
| `g-bob` | 대기 화면 아이콘 위아래 흔들림 |
| `g-blink` | PRESS START 깜빡임 |
| `g-fall` | 아이콘 낙하 |
| `g-ring` | 적중 시 링 확장 |
| `g-glow` | 적중 시 글로우 |
| `g-float-up` | +10/-5 점수 팝업 |
| `g-combo` | 콤보 태그 펄스 |
| `g-badge` | NEW! 뱃지 글로우 |

### 반응형

`720px` 이하에서 스탯 바 단일 컬럼, 타이틀 축소, 스테이지 높이 감소.


## 수정 시 주의사항

- `game.css`는 `game.html`에서만 로드됨 — 다른 페이지에 영향 없음
- `.btn` 클래스는 `game.css`에만 정의됨 (`styles.css`에는 없음)
- 아이콘 `.drop-icon`은 JS에서 동적 생성/삭제 — HTML에 없음
- `.game-burst`, `.game-float`도 JS에서 동적 생성 후 `setTimeout`으로 삭제
- 오버레이 전환은 `.is-active` 클래스 토글로 제어
- 실패 라인은 `.is-visible` 클래스로 게임 중에만 표시
- `game-preview.html`은 디자인 확인용이라 실제 배포에는 불필요


## 남은 작업 / 개선 가능 사항

- 난이도 조절 (시간이 지나면 `SPAWN_MS` 감소 등)
- 사운드 이펙트 추가
- 터치 디바이스 최적화 (터치 영역 확대 등)
- 리더보드 (서버 연동 시)
