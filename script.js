const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hudScenario = document.getElementById("hudScenario");
const hudPhase = document.getElementById("hudPhase");
const hudHealth = document.getElementById("hudHealth");
const hudScore = document.getElementById("hudScore");

const panelTitle = document.getElementById("panelTitle");
const panelText = document.getElementById("panelText");
const controlsText = document.getElementById("controlsText");
const contextButtons = document.getElementById("contextButtons");

const btnRandom = document.getElementById("btnRandom");
const btnChoose = document.getElementById("btnChoose");
const btnRestart = document.getElementById("btnRestart");
const choiceContainer = document.getElementById("choiceContainer");
const choicesEl = document.getElementById("choices");

const W = canvas.width;
const H = canvas.height;

const scenarios = {
  cut: {
    name: "Cut in the Skin",
    pathogen: "Bacteria",
    intro: "A skin wound opens the barrier. Platelets must seal the breach before bacteria flood into the tissue.",
    controls: "Drag golden platelets into the wound slots to close the opening.",
    color: "#ffb46b"
  },
  respiratory: {
    name: "Respiratory Infection",
    pathogen: "Virus",
    intro: "Microbes enter the airway. Use mucus to trap them and trigger a cough to expel them.",
    controls: "Drag the mucus trap over microbes, then press Cough when several are trapped.",
    color: "#7acbff"
  },
  digestive: {
    name: "Foodborne Infection",
    pathogen: "Bacteria",
    intro: "Pathogens slip into the digestive tract. Use stomach acid bursts to weaken them before they spread.",
    controls: "Click near pathogens to create acid bursts and eliminate them.",
    color: "#95ffb4"
  }
};

const state = {
  screen: "menu",
  phase: "menu",
  scenarioKey: null,
  health: 100,
  score: 0,
  memoryCells: false,
  barrierResult: 0,
  particles: [],
  microbes: [],
  platelets: [],
  woundSlots: [],
  mucusTrap: { x: 180, y: 240, w: 160, h: 95, dragging: false, ox: 0, oy: 0 },
  coughCooldown: 0,
  phagocyte: { x: W / 2, y: H / 2, r: 28 },
  antibodies: [],
  adaptiveTargets: [],
  selectedTarget: null,
  adaptiveNeutralized: 0,
  tick: 0,
  mouse: { x: W / 2, y: H / 2, down: false }
};

function resetRun() {
  state.screen = "menu";
  state.phase = "menu";
  state.scenarioKey = null;
  state.health = 100;
  state.score = 0;
  state.memoryCells = false;
  state.barrierResult = 0;
  state.particles = [];
  state.microbes = [];
  state.platelets = [];
  state.woundSlots = [];
  state.antibodies = [];
  state.adaptiveTargets = [];
  state.selectedTarget = null;
  state.adaptiveNeutralized = 0;
  state.coughCooldown = 0;
  state.phagocyte = { x: W / 2, y: H / 2, r: 28 };
  updateHUD();
  showMenuPanel();
}

function updateHUD() {
  hudScenario.textContent = state.scenarioKey ? scenarios[state.scenarioKey].name : "—";
  hudPhase.textContent = phaseLabel(state.phase);
  hudHealth.textContent = Math.max(0, Math.round(state.health));
  hudScore.textContent = Math.round(state.score);
}

function phaseLabel(phase) {
  if (phase === "menu") return "Start";
  if (phase === "barrier") return "Barrier";
  if (phase === "innate") return "Innate";
  if (phase === "adaptive") return "Adaptive";
  if (phase === "summary") return "Summary";
  return phase;
}

function showMenuPanel() {
  panelTitle.textContent = "Welcome, Defender";
  panelText.textContent =
    "Start a random infection or choose a specific scenario. Each run begins at a different body barrier and then moves into innate and adaptive immunity.";
  controlsText.textContent =
    "Mouse to interact. In the phagocyte phase, move the cursor to guide the macrophage.";
  choiceContainer.style.display = "none";
  contextButtons.innerHTML = "";
  btnRandom.style.display = "";
  btnChoose.style.display = "";
  btnRestart.style.display = "none";
}

function showScenarioChoices() {
  choiceContainer.style.display = "";
  choicesEl.innerHTML = "";

  Object.entries(scenarios).forEach(([key, sc]) => {
    const div = document.createElement("div");
    div.className = "choice-card";
    div.innerHTML = `
      <div class="choice-title">${sc.name}</div>
      <div class="muted">${sc.intro}</div>
    `;
    div.onclick = () => startScenario(key);
    choicesEl.appendChild(div);
  });
}

btnRandom.onclick = () => {
  const keys = Object.keys(scenarios);
  const key = keys[Math.floor(Math.random() * keys.length)];
  startScenario(key);
};

btnChoose.onclick = () => {
  showScenarioChoices();
  panelTitle.textContent = "Choose a starting infection";
  panelText.textContent =
    "Pick the type of body entry you want to defend. Each one changes the first mini-game and what the body does first.";
};

btnRestart.onclick = () => {
  resetRun();
};

function startScenario(key) {
  resetRun();
  state.scenarioKey = key;
  state.screen = "game";
  startBarrierPhase();
}

function startBarrierPhase() {
  state.phase = "barrier";
  state.particles = [];
  state.microbes = [];
  state.platelets = [];
  state.woundSlots = [];
  state.selectedTarget = null;
  state.adaptiveTargets = [];
  state.antibodies = [];
  state.adaptiveNeutralized = 0;

  const sc = scenarios[state.scenarioKey];

  panelTitle.textContent = sc.name;
  panelText.textContent = sc.intro;
  controlsText.textContent = sc.controls;
  contextButtons.innerHTML = "";
  choiceContainer.style.display = "none";
  btnRandom.style.display = "none";
  btnChoose.style.display = "none";
  btnRestart.style.display = "";

  if (state.scenarioKey === "cut") {
    for (let i = 0; i < 8; i++) {
      state.microbes.push(makeMicrobe(120 + Math.random() * 620, 40 + Math.random() * 70, "bacteria"));
    }

    for (let i = 0; i < 6; i++) {
      state.platelets.push({
        x: 130 + i * 100,
        y: 560 + (i % 2) * 20,
        r: 16,
        dragging: false,
        placed: false
      });
    }

    for (let i = 0; i < 5; i++) {
      state.woundSlots.push({
        x: 300 + i * 48,
        y: 205 + (i % 2) * 8,
        filled: false
      });
    }
  }

  if (state.scenarioKey === "respiratory") {
    for (let i = 0; i < 14; i++) {
      const m = makeMicrobe(80 + Math.random() * 700, 120 + Math.random() * 280, "virus");
      m.vx = (Math.random() * 2 - 1) * 0.7;
      m.vy = 0.2 + Math.random() * 0.6;
      m.trapped = false;
      state.microbes.push(m);
    }

    contextButtons.innerHTML = `<button class="yellow" id="coughBtn">Cough</button>`;
    document.getElementById("coughBtn").onclick = performCough;
  }

  if (state.scenarioKey === "digestive") {
    for (let i = 0; i < 12; i++) {
      const m = makeMicrobe(100 + Math.random() * 660, 140 + Math.random() * 300, "bacteria");
      m.vx = (Math.random() * 2 - 1) * 0.8;
      m.vy = (Math.random() * 2 - 1) * 0.8;
      state.microbes.push(m);
    }
  }

  updateHUD();
}

function startInnatePhase() {
  state.phase = "innate";
  state.particles = [];
  state.microbes = [];
  state.selectedTarget = null;

  const survivors = Math.max(5, state.barrierResult);
  const type = scenarios[state.scenarioKey].pathogen.toLowerCase() === "virus" ? "virus" : "bacteria";

  for (let i = 0; i < survivors; i++) {
    const m = makeMicrobe(90 + Math.random() * 680, 110 + Math.random() * 370, type);
    m.vx = (Math.random() * 2 - 1) * 1.6;
    m.vy = (Math.random() * 2 - 1) * 1.6;
    m.r = type === "virus" ? 12 : 14;
    state.microbes.push(m);
  }

  panelTitle.textContent = "Innate Immune Response";
  panelText.textContent =
    "Inflammation recruits phagocytes into the tissue. Guide the macrophage to engulf pathogens before they spread.";
  controlsText.textContent =
    "Move your mouse to steer the phagocyte. Touch pathogens to engulf them.";
  contextButtons.innerHTML = `<button class="green" id="reinforceBtn">Release Cytokine Burst</button>`;

  document.getElementById("reinforceBtn").onclick = () => {
    if (state.phase !== "innate") return;
    state.score += 30;
    emitBurst(state.phagocyte.x, state.phagocyte.y, "#6de9ff", 22, 5);
    state.microbes.forEach((m) => {
      m.vx *= 0.82;
      m.vy *= 0.82;
    });
  };

  updateHUD();
}

function startAdaptivePhase() {
  state.phase = "adaptive";
  state.particles = [];
  state.microbes = [];
  state.selectedTarget = null;
  state.adaptiveNeutralized = 0;

  state.antibodies = [
    { x: 170, y: 520, size: 46, shape: "circle", label: "Round antibody" },
    { x: 430, y: 520, size: 46, shape: "triangle", label: "Tri antibody" },
    { x: 690, y: 520, size: 46, shape: "square", label: "Square antibody" }
  ];

  const shapes = ["circle", "triangle", "square"];
  for (let i = 0; i < 8; i++) {
    state.adaptiveTargets.push({
      x: 110 + (i % 4) * 180,
      y: 150 + Math.floor(i / 4) * 150,
      r: 28,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      neutralized: false
    });
  }

  panelTitle.textContent = "Adaptive Immunity";
  panelText.textContent =
    "B cells produce antibodies that match specific antigens. Click a pathogen, then click the correct antibody shape to neutralize it.";
  controlsText.textContent =
    "1) Click a pathogen target. 2) Click the matching antibody card below.";
  contextButtons.innerHTML = `<button class="secondary" id="hintBtn">Show Hint</button>`;

  document.getElementById("hintBtn").onclick = () => {
    if (state.phase !== "adaptive") return;
    state.score -= 10;
    emitFloatingText("Match shapes: ○ △ □", W / 2, 90, "#ffd76b");
  };

  updateHUD();
}

function finishRun() {
  state.phase = "summary";
  state.memoryCells = true;
  updateHUD();

  const grade =
    state.health >= 85
      ? "Excellent immune defense"
      : state.health >= 65
      ? "Good defense with some tissue stress"
      : state.health >= 40
      ? "The body survived, but the infection caused damage"
      : "Severe infection — defense was late";

  panelTitle.textContent = "Run Complete";
  panelText.innerHTML = `
    ${grade}.<br><br>
    <strong>Final Health:</strong> ${Math.round(state.health)}<br>
    <strong>Final Score:</strong> ${Math.round(state.score)}<br>
    <strong>Memory Cells Formed:</strong> Yes
  `;
  controlsText.textContent = "Press Restart to play again with a new infection route.";
  contextButtons.innerHTML = `<button class="green" id="playAgainBtn">Play Random Again</button>`;

  document.getElementById("playAgainBtn").onclick = () => {
    const keys = Object.keys(scenarios);
    startScenario(keys[Math.floor(Math.random() * keys.length)]);
  };
}

function makeMicrobe(x, y, type) {
  return {
    x,
    y,
    r: type === "virus" ? 11 : 14,
    type,
    vx: (Math.random() * 2 - 1) * 1.2,
    vy: (Math.random() * 2 - 1) * 1.2,
    alive: true,
    trapped: false,
    tagged: false
  };
}

function emitBurst(x, y, color, count = 12, speed = 3) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * speed + 1;
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 30 + Math.random() * 18,
      color,
      size: 2 + Math.random() * 3
    });
  }
}

function emitFloatingText(text, x, y, color) {
  state.particles.push({
    text,
    x,
    y,
    vx: 0,
    vy: -0.5,
    life: 80,
    color,
    size: 16,
    floating: true
  });
}

function performCough() {
  if (state.phase !== "barrier" || state.scenarioKey !== "respiratory" || state.coughCooldown > 0) return;

  state.coughCooldown = 50;
  let cleared = 0;

  for (const m of state.microbes) {
    if (m.alive && m.trapped) {
      m.alive = false;
      cleared++;
      emitBurst(m.x, m.y, "#ffd76b", 10, 5);
    }
  }

  state.score += cleared * 18;
  emitFloatingText(`Cough cleared ${cleared}`, 210, 100, "#ffd76b");
}

function completeBarrierPhase() {
  const survivors = state.microbes.filter((m) => m.alive).length;
  state.barrierResult = survivors;
  state.score += Math.max(0, 100 - survivors * 7);
  state.health -= survivors * 2.2;
  startInnatePhase();
}

function completeInnatePhase() {
  state.score += 100;
  startAdaptivePhase();
}

function completeAdaptivePhase() {
  state.score += 120;
  finishRun();
}

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  state.mouse.x = x;
  state.mouse.y = y;
  state.mouse.down = true;

  if (state.phase === "barrier") {
    if (state.scenarioKey === "cut") {
      for (const p of state.platelets) {
        if (!p.placed && Math.hypot(x - p.x, y - p.y) <= p.r + 6) {
          p.dragging = true;
        }
      }
    } else if (state.scenarioKey === "respiratory") {
      if (pointInRect(x, y, state.mucusTrap)) {
        state.mucusTrap.dragging = true;
        state.mucusTrap.ox = x - state.mucusTrap.x;
        state.mucusTrap.oy = y - state.mucusTrap.y;
      }
    } else if (state.scenarioKey === "digestive") {
      for (let i = 0; i < 3; i++) {
        const ax = x + (Math.random() * 24 - 12);
        const ay = y + (Math.random() * 24 - 12);
        emitBurst(ax, ay, "#ffd76b", 16, 4);
      }

      for (const m of state.microbes) {
        if (m.alive && Math.hypot(m.x - x, m.y - y) < 48) {
          m.alive = false;
          state.score += 18;
          emitBurst(m.x, m.y, "#ffd76b", 12, 4.5);
        }
      }
    }
  }

  if (state.phase === "adaptive") {
    let clickedTarget = false;

    for (const t of state.adaptiveTargets) {
      if (!t.neutralized && Math.hypot(x - t.x, y - t.y) < t.r + 8) {
        state.selectedTarget = t;
        clickedTarget = true;
        emitBurst(t.x, t.y, "#6ba9ff", 8, 2.5);
      }
    }

    if (!clickedTarget) {
      for (const ab of state.antibodies) {
        if (Math.hypot(x - ab.x, y - ab.y) < ab.size) {
          if (state.selectedTarget) {
            if (ab.shape === state.selectedTarget.shape) {
              state.selectedTarget.neutralized = true;
              state.adaptiveNeutralized++;
              state.score += 25;
              emitBurst(state.selectedTarget.x, state.selectedTarget.y, "#6dffb2", 18, 5);
              emitFloatingText("Neutralized", state.selectedTarget.x, state.selectedTarget.y - 24, "#6dffb2");
              state.selectedTarget = null;
            } else {
              state.health -= 4;
              state.score -= 8;
              emitFloatingText("Wrong match", x, y - 18, "#ff7171");
            }
          }
        }
      }
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  state.mouse.x = x;
  state.mouse.y = y;

  if (state.phase === "barrier") {
    if (state.scenarioKey === "cut") {
      for (const p of state.platelets) {
        if (p.dragging) {
          p.x = x;
          p.y = y;
        }
      }
    } else if (state.scenarioKey === "respiratory" && state.mucusTrap.dragging) {
      state.mucusTrap.x = Math.max(40, Math.min(W - state.mucusTrap.w - 40, x - state.mucusTrap.ox));
      state.mucusTrap.y = Math.max(90, Math.min(H - 170, y - state.mucusTrap.oy));
    }
  }
});

canvas.addEventListener("mouseup", () => {
  state.mouse.down = false;

  if (state.phase === "barrier" && state.scenarioKey === "cut") {
    for (const p of state.platelets) {
      if (p.dragging) {
        p.dragging = false;
        let snapped = false;

        for (const s of state.woundSlots) {
          if (!s.filled && Math.hypot(p.x - s.x, p.y - s.y) < 34) {
            p.x = s.x;
            p.y = s.y;
            p.placed = true;
            s.filled = true;
            state.score += 15;
            emitBurst(s.x, s.y, "#ffd76b", 12, 2);
            snapped = true;
            break;
          }
        }

        if (!snapped) {
          p.x = 120 + Math.random() * 600;
          p.y = 540 + Math.random() * 40;
        }
      }
    }
  }

  if (state.scenarioKey === "respiratory") {
    state.mucusTrap.dragging = false;
  }
});

function updateParticles() {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx || 0;
    p.y += p.vy || 0;
    p.life--;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function updateBarrier() {
  if (state.scenarioKey === "cut") {
    const sealed = state.woundSlots.filter((s) => s.filled).length;

    for (const m of state.microbes) {
      if (!m.alive) continue;

      const barrierStrength = 1 + sealed * 0.18;
      m.y += 0.28 + Math.random() * 0.16;
      m.x += Math.sin((state.tick + m.x) * 0.01) * 0.6;

      if (m.y > 230 - sealed * 8) {
        if (sealed >= 5 && Math.random() < 0.25) {
          m.alive = false;
          state.score += 12;
          emitBurst(m.x, m.y, "#ffd76b", 10, 3);
        }
      }

      if (m.y > H - 40) {
        m.alive = false;
        state.health -= 6 / barrierStrength;
        emitFloatingText("Breach!", m.x, H - 40, "#ff7171");
      }
    }

    if (sealed >= 5 || state.tick > 950) {
      completeBarrierPhase();
    }
  }

  if (state.scenarioKey === "respiratory") {
    state.coughCooldown = Math.max(0, state.coughCooldown - 1);
    const trap = state.mucusTrap;

    for (const m of state.microbes) {
      if (!m.alive) continue;

      const inside =
        m.x > trap.x &&
        m.x < trap.x + trap.w &&
        m.y > trap.y &&
        m.y < trap.y + trap.h;

      if (inside) {
        m.trapped = true;
        m.vx *= 0.92;
        m.vy *= 0.82;
        m.y -= 0.8;
      } else {
        m.trapped = false;
        m.x += m.vx;
        m.y += m.vy;
        if (m.x < 50 || m.x > W - 50) m.vx *= -1;
      }

      if (m.y > 500) {
        m.alive = false;
        state.health -= 5;
        emitFloatingText("Deep infection", m.x, m.y, "#ff7171");
      }
    }

    if (state.microbes.filter((m) => m.alive).length <= 4 || state.tick > 1100) {
      completeBarrierPhase();
    }
  }

  if (state.scenarioKey === "digestive") {
    for (const m of state.microbes) {
      if (!m.alive) continue;

      m.x += m.vx;
      m.y += m.vy + Math.sin((state.tick + m.x) * 0.03) * 0.35;

      if (m.x < 70 || m.x > W - 70) m.vx *= -1;
      if (m.y < 120 || m.y > 470) m.vy *= -1;

      if (state.tick % 120 === 0 && Math.random() < 0.38) {
        state.health -= 2;
      }
    }

    if (state.microbes.filter((m) => m.alive).length <= 4 || state.tick > 900) {
      completeBarrierPhase();
    }
  }
}

function updateInnate() {
  const ph = state.phagocyte;
  ph.x += (state.mouse.x - ph.x) * 0.12;
  ph.y += (state.mouse.y - ph.y) * 0.12;

  for (const m of state.microbes) {
    if (!m.alive) continue;

    m.x += m.vx;
    m.y += m.vy;
    if (m.x < 40 || m.x > W - 40) m.vx *= -1;
    if (m.y < 60 || m.y > H - 100) m.vy *= -1;

    if (Math.hypot(m.x - ph.x, m.y - ph.y) < ph.r + m.r) {
      m.alive = false;
      state.score += 20;
      emitBurst(m.x, m.y, "#6de9ff", 16, 4.5);
      emitFloatingText("Phagocytosed", m.x, m.y - 18, "#6de9ff");
    }
  }

  if (state.tick % 100 === 0) {
    state.health -= Math.max(0, state.microbes.filter((m) => m.alive).length - 2) * 1.5;
  }

  if (state.microbes.filter((m) => m.alive).length === 0) {
    completeInnatePhase();
  }
}

function updateAdaptive() {
  if (state.adaptiveNeutralized >= state.adaptiveTargets.length) {
    completeAdaptivePhase();
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, W, H);

  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, "rgba(255,255,255,0.02)");
  grd.addColorStop(1, "rgba(255,255,255,0.01)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 35; i++) {
    const x = (i * 91 + state.tick * 0.15) % (W + 80) - 40;
    const y = (i * 67) % H;
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMicrobe(m) {
  if (!m.alive) return;

  ctx.save();
  ctx.translate(m.x, m.y);

  if (m.type === "virus") {
    ctx.strokeStyle = "#ff84bf";
    ctx.fillStyle = "rgba(255,132,191,.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, m.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10;
      const sx = Math.cos(a) * (m.r + 1);
      const sy = Math.sin(a) * (m.r + 1);
      const ex = Math.cos(a) * (m.r + 8);
      const ey = Math.sin(a) * (m.r + 8);

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "#ff84bf";
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "rgba(255,113,113,.18)";
    ctx.strokeStyle = "#ff7171";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, m.r + 4, m.r, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + state.tick * 0.02;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
      ctx.lineTo(Math.cos(a) * (m.r + 7), Math.sin(a) * (m.r + 7));
      ctx.stroke();
    }
  }

  if (m.trapped) {
    ctx.strokeStyle = "#ffd76b";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, m.r + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawParticles() {
  for (const p of state.particles) {
    if (p.floating) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / 80);
      ctx.fillStyle = p.color;
      ctx.font = "700 16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / 45);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function roundRect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = context.measureText(testLine);

    if (metrics.width > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  context.fillText(line, x, y);
}

function drawBanner(text, color) {
  ctx.save();
  roundRect(ctx, 24, 18, 260, 42, 16);
  ctx.fillStyle = "rgba(255,255,255,.05)";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "700 16px Inter, sans-serif";
  ctx.fillText(text, 40, 46);
  ctx.restore();
}

function drawShape(shape, x, y, size, fill = false) {
  ctx.beginPath();

  if (shape === "circle") {
    ctx.arc(x, y, size, 0, Math.PI * 2);
  } else if (shape === "triangle") {
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
  } else if (shape === "square") {
    ctx.rect(x - size, y - size, size * 2, size * 2);
  }

  if (fill) ctx.fill();
  else ctx.stroke();
}

function drawMenu() {
  drawBackground();

  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ecf9ff";
  ctx.font = "800 42px Inter, sans-serif";
  ctx.fillText("Immune Defense Simulator", W / 2, 165);
  ctx.font = "500 20px Inter, sans-serif";
  ctx.fillStyle = "rgba(236,249,255,.8)";
  ctx.fillText("Randomized infection starts • barrier defense • phagocytes • antibodies", W / 2, 205);
  ctx.restore();

  const cards = [
    { x: 110, y: 280, w: 190, h: 170, title: "Cut", color: "#ffb46b", text: "Seal a wound with platelets." },
    { x: 335, y: 280, w: 190, h: 170, title: "Respiratory", color: "#7acbff", text: "Trap pathogens in mucus and cough them out." },
    { x: 560, y: 280, w: 190, h: 170, title: "Digestive", color: "#95ffb4", text: "Use stomach acid bursts to weaken invaders." }
  ];

  cards.forEach((card) => {
    ctx.save();
    roundRect(ctx, card.x, card.y, card.w, card.h, 22);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.strokeStyle = card.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = card.color;
    ctx.beginPath();
    ctx.arc(card.x + 34, card.y + 36, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f0f9ff";
    ctx.font = "800 24px Inter, sans-serif";
    ctx.fillText(card.title, card.x + 34, card.y + 78);

    ctx.fillStyle = "rgba(240,249,255,.78)";
    ctx.font = "500 15px Inter, sans-serif";
    wrapText(ctx, card.text, card.x + 20, card.y + 105, card.w - 40, 22);
    ctx.restore();
  });

  drawParticles();
}

function drawSkinScene() {
  ctx.save();

  ctx.fillStyle = "rgba(255,213,166,.12)";
  ctx.fillRect(70, 120, W - 140, 360);

  ctx.fillStyle = "rgba(255,190,130,.18)";
  ctx.fillRect(70, 180, W - 140, 210);

  ctx.fillStyle = "rgba(255,110,110,.22)";
  ctx.fillRect(70, 390, W - 140, 90);

  const woundX = 285;
  const woundY = 150;
  const woundW = 260;
  const woundH = 110;

  ctx.clearRect(woundX, woundY, woundW, woundH);
  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.fillRect(woundX, woundY, woundW, woundH);

  ctx.strokeStyle = "#ff8e8e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(woundX, woundY);
  ctx.lineTo(woundX + woundW, woundY + woundH);
  ctx.moveTo(woundX + woundW, woundY);
  ctx.lineTo(woundX, woundY + woundH);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,240,200,.9)";
  ctx.font = "700 18px Inter, sans-serif";
  ctx.fillText("Skin breach", woundX + 70, woundY - 18);

  for (const s of state.woundSlots) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = s.filled ? "rgba(255,215,107,.95)" : "rgba(255,255,255,.12)";
    ctx.fill();
    ctx.strokeStyle = s.filled ? "#ffe39d" : "rgba(255,255,255,.2)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (const p of state.platelets) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.placed ? "#ffd76b" : "rgba(255,215,107,.82)";
    ctx.fill();
    ctx.strokeStyle = "#fff0bf";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (const m of state.microbes) {
    drawMicrobe(m);
  }

  const sealed = state.woundSlots.filter((s) => s.filled).length;
  drawBanner(`Platelets placed: ${sealed}/5`, "#ffd76b");
  ctx.restore();
}

function drawAirwayScene() {
  ctx.save();

  const airway = ctx.createLinearGradient(120, 80, 120, 560);
  airway.addColorStop(0, "rgba(94,173,255,.18)");
  airway.addColorStop(1, "rgba(109,255,178,.08)");
  ctx.fillStyle = airway;

  ctx.beginPath();
  ctx.moveTo(180, 70);
  ctx.quadraticCurveTo(430, 20, 680, 70);
  ctx.lineTo(760, 530);
  ctx.quadraticCurveTo(430, 615, 100, 530);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(125,222,255,.3)";
  ctx.lineWidth = 6;
  ctx.stroke();

  for (let i = 0; i < 26; i++) {
    const x = 135 + i * 28;
    const h = 12 + Math.sin((state.tick * 0.12) + i) * 7;
    ctx.strokeStyle = "rgba(109,255,178,.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 495);
    ctx.lineTo(x + 6, 495 - h);
    ctx.stroke();
  }

  const trap = state.mucusTrap;
  ctx.save();
  ctx.globalAlpha = 0.78;
  roundRect(ctx, trap.x, trap.y, trap.w, trap.h, 34);
  const mg = ctx.createLinearGradient(trap.x, trap.y, trap.x, trap.y + trap.h);
  mg.addColorStop(0, "rgba(255,215,107,.52)");
  mg.addColorStop(1, "rgba(255,215,107,.18)");
  ctx.fillStyle = mg;
  ctx.fill();
  ctx.strokeStyle = "#ffd76b";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  for (const m of state.microbes) {
    drawMicrobe(m);
  }

  drawBanner(state.coughCooldown > 0 ? "Cough cooling down..." : "Trap microbes, then cough", "#ffd76b");
  ctx.restore();
}

function drawDigestiveScene() {
  ctx.save();

  ctx.strokeStyle = "rgba(149,255,180,.45)";
  ctx.lineWidth = 34;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(170, 100);
  ctx.bezierCurveTo(95, 190, 120, 300, 250, 340);
  ctx.bezierCurveTo(420, 390, 700, 300, 670, 150);
  ctx.bezierCurveTo(655, 80, 550, 65, 500, 110);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,215,107,.12)";
  ctx.lineWidth = 60;
  ctx.beginPath();
  ctx.moveTo(170, 100);
  ctx.bezierCurveTo(95, 190, 120, 300, 250, 340);
  ctx.bezierCurveTo(420, 390, 700, 300, 670, 150);
  ctx.bezierCurveTo(655, 80, 550, 65, 500, 110);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,215,107,.8)";
  ctx.font = "700 20px Inter, sans-serif";
  ctx.fillText("Click to release stomach acid", 240, 78);

  for (const m of state.microbes) {
    drawMicrobe(m);
  }

  drawBanner("Acid burst zone active", "#ffd76b");
  ctx.restore();
}

function drawBarrierScene() {
  drawBackground();

  if (state.scenarioKey === "cut") drawSkinScene();
  if (state.scenarioKey === "respiratory") drawAirwayScene();
  if (state.scenarioKey === "digestive") drawDigestiveScene();

  drawParticles();
}

function drawInnateScene() {
  drawBackground();

  ctx.save();

  for (let i = 0; i < 5; i++) {
    const y = 100 + i * 95 + Math.sin(state.tick * 0.02 + i) * 6;
    ctx.strokeStyle = "rgba(255,113,113,.11)";
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.bezierCurveTo(190, y - 50, 310, y + 50, 470, y);
    ctx.bezierCurveTo(610, y - 35, 720, y + 35, 820, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,240,240,.7)";
  ctx.font = "700 19px Inter, sans-serif";
  ctx.fillText("Inflamed tissue", 76, 66);

  for (const m of state.microbes) {
    drawMicrobe(m);
  }

  const ph = state.phagocyte;
  ctx.save();
  ctx.translate(ph.x, ph.y);
  ctx.fillStyle = "rgba(109,233,255,.22)";
  ctx.beginPath();
  ctx.arc(0, 0, ph.r + Math.sin(state.tick * 0.12) * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#6de9ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, ph.r, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + state.tick * 0.03;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (ph.r - 4), Math.sin(a) * (ph.r - 4));
    ctx.lineTo(Math.cos(a) * (ph.r + 12), Math.sin(a) * (ph.r + 12));
    ctx.stroke();
  }

  ctx.fillStyle = "#dffaff";
  ctx.beginPath();
  ctx.arc(-7, -5, 4, 0, Math.PI * 2);
  ctx.arc(8, 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawBanner(`Pathogens left: ${state.microbes.filter((m) => m.alive).length}`, "#6de9ff");
  drawParticles();
  ctx.restore();
}

function drawAdaptiveScene() {
  drawBackground();

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.05)";
  roundRect(ctx, 60, 110, W - 120, 280, 26);
  ctx.fill();
  ctx.strokeStyle = "rgba(109,233,255,.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(240,249,255,.8)";
  ctx.font = "700 18px Inter, sans-serif";
  ctx.fillText("Select a pathogen, then choose the matching antibody", 90, 92);

  for (const t of state.adaptiveTargets) {
    ctx.save();
    ctx.translate(t.x, t.y);

    const selected = state.selectedTarget === t;
    ctx.strokeStyle = t.neutralized ? "#6dffb2" : selected ? "#ffd76b" : "#6ba9ff";
    ctx.fillStyle = t.neutralized ? "rgba(109,255,178,.15)" : "rgba(107,169,255,.1)";
    ctx.lineWidth = selected ? 4 : 2.5;

    ctx.beginPath();
    ctx.arc(0, 0, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = t.neutralized ? "#6dffb2" : "#ecf9ff";
    drawShape(t.shape, 0, 0, 14, true);
    ctx.restore();
  }

  for (const ab of state.antibodies) {
    ctx.save();
    ctx.translate(ab.x, ab.y);

    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.strokeStyle = "#6dffb2";
    ctx.lineWidth = 2.5;
    roundRect(ctx, -70, -50, 140, 100, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ecf9ff";
    drawShape(ab.shape, 0, -10, 18, true);
    ctx.font = "700 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(ab.label, 0, 28);
    ctx.restore();
  }

  drawBanner(`Neutralized: ${state.adaptiveNeutralized}/${state.adaptiveTargets.length}`, "#6dffb2");
  drawParticles();
  ctx.restore();
}

function drawSummaryScene() {
  drawBackground();

  ctx.save();
  roundRect(ctx, 120, 120, W - 240, H - 240, 30);
  ctx.fillStyle = "rgba(255,255,255,.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(109,255,178,.4)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#f0fbff";
  ctx.font = "800 40px Inter, sans-serif";
  ctx.fillText("Infection Cleared", W / 2, 190);

  ctx.font = "600 22px Inter, sans-serif";
  ctx.fillStyle = "rgba(240,251,255,.82)";
  ctx.fillText(`Scenario: ${scenarios[state.scenarioKey].name}`, W / 2, 240);

  const stats = [
    `Final Health: ${Math.round(state.health)}`,
    `Score: ${Math.round(state.score)}`,
    `Memory Cells Created: Yes`,
    `Future reinfection would be faster to clear`
  ];

  ctx.font = "700 21px Inter, sans-serif";
  stats.forEach((line, i) => {
    ctx.fillStyle = i < 2 ? "#ffd76b" : "#6dffb2";
    ctx.fillText(line, W / 2, 320 + i * 56);
  });

  ctx.restore();
  drawParticles();
}

function update() {
  state.tick++;
  updateParticles();

  if (state.phase === "barrier") updateBarrier();
  if (state.phase === "innate") updateInnate();
  if (state.phase === "adaptive") updateAdaptive();

  updateHUD();

  if (state.health <= 0 && state.phase !== "summary") {
    state.health = 0;
    finishRun();
  }
}

function draw() {
  if (state.screen === "menu") {
    drawMenu();
    return;
  }

  if (state.phase === "barrier") drawBarrierScene();
  else if (state.phase === "innate") drawInnateScene();
  else if (state.phase === "adaptive") drawAdaptiveScene();
  else if (state.phase === "summary") drawSummaryScene();
}

let last = performance.now();
function loop(now) {
  last = now;
  update();
  draw();
  requestAnimationFrame(loop);
}

resetRun();
requestAnimationFrame(loop);