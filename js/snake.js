(() => {
  const root = document.querySelector("[data-snake]");
  if (!root) return;

  const canvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById("gameCanvas"));
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const finalScoreEl = document.getElementById("finalScore");
  const startOverlay = document.getElementById("startOverlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const startBtn = document.getElementById("startBtn");
  const playAgainBtn = document.getElementById("playAgainBtn");
  const restartBtn = document.getElementById("restartBtn");
  const pauseBtn = document.getElementById("pauseBtn");

  const GRID = 20;
  const BASE_TICK_MS = 110;
  const BG = "#FFFDF7";
  const GRID_LINE = "rgba(26,26,46,0.06)";
  const SNAKE = "rgba(77,121,255,0.92)";
  const SNAKE_HEAD = "rgba(196,77,255,0.95)";
  const FOOD = "rgba(255,107,157,0.95)";
  const FOOD_GLOW = "rgba(255,217,61,0.55)";

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
  let running = false;
  let paused = false;
  let lastStepAt = 0;

  const storageKey = "snake_best_v1";

  function loadBest() {
    const raw = localStorage.getItem(storageKey);
    const n = raw ? Number(raw) : 0;
    best = Number.isFinite(n) ? Math.max(0, n) : 0;
    if (bestEl) bestEl.textContent = String(best);
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
        return;
      }
    }
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const p = { x, y };
        if (!snake.some((s) => samePos(s, p))) {
          food = p;
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

  function reset() {
    const mid = Math.floor(GRID / 2);
    snake = [
      { x: mid - 1, y: mid },
      { x: mid, y: mid },
      { x: mid + 1, y: mid },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    setScore(0);
    placeFood();
    paused = false;
    if (pauseBtn) pauseBtn.textContent = "Pause";
    draw();
  }

  function start() {
    reset();
    running = true;
    lastStepAt = performance.now();
    setOverlay(startOverlay, false);
    setOverlay(gameOverOverlay, false);
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    paused = false;
    if (pauseBtn) pauseBtn.textContent = "Pause";
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    setOverlay(gameOverOverlay, true);

    if (score > best) {
      best = score;
      if (bestEl) bestEl.textContent = String(best);
      saveBest();
    }
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
      setScore(score + 1);
      placeFood();
    } else {
      snake.shift();
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

    // Clear
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center the board if canvas isn't exact
    const ox = Math.floor((canvas.width - w) / 2);
    const oy = Math.floor((canvas.height - h) / 2);

    ctx.save();
    ctx.translate(ox, oy);

    // Grid
    drawGrid(sz);

    // Food glow
    const fx = food.x * sz;
    const fy = food.y * sz;
    ctx.fillStyle = FOOD_GLOW;
    roundRect(fx + 2, fy + 2, sz - 4, sz - 4, 8);
    ctx.fill();

    // Food
    ctx.fillStyle = FOOD;
    roundRect(fx + 6, fy + 6, sz - 12, sz - 12, 7);
    ctx.fill();

    // Snake
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      const x = s.x * sz;
      const y = s.y * sz;
      const isHead = i === snake.length - 1;
      ctx.fillStyle = isHead ? SNAKE_HEAD : SNAKE;
      roundRect(x + 3, y + 3, sz - 6, sz - 6, 10);
      ctx.fill();
    }

    ctx.restore();
  }

  function loop(now) {
    if (!running) return;
    if (!paused) {
      const tickMs = Math.max(60, BASE_TICK_MS - Math.min(60, score * 2));
      if (now - lastStepAt >= tickMs) {
        lastStepAt = now;
        step();
        draw();
      }
    }
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
      if (!running) return;
      paused = !paused;
      if (pauseBtn) pauseBtn.textContent = paused ? "Resume" : "Pause";
      e.preventDefault();
      return;
    }

    if (k === "enter") {
      if (!running) start();
      return;
    }

    if (!nd) return;
    if (isOpposite(nd, dir)) return;
    nextDir = nd;
    e.preventDefault();
  }

  function bind() {
    document.addEventListener("keydown", onKeyDown, { passive: false });

    if (startBtn) startBtn.addEventListener("click", start);
    if (playAgainBtn) playAgainBtn.addEventListener("click", start);
    if (restartBtn) restartBtn.addEventListener("click", start);

    if (pauseBtn)
      pauseBtn.addEventListener("click", () => {
        if (!running) return;
        paused = !paused;
        pauseBtn.textContent = paused ? "Resume" : "Pause";
      });
  }

  loadBest();
  reset();
  setOverlay(startOverlay, true);
  setOverlay(gameOverOverlay, false);
  bind();
})();

