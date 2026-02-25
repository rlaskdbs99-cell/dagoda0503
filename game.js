(() => {
  const root = document.querySelector('[data-game]');
  if (!root) return;

  /* ── constants ── */
  const DURATION = 30;
  const SPAWN_MS = 850;
  const FALL_BASE = 2600;
  const FALL_VARY = 900;
  const ICONS = [
    'gallery/아이콘/1/1.png',
    'gallery/아이콘/1/2.png',
    'gallery/아이콘/1/3.png',
    'gallery/아이콘/1/5.png'
  ];

  /* ── DOM refs ── */
  const stage      = root.querySelector('[data-stage]');
  const ovReady    = root.querySelector('[data-ov="ready"]');
  const ovOver     = root.querySelector('[data-ov="over"]');
  const btnStart      = root.querySelector('[data-btn="start"]');
  const btnReadyStart = root.querySelector('[data-btn="ready-start"]');
  const btnReset      = root.querySelector('[data-btn="reset"]');
  const btnRetry      = root.querySelector('[data-btn="retry"]');
  const btnExit       = root.querySelector('[data-btn="exit"]');
  const elTime     = root.querySelector('[data-stat="time"]');
  const elScore    = root.querySelector('[data-stat="score"]');
  const elBest     = root.querySelector('[data-stat="best"]');
  const timerFill  = root.querySelector('[data-timer-fill]');
  const statusLine = root.querySelector('[data-status]');
  const comboTag   = root.querySelector('[data-combo]');
  const missLine   = root.querySelector('[data-miss-line]');
  const missLabel  = root.querySelector('[data-miss-label]');
  const hiScore    = root.querySelector('[data-hiscore]');
  const overScore  = root.querySelector('[data-over-score]');
  const overBest   = root.querySelector('[data-over-best]');
  const overRank   = root.querySelector('[data-over-rank]');
  const overLabel  = root.querySelector('[data-over-rank-label]');
  const overDesc   = root.querySelector('[data-over-rank-desc]');
  const overHit    = root.querySelector('[data-over-hit]');
  const overMiss   = root.querySelector('[data-over-miss]');
  const overAcc    = root.querySelector('[data-over-acc]');
  const newBadge   = root.querySelector('[data-new-badge]');

  /* ── state ── */
  let playing  = false;
  let score    = 0;
  let combo    = 0;
  let maxCombo = 0;
  let hits     = 0;
  let misses   = 0;
  let timeLeft = DURATION;
  let best     = parseInt(localStorage.getItem('icondrop-best') || '0', 10);
  let tickId   = null;
  let spawnId  = null;

  /* ── helpers ── */
  const pad4 = (n) => String(n).padStart(4, '0');

  function setOverlay(name) {
    ovReady.classList.toggle('is-active', name === 'ready');
    ovOver.classList.toggle('is-active', name === 'over');
  }

  function updateHUD() {
    elTime.textContent  = timeLeft + 's';
    elScore.textContent = score;
    elBest.textContent  = best;

    const pct = (timeLeft / DURATION) * 100;
    timerFill.style.width = pct + '%';
    timerFill.className = 'timer-fill';
    if (pct <= 20) timerFill.classList.add('timer-fill--low');
    else if (pct <= 50) timerFill.classList.add('timer-fill--mid');

    if (hiScore) hiScore.textContent = pad4(best);
  }

  function updateCombo() {
    if (combo >= 3) {
      comboTag.textContent = 'x' + combo;
      comboTag.style.visibility = 'visible';
    } else {
      comboTag.style.visibility = 'hidden';
    }
  }

  function setStatus(msg) {
    statusLine.textContent = msg;
  }

  /* ── rank system ── */
  function getRank(s) {
    if (s >= 1500) return { letter: 's', label: 'PERFECT',   desc: '완벽한 플레이!' };
    if (s >= 1000) return { letter: 'a', label: 'EXCELLENT',  desc: '대부분의 아이콘을 잡았어요!' };
    if (s >= 600)  return { letter: 'b', label: 'GREAT',      desc: '꽤 잘했어요!' };
    if (s >= 300)  return { letter: 'c', label: 'NICE TRY',   desc: '조금만 더 힘내봐요!' };
    return                { letter: 'd', label: 'TRY AGAIN',  desc: '다시 도전해보세요!' };
  }

  /* ── spawn icon ── */
  function spawnIcon() {
    if (!playing) return;

    const img = document.createElement('img');
    img.src = ICONS[Math.floor(Math.random() * ICONS.length)];
    img.alt = '';
    img.className = 'drop-icon';

    const size = 36 + Math.random() * 18;
    const left = 4 + Math.random() * 82;
    const rotA = -15 + Math.random() * 30;
    const rotB = -15 + Math.random() * 30;
    const dist = stage.offsetHeight + size + 20;
    const dur  = FALL_BASE + Math.random() * FALL_VARY;

    img.style.width  = size + 'px';
    img.style.height = size + 'px';
    img.style.left   = left + '%';
    img.style.setProperty('--rot-start', rotA + 'deg');
    img.style.setProperty('--rot-end', rotB + 'deg');
    img.style.setProperty('--fall-dist', dist + 'px');
    img.style.setProperty('--fall-dur', dur + 'ms');

    img.addEventListener('click', function handler(e) {
      e.stopPropagation();
      if (!playing) return;
      img.removeEventListener('click', handler);
      onHit(img, e);
    });

    img.addEventListener('animationend', () => {
      if (img.parentNode && playing) onMiss(img);
      else if (img.parentNode) img.remove();
    });

    stage.appendChild(img);
  }

  /* ── hit ── */
  function onHit(icon, e) {
    score += 10;
    combo++;
    hits++;
    if (combo > maxCombo) maxCombo = combo;
    if (combo >= 3) score += Math.min(combo, 10);

    const rect = icon.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const cx = rect.left - stageRect.left + rect.width / 2;
    const cy = rect.top - stageRect.top + rect.height / 2;

    showBurst(cx, cy);
    showFloat('+10', cx, cy, true);
    icon.remove();

    updateHUD();
    updateCombo();
    setStatus('HIT! +10' + (combo >= 3 ? ' (combo x' + combo + ')' : ''));
  }

  /* ── miss ── */
  function onMiss(icon) {
    score = Math.max(0, score - 5);
    misses++;
    combo = 0;

    const rect = icon.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    showFloat('-5', rect.left - stageRect.left + rect.width / 2, stageRect.height - 10, false);

    icon.remove();
    updateHUD();
    updateCombo();
    setStatus('MISS! -5');
  }

  /* ── effects ── */
  function showBurst(x, y) {
    const el = document.createElement('div');
    el.className = 'game-burst';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.innerHTML = '<div class="game-burst-ring"></div><div class="game-burst-glow"></div>';
    stage.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  function showFloat(text, x, y, isPlus) {
    const el = document.createElement('div');
    el.className = 'game-float' + (isPlus ? ' game-float--plus' : ' game-float--minus');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    stage.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  /* ── game flow ── */
  function startGame() {
    playing  = true;
    score    = 0;
    combo    = 0;
    maxCombo = 0;
    hits     = 0;
    misses   = 0;
    timeLeft = DURATION;

    clearStage();
    setOverlay(null);
    missLine.classList.add('is-visible');
    missLabel.classList.add('is-visible');
    updateHUD();
    updateCombo();
    setStatus('게임 시작! 아이콘을 클릭하세요!');

    tickId = setInterval(() => {
      timeLeft--;
      updateHUD();
      if (timeLeft <= 0) endGame();
    }, 1000);

    spawnId = setInterval(spawnIcon, SPAWN_MS);
    spawnIcon();
  }

  function endGame() {
    playing = false;
    clearInterval(tickId);
    clearInterval(spawnId);
    clearStage();
    missLine.classList.remove('is-visible');
    missLabel.classList.remove('is-visible');

    const isNew = score > best;
    if (isNew) {
      best = score;
      localStorage.setItem('icondrop-best', String(best));
    }

    const rank = getRank(score);
    const acc  = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

    overScore.textContent = score;
    overBest.textContent  = best;
    overRank.textContent  = rank.letter.toUpperCase();
    overRank.className    = 'rank-circle rank-circle--' + rank.letter;
    overLabel.textContent = rank.label;
    overDesc.textContent  = rank.desc;
    overHit.textContent   = hits;
    overMiss.textContent  = misses;
    overAcc.textContent   = acc + '%';
    newBadge.style.display = isNew ? 'inline-block' : 'none';

    setOverlay('over');
    updateHUD();
    setStatus('게임 종료! 점수: ' + score);
  }

  function resetGame() {
    playing = false;
    clearInterval(tickId);
    clearInterval(spawnId);
    score    = 0;
    combo    = 0;
    timeLeft = DURATION;

    clearStage();
    missLine.classList.remove('is-visible');
    missLabel.classList.remove('is-visible');
    setOverlay('ready');
    updateHUD();
    updateCombo();
    setStatus('start 버튼을 눌러 게임을 시작하세요.');
  }

  function clearStage() {
    stage.querySelectorAll('.drop-icon, .game-burst, .game-float').forEach(el => el.remove());
  }

  /* ── event listeners ── */
  btnStart.addEventListener('click', startGame);
  btnReadyStart.addEventListener('click', startGame);
  btnReset.addEventListener('click', resetGame);
  btnRetry.addEventListener('click', startGame);
  btnExit.addEventListener('click', resetGame);

  /* ── init ── */
  updateHUD();
  updateCombo();
})();
