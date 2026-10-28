// 게임 흐름. 케이크 1개 = 크림 짜기 -> 과일 올리기 -> 결과 판정, 이를 목숨이 다할 때까지 반복한다.
(function () {
  const C = window.CONFIG;
  const $ = (id) => document.getElementById(id);
  const { width: W, height: H, pixelRatio: PR } = C.world;

  const screens = { start: $('screen-start'), game: $('screen-game'), end: $('screen-end') };
  function showScreen(name) {
    for (const k in screens) screens[k].classList.toggle('active', k === name);
    if (name === 'start') $('best-score').textContent = Save.getBest();
  }

  const canvas = $('stage');
  const ctx = canvas.getContext('2d');
  canvas.width = W * PR;
  canvas.height = H * PR;
  ctx.setTransform(PR, 0, 0, PR, 0, 0);

  const path = Wave.buildPath();
  const state = {
    cake: { x: C.cake.centerX, y: C.cake.centerY, scale: 1 },
    path,
    strokes: [],
    tracker: new Wave.CreamTracker(path),
    creamColor: 'white',
    phase: 'cream', // cream(크림 짜기) -> fruit(과일 올리기) -> judging(잠깐 대기) -> result
    fruits: [],
    score: 0,
    lives: C.game.lives,
    cleared: 0,     // 성공한 케이크 수. 제한 시간이 이에 따라 줄어든다.
    timeLeft: 0,
    over: false,    // 마지막 목숨을 잃은 상태 (결과 카드 다음에 종료 화면)
    moveAmp: 0,     // 케이크 좌우 이동 폭 (0이면 가만히 있음)
    moveSpeed: 0,
    moveT: 0,
  };

  // 화면 좌표 -> 케이크 로컬 좌표 (케이크가 움직여도 크림은 케이크에 붙어 있다)
  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    const wx = ((e.clientX - r.left) / r.width) * W;
    const wy = ((e.clientY - r.top) / r.height) * H;
    return { x: (wx - state.cake.x) / state.cake.scale, y: (wy - state.cake.y) / state.cake.scale };
  }

  // ---- HUD ----
  function setHint(text) { $('hint').textContent = text; }

  function renderHud() {
    $('hud-time').textContent = Math.max(0, Math.ceil(state.timeLeft));
    $('hud-score').textContent = state.score;
    let hearts = '';
    for (let i = 0; i < C.game.lives; i++) hearts += `<span class="${i < state.lives ? '' : 'lost'}">♥</span>`;
    $('hud-lives').innerHTML = hearts;
  }

  // ---- 흐름 ----
  function timeLimit() {
    const g = C.game;
    return Math.max(g.minTimeSec, g.startTimeSec - g.timeStepSec * state.cleared);
  }

  function newGame() {
    state.score = 0;
    state.lives = C.game.lives;
    state.cleared = 0;
    state.over = false;
    newCake();
    showScreen('game');
  }

  // 성공한 케이크 수에 따라 크기와 움직임을 정한다
  function layoutCake() {
    const d = C.difficulty;
    const scale = Math.max(d.minScale, 1 - d.shrinkPerClear * state.cleared);
    state.cake.scale = scale;
    state.cake.x = C.cake.centerX;
    state.moveT = 0;
    if (state.cleared >= d.moveStartCleared) {
      const room = C.world.width / 2 - (C.cake.radius + 14) * scale - 4; // 접시가 화면 밖으로 나가지 않을 여유
      state.moveAmp = Math.max(0, Math.min(d.moveAmplitude, room));
      state.moveSpeed = Math.min(d.moveSpeedMax, d.moveSpeedStart + d.moveSpeedStep * (state.cleared - d.moveStartCleared));
    } else {
      state.moveAmp = 0;
    }
  }

  function newCake() {
    state.strokes = [];
    state.tracker.reset();
    state.fruits = Wave.buildFruitSpots();
    state.phase = 'cream';
    state.timeLeft = timeLimit();
    layoutCake();
    current = null;
    pointer = null;
    $('result').classList.add('hidden');
    setHint('점선을 따라 그려요');
    renderHud();
  }

  function startFruitPhase() {
    state.phase = 'fruit';
    updateFruitHint();
  }

  function updateFruitHint() {
    const placed = state.fruits.filter((f) => f.placedAt !== null).length;
    setHint(`과일을 올려요! (${placed}/${state.fruits.length})`);
  }

  // 결과 카드를 띄운다. 실패면 목숨을 잃고, 목숨이 0이면 카드 버튼이 종료 화면으로 이어진다.
  function showResult(ok, title, detail) {
    state.phase = 'result';
    if (ok) {
      state.cleared++;
      Sound.success();
    } else {
      state.lives--;
      Sound.fail();
    }
    state.over = state.lives <= 0;
    renderHud();
    $('result-title').textContent = title;
    $('result-title').classList.toggle('fail', !ok);
    $('result-detail').textContent = detail;
    $('btn-next').textContent = state.over ? '결과 보기' : '다음 케이크';
    $('result').classList.remove('hidden');
    setHint('');
  }

  function judge() {
    const pct = Math.round(state.tracker.match * 100);
    if (pct >= C.judge.passPercent) {
      state.score += pct;
      showResult(true, '성공! 🎉', `일치율 ${pct}% · +${pct}점`);
    } else {
      showResult(false, '아쉬워요 😢', `일치율 ${pct}% · ${C.judge.passPercent}% 필요`);
    }
  }

  function timeUp() {
    current = null;
    showResult(false, '시간 초과! ⏰', '목숨이 하나 줄었어요');
  }

  function endGame() {
    const best = Save.getBest();
    const isNew = state.score > best;
    if (isNew) Save.setBest(state.score);
    $('end-score').textContent = state.score;
    $('end-best').textContent = Math.max(best, state.score);
    $('end-new').classList.toggle('hidden', !isNew);
    showScreen('end');
  }

  // ---- 입력 ----
  let current = null; // 지금 그리는 선
  let last = null;
  let pointer = null; // 그리는 중인 손가락의 마지막 화면 위치. 케이크가 움직이면 손가락이 가만히 있어도 크림이 이어져야 한다.

  function addPoint(p) {
    current.push(p);
    state.tracker.add(p.x, p.y);
  }

  function tapFruit(p) {
    let best = null;
    let bestD = C.fruit.tapRadius / state.cake.scale; // 화면 기준 거리를 케이크 좌표로 환산
    for (const f of state.fruits) {
      if (f.placedAt !== null) continue;
      const d = Math.hypot(f.x - p.x, f.y - p.y);
      if (d <= bestD) { best = f; bestD = d; }
    }
    if (!best) return; // 빗나간 탭은 무시
    best.placedAt = performance.now();
    Sound.fruit();
    updateFruitHint();
    if (state.fruits.every((f) => f.placedAt !== null)) {
      state.phase = 'judging'; // 타이머는 여기서 멈춘다
      setTimeout(judge, 450);  // 마지막 과일이 톡 올라가는 모습을 보여준 뒤 판정
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state.phase === 'fruit') {
      tapFruit(toLocal(e));
      return;
    }
    if (state.phase !== 'cream') return;
    canvas.setPointerCapture(e.pointerId);
    pointer = { clientX: e.clientX, clientY: e.clientY };
    last = toLocal(e);
    current = [];
    state.strokes.push(current);
    addPoint(last);
  });

  // 손가락이 케이크 좌표로 p까지 왔다고 보고 선을 촘촘히 이어 그린다
  function extendTo(p) {
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    const dist = Math.hypot(dx, dy);
    const n = Math.floor(dist / C.cream.step);
    const from = last;
    for (let k = 1; k <= n; k++) {
      const t = (k * C.cream.step) / dist;
      last = { x: from.x + dx * t, y: from.y + dy * t };
      addPoint(last);
    }
    if (n > 0) Sound.cream();
  }

  canvas.addEventListener('pointermove', (e) => {
    if (!current) return;
    pointer = { clientX: e.clientX, clientY: e.clientY };
    extendTo(toLocal(e));
  });

  function endStroke() {
    if (!current) return;
    current = null;
    pointer = null;
    // 도안을 충분히 덮은 채로 손을 떼면 과일 단계로
    if (state.phase === 'cream' && state.tracker.coverage * 100 >= C.judge.coverToFruitPercent) {
      startFruitPhase();
    }
  }
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);

  // ---- 버튼 ----
  $('color-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-color]');
    if (!btn) return;
    state.creamColor = btn.dataset.color;
    for (const b of $('color-picker').children) b.classList.toggle('selected', b === btn);
  });

  // 소리는 첫 터치 이후에 켤 수 있다 (아이폰은 touchend/click에서만 풀린다)
  for (const type of ['pointerdown', 'pointerup', 'touchend', 'click']) {
    document.addEventListener(type, Sound.unlock, true);
  }

  function renderMute() {
    for (const b of document.querySelectorAll('.btn-mute')) {
      b.textContent = Sound.isMuted() ? '🔇 소리 꺼짐' : '🔊 소리 켜짐';
    }
  }
  for (const b of document.querySelectorAll('.btn-mute')) {
    b.addEventListener('click', () => {
      Sound.setMuted(!Sound.isMuted());
      renderMute();
    });
  }
  renderMute();

  $('btn-start').addEventListener('click', newGame);
  $('btn-retry').addEventListener('click', newGame);
  $('btn-next').addEventListener('click', () => (state.over ? endGame() : newCake()));
  $('btn-home').addEventListener('click', () => showScreen('start'));

  // ---- 메인 루프 ----
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000); // 탭이 백그라운드였다 돌아와도 시간이 한꺼번에 깎이지 않게
    lastT = now;
    if (screens.game.classList.contains('active')) {
      if (state.phase === 'cream' || state.phase === 'fruit') {
        if (state.moveAmp > 0) {
          state.moveT += dt;
          state.cake.x = C.cake.centerX + state.moveAmp * Math.sin(state.moveSpeed * state.moveT);
          if (current && pointer) extendTo(toLocal(pointer));
        }
        state.timeLeft -= dt;
        if (state.timeLeft <= 0) {
          state.timeLeft = 0;
          timeUp();
        }
        $('hud-time').textContent = Math.ceil(state.timeLeft);
      }
      Draw.render(ctx, state);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  showScreen('start');
})();
