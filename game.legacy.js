(() => {
  const stage = document.querySelector('[data-game-stage]');
  const startBtn = document.querySelector('[data-game-start]');
  const resetBtn = document.querySelector('[data-game-reset]');
  const scoreEl = document.querySelector('[data-game-score]');
  const timeEl = document.querySelector('[data-game-time]');
  const bestEl = document.querySelector('[data-game-best]');
  const statusEl = document.querySelector('[data-game-status]');
  const overlayEl = document.querySelector('[data-game-overlay]');

  if (!stage || !startBtn || !resetBtn) return;

  const FALLBACK_ICON = '✦';
  const ICONS = [
    'gallery/아이콘/1/1.png',
    'gallery/아이콘/1/2.png',
    'gallery/아이콘/1/3.png',
    'gallery/아이콘/1/5.png'
  ];
  const BEST_KEY = 'iconDropBest';
  const ROUND_SECONDS = 30;

  let score = 0;
  let timeLeft = ROUND_SECONDS;
  let running = false;
  let spawnTimer = null;
  let tickTimer = null;

  function getBest() {
    try {
      const value = Number(localStorage.getItem(BEST_KEY));
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  function setBest(value) {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch {
      // Ignore storage errors (private mode or blocked storage)
    }
  }

  function setOverlay(title, desc, hidden) {
    if (!overlayEl) return;
    const titleNode = overlayEl.querySelector('.game-overlay__title');
    const descNode = overlayEl.querySelector('.game-overlay__desc');
    if (titleNode) titleNode.textContent = title;
    if (descNode) descNode.textContent = desc;
    overlayEl.classList.toggle('is-hidden', hidden);
  }

  function setStatus(message) {
    if (statusEl) statusEl.textContent = message;
  }

  function updateUI() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (timeEl) timeEl.textContent = String(timeLeft);
    if (bestEl) bestEl.textContent = String(getBest());
    startBtn.textContent = running ? 'playing' : 'start';
    startBtn.disabled = running;
  }

  function clearTimers() {
    if (spawnTimer) clearInterval(spawnTimer);
    if (tickTimer) clearInterval(tickTimer);
    spawnTimer = null;
    tickTimer = null;
  }

  function clearDrops() {
    stage.querySelectorAll('.drop, .score-float').forEach((node) => node.remove());
  }

  function updateFallDistance() {
    const distance = Math.max(180, stage.clientHeight + 40);
    stage.style.setProperty('--fall-distance', `${distance}px`);
  }

  function showScoreFloat(x, y, delta) {
    const floatEl = document.createElement('div');
    floatEl.className = `score-float${delta < 0 ? ' is-minus' : ''}`;
    floatEl.textContent = `${delta > 0 ? '+' : ''}${delta}`;
    floatEl.style.left = `${x}px`;
    floatEl.style.top = `${y}px`;
    floatEl.addEventListener('animationend', () => floatEl.remove(), { once: true });
    stage.appendChild(floatEl);
  }

  function applyScore(delta, x, y) {
    score = Math.max(0, score + delta);
    if (typeof x === 'number' && typeof y === 'number') {
      showScoreFloat(x, y, delta);
    }
    updateUI();
  }

  function buildDrop() {
    const drop = document.createElement('button');
    drop.type = 'button';
    drop.className = 'drop';
    drop.setAttribute('aria-label', '아이콘 클릭');

    const size = 36 + Math.floor(Math.random() * 18);
    const maxLeft = Math.max(0, stage.clientWidth - size);
    drop.style.width = `${size}px`;
    drop.style.height = `${size}px`;
    drop.style.left = `${Math.floor(Math.random() * (maxLeft + 1))}px`;
    drop.style.top = '0px';
    drop.style.animationDuration = `${(1.9 + Math.random() * 1.7).toFixed(2)}s`;

    const img = document.createElement('img');
    img.src = ICONS[Math.floor(Math.random() * ICONS.length)];
    img.alt = '';
    img.loading = 'eager';
    img.addEventListener(
      'error',
      () => {
        img.remove();
        const fallback = document.createElement('span');
        fallback.className = 'drop__fallback';
        fallback.setAttribute('aria-hidden', 'true');
        fallback.textContent = FALLBACK_ICON;
        drop.appendChild(fallback);
      },
      { once: true }
    );

    drop.appendChild(img);
    return drop;
  }

  function spawnDrop() {
    if (!running) return;
    updateFallDistance();
    const drop = buildDrop();

    drop.addEventListener('click', (event) => {
      if (!running || drop.dataset.resolved === 'true') return;
      drop.dataset.resolved = 'true';
      const rect = stage.getBoundingClientRect();
      const targetRect = drop.getBoundingClientRect();
      const x = targetRect.left - rect.left + targetRect.width / 2;
      const y = targetRect.top - rect.top + targetRect.height / 2;
      applyScore(10, x, y);
      drop.classList.add('drop--hit');
      setTimeout(() => drop.remove(), 90);
      event.stopPropagation();
    });

    drop.addEventListener('animationend', () => {
      if (drop.dataset.resolved === 'true') {
        drop.remove();
        return;
      }
      drop.dataset.resolved = 'true';
      if (running) {
        const rect = stage.getBoundingClientRect();
        const targetRect = drop.getBoundingClientRect();
        const x = targetRect.left - rect.left + targetRect.width / 2;
        const y = Math.min(stage.clientHeight - 20, targetRect.top - rect.top + targetRect.height / 2);
        applyScore(-5, x, y);
      }
      drop.remove();
    });

    stage.appendChild(drop);
  }

  function finishGame() {
    running = false;
    clearTimers();

    const previousBest = getBest();
    const isNewBest = score > previousBest;
    if (isNewBest) setBest(score);
    updateUI();

    setStatus(
      isNewBest
        ? `종료! 새 최고점수 ${score}점`
        : `종료! 이번 점수 ${score}점 / 최고 ${getBest()}점`
    );
    setOverlay('TIME UP', `이번 점수 ${score}점`, false);
  }

  function resetGame() {
    running = false;
    clearTimers();
    score = 0;
    timeLeft = ROUND_SECONDS;
    clearDrops();
    updateFallDistance();
    updateUI();
    setStatus('start 버튼을 눌러 게임을 시작하세요.');
    setOverlay('READY?', '30초 동안 아이콘을 최대한 많이 클릭해보세요.', false);
  }

  function startGame() {
    if (running) return;
    running = true;
    score = 0;
    timeLeft = ROUND_SECONDS;
    clearDrops();
    updateFallDistance();
    updateUI();
    setStatus('게임 진행 중: 아이콘 클릭 +10 / 놓치면 -5');
    setOverlay('GO!', '아이콘을 빠르게 눌러 점수를 올리세요.', true);

    spawnDrop();
    spawnTimer = setInterval(spawnDrop, 520);
    tickTimer = setInterval(() => {
      timeLeft -= 1;
      updateUI();
      if (timeLeft <= 0) {
        finishGame();
      }
    }, 1000);
  }

  startBtn.addEventListener('click', startGame);
  resetBtn.addEventListener('click', resetGame);
  window.addEventListener('resize', updateFallDistance);

  updateFallDistance();
  updateUI();
  setStatus('start 버튼을 눌러 게임을 시작하세요.');
})();
