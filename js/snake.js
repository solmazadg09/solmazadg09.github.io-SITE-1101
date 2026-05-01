(() => {
  const root = document.querySelector("[data-snake]");
  if (!root) return;

  const canvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById("gameCanvas"));
  const ctx = canvas?.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const actionBtn = document.getElementById("actionBtn");
  if (!canvas || !ctx || !scoreEl || !bestEl || !actionBtn) return;

  const GRID = 20;
  const STEP_MS = 118;
  const DEMO_STEP_MS = 180;
  const storageKey = "snake_best_v2";

  function cellSize() {
    return canvas.width / GRID;
  }

  /** @type {"start" | "play" | "over"} */
  let state = "start";
  /** @type {{x:number,y:number}[]} */
  let snake = [];
  /** @type {{x:number,y:number}} */
  let dir = { x: 1, y: 0 };
  /** @type {{x:number,y:number}} */
  let nextDir = { x: 1, y: 0 };
  /** @type {{x:number,y:number}} */
  let food = { x: 8, y: 8 };
  let score = 0;
  let best = Number(localStorage.getItem(storageKey) || 0);
  let last = 0;
  let acc = 0;
  let touchStart = null;

  function updateStats() {
    scoreEl.textContent = `Score: ${score}`;
    bestEl.textContent = `Best: ${best}`;
  }

  function placeFood() {
    const empty = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (!snake.some((s) => s.x === x && s.y === y)) empty.push({ x, y });
      }
    }
    if (!empty.length) return;
    food = empty[Math.floor(Math.random() * empty.length)];
  }

  /** Safe spawn: horizontal snake centered on board, away from walls. */
  function resetGame() {
    const midY = Math.floor(GRID / 2);
    const midX = Math.floor(GRID / 2);
    const len = 4;
    const startX = midX - Math.floor((len - 1) / 2);
    snake = [];
    for (let i = 0; i < len; i++) snake.push({ x: startX + i, y: midY });
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    placeFood();
    updateStats();
  }

  function resetDemo() {
    snake = [
      { x: 4, y: 10 },
      { x: 5, y: 10 },
      { x: 6, y: 10 },
      { x: 7, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    placeFood();
  }

  function isOpposite(a, b) {
    return a.x === -b.x && a.y === -b.y;
  }

  function step(isDemo = false) {
    if (isDemo) {
      const h = snake[snake.length - 1];
      const m = 2;
      if (dir.x === 1 && h.x >= GRID - 1 - m) nextDir = { x: 0, y: 1 };
      else if (dir.y === 1 && h.y >= GRID - 1 - m) nextDir = { x: -1, y: 0 };
      else if (dir.x === -1 && h.x <= m) nextDir = { x: 0, y: -1 };
      else if (dir.y === -1 && h.y <= m) nextDir = { x: 1, y: 0 };
    }

    dir = nextDir;
    const head = snake[snake.length - 1];
    const next = { x: head.x + dir.x, y: head.y + dir.y };

    if (isDemo) {
      if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID) return;
    } else {
      if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID) {
        acc = 0;
        state = "over";
        actionBtn.textContent = "Play Again";
        if (score > best) {
          best = score;
          localStorage.setItem(storageKey, String(best));
        }
        updateStats();
        return;
      }
    }

    const willEat = next.x === food.x && next.y === food.y;
    const body = willEat ? snake : snake.slice(1);
    if (body.some((s) => s.x === next.x && s.y === next.y)) {
      if (isDemo) return;
      acc = 0;
      state = "over";
      actionBtn.textContent = "Play Again";
      if (score > best) {
        best = score;
        localStorage.setItem(storageKey, String(best));
      }
      updateStats();
      return;
    }

    snake.push(next);
    if (willEat) {
      if (!isDemo) score += 1;
      placeFood();
      updateStats();
    } else {
      snake.shift();
    }
  }

  function drawRoundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function rgbMix(c1, c2, t) {
    return `rgb(${Math.round(lerp(c1[0], c2[0], t))},${Math.round(lerp(c1[1], c2[1], t))},${Math.round(
      lerp(c1[2], c2[2], t)
    )})`;
  }

  function drawBoard() {
    const cell = cellSize();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#F0F0F0";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      const p = i * cell + 0.5;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(canvas.width, p);
      ctx.stroke();
    }

    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FFD93D";
    ctx.fillStyle = "#FFD93D";
    ctx.beginPath();
    ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const tail = [77, 121, 255];
    const body = [196, 77, 255];
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      const t = snake.length <= 1 ? 0 : i / (snake.length - 1);
      ctx.fillStyle = i === snake.length - 1 ? "#FF6B9D" : rgbMix(body, tail, 1 - t);
      drawRoundedRect(s.x * cell + 2, s.y * cell + 2, cell - 4, cell - 4, 4);
      ctx.fill();
    }
  }

  function drawStartScreen() {
    drawBoard();
    const cx = canvas.width / 2;
    const grad = ctx.createLinearGradient(cx - 110, 120, cx + 110, 120);
    grad.addColorStop(0, "#FF6B9D");
    grad.addColorStop(0.5, "#C44DFF");
    grad.addColorStop(1, "#4D79FF");
    ctx.fillStyle = grad;
    ctx.font = "bold 44px Raleway, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🐍 Snake", cx, 130);
    ctx.fillStyle = "#777";
    ctx.font = "16px Lato, sans-serif";
    ctx.fillText("Press any key or tap to start", cx, 165);
  }

  function drawGameOver() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(cx - 120, cy - 40, cx + 120, cy - 40);
    grad.addColorStop(0, "#FF6B9D");
    grad.addColorStop(0.5, "#C44DFF");
    grad.addColorStop(1, "#4D79FF");
    ctx.fillStyle = grad;
    ctx.font = "bold 36px Raleway, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", cx, cy - 20);
    ctx.fillStyle = "#1A1A2E";
    ctx.font = "20px Lato, sans-serif";
    ctx.fillText(`Score: ${score}`, cx, cy + 20);
  }

  function loop(now) {
    if (!last) last = now;
    const dt = Math.min(34, now - last);
    last = now;
    acc += dt;

    if (state === "start") {
      while (acc >= DEMO_STEP_MS) {
        acc -= DEMO_STEP_MS;
        step(true);
      }
      drawStartScreen();
    } else if (state === "play") {
      while (acc >= STEP_MS) {
        acc -= STEP_MS;
        step(false);
      }
      drawBoard();
    } else {
      drawBoard();
      drawGameOver();
    }

    requestAnimationFrame(loop);
  }

  function startGame() {
    acc = 0;
    last = performance.now();
    state = "play";
    actionBtn.textContent = "Restart";
    resetGame();
  }

  function setDirectionByKey(key) {
    let nd = null;
    if (key === "arrowup" || key === "w") nd = { x: 0, y: -1 };
    if (key === "arrowdown" || key === "s") nd = { x: 0, y: 1 };
    if (key === "arrowleft" || key === "a") nd = { x: -1, y: 0 };
    if (key === "arrowright" || key === "d") nd = { x: 1, y: 0 };
    if (!nd || isOpposite(nd, dir)) return;
    nextDir = nd;
  }

  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    const isMoveKey = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k);
    if (isMoveKey || k === " ") e.preventDefault();

    if (state === "start") {
      startGame();
      if (isMoveKey) setDirectionByKey(k);
      return;
    }
    if (state === "over") {
      startGame();
      if (isMoveKey) setDirectionByKey(k);
      return;
    }
    setDirectionByKey(k);
  });

  actionBtn.addEventListener("click", startGame);
  canvas.addEventListener("click", () => {
    if (state !== "play") startGame();
  });

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const t = e.touches[0];
    if (!t) return;
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (!t || !touchStart) return;
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;

    if (state !== "play") {
      startGame();
      return;
    }

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    const nd = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "arrowright" : "arrowleft") : dy > 0 ? "arrowdown" : "arrowup";
    setDirectionByKey(nd);
  }, { passive: false });

  updateStats();
  resetDemo();
  requestAnimationFrame(loop);
})();

