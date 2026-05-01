(() => {
  const root = document.querySelector("[data-snake]");
  if (!root) return;

  const canvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById("gameCanvas"));
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const bestStartEl = document.getElementById("bestStart");
  const bestEndEl = document.getElementById("bestEnd");
  const finalScoreEl = document.getElementById("finalScore");
  const startOverlay = document.getElementById("startOverlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const startBtn = document.getElementById("startBtn");
  const playAgainBtn = document.getElementById("playAgainBtn");
  const restartBtn = document.getElementById("restartBtn");
  const pauseBtn = document.getElementById("pauseBtn");

  // -----------------------------
  // Theme + tuning
  // -----------------------------
  const GRID = 22;
  const BASE_STEP_MS = 120; // base movement interval (ms)

  const BG = "#FFFDF7";
  const GRID_LINE = "rgba(26,26,46,0.055)";
  const WALL_TINT = "rgba(26,26,46,0.04)";

  const C_HEAD = [255, 107, 157]; // pink
  const C_MID = [196, 77, 255]; // purple
  const C_TAIL = [77, 121, 255]; // blue
  const C_FOOD = [255, 217, 61]; // yellow

  /** @type {{x:number,y:number}[]} */
  let snake = [];
  /** @type {{x:number,y:number}} */
  let dir = { x: 1, y: 0 };
  /** @type {{x:number,y:number}} */
  let nextDir = { x: 1, y: 0 };
  /** @type {{x:number,y:number}} */
  let food = { x: 10, y: 10 };
  let score = 0;
  let best = 0;
  let foodsEaten = 0;

  /** @type {"start"|"play"|"over"} */
  let state = "start";
  let paused = false;

  // animation timers (seconds-ish)
  let foodSpawnT = 0;
  let headGlowT = 0;
  let gameOverFlashT = 0;

  // fixed-step timing
  let lastNow = 0;
  let accumulator = 0;
  let stepMs = BASE_STEP_MS;

  // demo mode (start screen)
  let demoTurn = 0;

  // touch swipe
  let touchStart = null;

  const storageKey = "snake_best_v1";

  function loadBest() {
    const raw = localStorage.getItem(storageKey);
    const n = raw ? Number(raw) : 0;
    best = Number.isFinite(n) ? Math.max(0, n) : 0;
    if (bestEl) bestEl.textContent = String(best);
    if (bestStartEl) bestStartEl.textContent = String(best);
    if (bestEndEl) bestEndEl.textContent = String(best);
  }

  function saveBest() {
    localStorage.setItem(storageKey, String(best));
  }

  function cellSize() {
    return Math.floor(Math.min(canvas.width, canvas.height) / GRID);
  }

  function randInt(max) {
    return Math.floor(Math.random() * max);
  }

  function samePos(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function isOpposite(a, b) {
    return a.x === -b.x && a.y === -b.y;
  }

  function placeFood() {
    // Try random spots first; fall back to scan if needed
    for (let tries = 0; tries < 200; tries++) {
      const p = { x: randInt(GRID), y: randInt(GRID) };
      if (!snake.some((s) => samePos(s, p))) {
        food = p;
        foodSpawnT = 1;
        return;
      }
    }
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const p = { x, y };
        if (!snake.some((s) => samePos(s, p))) {
          food = p;
          foodSpawnT = 1;
          return;
        }
      }
    }
  }

  function setOverlay(el, show) {
    if (!el) return;
    el.style.display = show ? "grid" : "none";
    el.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function setScore(n) {
    score = n;
    if (scoreEl) scoreEl.textContent = String(score);
  }

  function computeSpeed() {
    const level = Math.floor(foodsEaten / 5);
    // faster every 5 foods, but clamp to keep it playable
    stepMs = Math.max(58, BASE_STEP_MS - level * 10);
  }

  function reset(mode = "play") {
    const mid = Math.floor(GRID / 2);
    const y = mid;
    const len = mode === "start" ? 7 : 4;
    snake = [];
    for (let i = 0; i < len; i++) snake.push({ x: mid - (len - 1 - i), y });
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    foodsEaten = 0;
    setScore(0);
    headGlowT = 0;
    gameOverFlashT = 0;
    paused = false;
    if (pauseBtn) pauseBtn.textContent = "Pause";
    placeFood();
    computeSpeed();
    demoTurn = 0;
  }

  function startPlay() {
    state = "play";
    reset("play");
    setOverlay(startOverlay, false);
    setOverlay(gameOverOverlay, false);
  }

  function gameOver() {
    state = "over";
    paused = false;
    gameOverFlashT = 1;
    if (pauseBtn) pauseBtn.textContent = "Pause";
    if (finalScoreEl) finalScoreEl.textContent = String(score);

    if (score > best) {
      best = score;
      if (bestEl) bestEl.textContent = String(best);
      if (bestStartEl) bestStartEl.textContent = String(best);
      if (bestEndEl) bestEndEl.textContent = String(best);
      saveBest();
    }

    if (bestEndEl) bestEndEl.textContent = String(best);

    // delay overlay slightly for a nicer "flash then reveal"
    setTimeout(() => {
      if (state === "over") setOverlay(gameOverOverlay, true);
    }, 220);
  }

  function step() {
    dir = nextDir;
    const head = snake[snake.length - 1];
    const next = { x: head.x + dir.x, y: head.y + dir.y };

    // wall collision
    if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID) {
      gameOver();
      return;
    }

    // self collision (allow tail move by checking after potential shift)
    const willEat = samePos(next, food);
    const bodyToCheck = willEat ? snake : snake.slice(1);
    if (bodyToCheck.some((s) => samePos(s, next))) {
      gameOver();
      return;
    }

    snake.push(next);
    if (willEat) {
      foodsEaten += 1;
      setScore(score + 1);
      headGlowT = 1;
      placeFood();
      computeSpeed();
    } else {
      snake.shift();
    }
  }

  function demoLogic() {
    // gentle autopilot on the start screen: trace a safe rectangle loop
    const head = snake[snake.length - 1];
    const margin = 2;
    if (dir.x === 1 && head.x >= GRID - 1 - margin) nextDir = { x: 0, y: 1 };
    else if (dir.y === 1 && head.y >= GRID - 1 - margin) nextDir = { x: -1, y: 0 };
    else if (dir.x === -1 && head.x <= margin) nextDir = { x: 0, y: -1 };
    else if (dir.y === -1 && head.y <= margin) nextDir = { x: 1, y: 0 };

    // occasionally "wiggle" for life
    demoTurn += 1;
    if (demoTurn % 30 === 0) {
      // no-op, just keeps animation cadence consistent
    }
  }

  function drawGrid(sz) {
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < GRID; i++) {
      const p = i * sz;
      ctx.moveTo(p + 0.5, 0);
      ctx.lineTo(p + 0.5, GRID * sz);
      ctx.moveTo(0, p + 0.5);
      ctx.lineTo(GRID * sz, p + 0.5);
    }
    ctx.stroke();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function draw() {
    const sz = cellSize();
    const w = GRID * sz;
    const h = GRID * sz;
    const now = performance.now();

    // Clear
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center the board if canvas isn't exact
    const ox = Math.floor((canvas.width - w) / 2);
    const oy = Math.floor((canvas.height - h) / 2);

    ctx.save();
    ctx.translate(ox, oy);

    // subtle wall tint
    ctx.fillStyle = WALL_TINT;
    ctx.fillRect(0, 0, w, h);

    // Grid
    drawGrid(sz);

    // Food (glowing pulsing circle + spawn pop)
    const fx = food.x * sz + sz / 2;
    const fy = food.y * sz + sz / 2;
    const pulse = 0.92 + 0.08 * Math.sin(now / 180);
    const pop = foodSpawnT > 0 ? 0.7 + (1 - foodSpawnT) * 0.45 : 1;
    const r = (sz * 0.28) * pulse * pop;

    ctx.save();
    ctx.shadowColor = `rgba(${C_FOOD[0]},${C_FOOD[1]},${C_FOOD[2]},0.65)`;
    ctx.shadowBlur = 18;
    ctx.fillStyle = `rgb(${C_FOOD[0]},${C_FOOD[1]},${C_FOOD[2]})`;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Snake: rounded rect segments with head->tail gradient shift
    const n = snake.length;
    for (let i = 0; i < n; i++) {
      const s = snake[i];
      const x = s.x * sz;
      const y = s.y * sz;
      const t = n <= 1 ? 1 : i / (n - 1); // tail 0 -> head 1

      const col = t < 0.5 ? lerpRgb(C_TAIL, C_MID, t / 0.5) : lerpRgb(C_MID, C_HEAD, (t - 0.5) / 0.5);
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;

      // head glow flash on eat
      const isHead = i === n - 1;
      if (isHead && headGlowT > 0) {
        ctx.save();
        ctx.shadowColor = "rgba(255,107,157,0.45)";
        ctx.shadowBlur = 22 * headGlowT;
        roundRect(x + 3, y + 3, sz - 6, sz - 6, 12);
        ctx.fill();
        ctx.restore();
      }

      roundRect(x + 3, y + 3, sz - 6, sz - 6, 12);
      ctx.fill();
    }

    ctx.restore();

    // Game over red flash
    if (gameOverFlashT > 0) {
      ctx.save();
      ctx.globalAlpha = 0.18 * gameOverFlashT;
      ctx.fillStyle = "rgb(255, 60, 60)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  function loop(now) {
    if (!lastNow) lastNow = now;
    const dt = Math.min(32, now - lastNow);
    lastNow = now;
    accumulator += dt;

    // decay animations (frame-rate independent-ish)
    const decay = dt / 1000;
    foodSpawnT = Math.max(0, foodSpawnT - decay * 3.2);
    headGlowT = Math.max(0, headGlowT - decay * 5.5);
    gameOverFlashT = Math.max(0, gameOverFlashT - decay * 4.5);

    if (!paused) {
      if (state === "start") {
        // run demo at a slower rate
        const demoMs = 150;
        while (accumulator >= demoMs) {
          accumulator -= demoMs;
          demoLogic();
          step();
        }
      } else if (state === "play") {
        while (accumulator >= stepMs) {
          accumulator -= stepMs;
          step();
          if (state !== "play") break;
        }
      }
    }

    draw();
    requestAnimationFrame(loop);
  }

  function onKeyDown(e) {
    const k = e.key.toLowerCase();

    /** @type {{x:number,y:number}|null} */
    let nd = null;
    if (k === "arrowup" || k === "w") nd = { x: 0, y: -1 };
    if (k === "arrowdown" || k === "s") nd = { x: 0, y: 1 };
    if (k === "arrowleft" || k === "a") nd = { x: -1, y: 0 };
    if (k === "arrowright" || k === "d") nd = { x: 1, y: 0 };

    if (k === " " || k === "p") {
      if (state !== "play") return;
      paused = !paused;
      if (pauseBtn) pauseBtn.textContent = paused ? "Resume" : "Pause";
      e.preventDefault();
      return;
    }

    // Start on any key/tap from start screen
    if (state === "start") {
      startPlay();
      e.preventDefault();
      return;
    }

    if (!nd) return;
    if (isOpposite(nd, dir)) return;
    nextDir = nd;
    e.preventDefault();
  }

  function onTouchStart(e) {
    const t = e.touches[0];
    if (!t) return;
    touchStart = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e) {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;

    // tap to start
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && state === "start") {
      startPlay();
      return;
    }

    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;
    const nd =
      ax > ay
        ? { x: dx > 0 ? 1 : -1, y: 0 }
        : { x: 0, y: dy > 0 ? 1 : -1 };

    if (state === "start") {
      startPlay();
    }
    if (isOpposite(nd, dir)) return;
    nextDir = nd;
  }

  function bind() {
    document.addEventListener("keydown", onKeyDown, { passive: false });

    if (startBtn) startBtn.addEventListener("click", startPlay);
    if (playAgainBtn) playAgainBtn.addEventListener("click", () => {
      setOverlay(gameOverOverlay, false);
      startPlay();
    });
    if (restartBtn) restartBtn.addEventListener("click", startPlay);

    if (pauseBtn)
      pauseBtn.addEventListener("click", () => {
        if (state !== "play") return;
        paused = !paused;
        pauseBtn.textContent = paused ? "Resume" : "Pause";
      });

    // Tap overlay/canvas to start on mobile
    if (startOverlay)
      startOverlay.addEventListener("click", () => {
        if (state === "start") startPlay();
      });

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpRgb(a, b, t) {
    return [
      Math.round(lerp(a[0], b[0], t)),
      Math.round(lerp(a[1], b[1], t)),
      Math.round(lerp(a[2], b[2], t)),
    ];
  }

  loadBest();
  reset("start");
  setOverlay(startOverlay, true);
  setOverlay(gameOverOverlay, false);
  bind();
  requestAnimationFrame(loop);
})();

