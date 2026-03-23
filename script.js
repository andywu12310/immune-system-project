const startBtn = document.getElementById("startBtn");
const invasionSection = document.getElementById("invasion");
const defenseSection = document.getElementById("defense");
const toDefenseBtn = document.getElementById("toDefenseBtn");

const hudStage = document.getElementById("hudStage");
const hudProgress = document.getElementById("hudProgress");

const infoButtons = document.querySelectorAll(".info-btn");
const infoDisplay = document.getElementById("infoDisplay");

const backgroundEffects = document.getElementById("backgroundEffects");

const threatFill = document.getElementById("threatFill");
const defenseFill = document.getElementById("defenseFill");
const threatValue = document.getElementById("threatValue");
const defenseValue = document.getElementById("defenseValue");
const responsePanel = document.getElementById("responsePanel");
const logList = document.getElementById("logList");
const actionButtons = document.querySelectorAll(".action-btn");
const unlockAdaptiveBtn = document.getElementById("unlockAdaptiveBtn");

const topicContent = {
  virus: {
    title: "Virus",
    text: "A virus is a tiny infectious agent that enters living cells and uses them to make more copies of itself. Because viruses hide inside your own cells, they can be difficult for the body to stop.",
    note: "Immune focus: infected cells and viral markers must be identified quickly."
  },
  bacteria: {
    title: "Bacteria",
    text: "Bacteria are single-celled organisms. Many are harmless or even helpful, but some can invade tissues, release toxins, and trigger infection when they enter places they should not be.",
    note: "Immune focus: bacteria can often be attacked directly by phagocytes and antibodies."
  },
  antigen: {
    title: "Antigen",
    text: "An antigen is a marker, often a protein or sugar structure, that the immune system can recognize. It acts like an identification tag that tells immune cells what they are dealing with.",
    note: "Immune focus: antigens help the body match the correct immune response to a threat."
  }
};

startBtn.addEventListener("click", () => {
  invasionSection.scrollIntoView({ behavior: "smooth" });
  hudStage.textContent = "Stage 1: Invasion";
  hudProgress.textContent = "Progress 10%";
});

toDefenseBtn.addEventListener("click", () => {
  defenseSection.scrollIntoView({ behavior: "smooth" });
  hudStage.textContent = "Stage 2: First Defense";
  hudProgress.textContent = "Progress 25%";
});

infoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const topic = button.dataset.topic;
    const selected = topicContent[topic];

    infoButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    infoDisplay.innerHTML = `
      <h3>${selected.title}</h3>
      <p>${selected.text}</p>
      <p class="mini-note">${selected.note}</p>
    `;
  });
});

// More floating white particles in background
function createParticles(count = 32) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");
    particle.classList.add("particle");

    const size = Math.random() * 10 + 4;
    const left = Math.random() * 100;
    const delay = Math.random() * 16;
    const duration = Math.random() * 10 + 10;
    const opacity = Math.random() * 0.35 + 0.45;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${left}%`;
    particle.style.top = `${85 + Math.random() * 18}%`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.opacity = opacity;

    backgroundEffects.appendChild(particle);
  }
}

createParticles();

let threat = 80;
let defense = 10;

const usedActions = new Set();

const actionResults = {
  mucus: {
    type: "good",
    threatChange: -10,
    defenseChange: +12,
    title: "Mucus traps the invader",
    text: "Good choice. In the respiratory tract, mucus can trap many microbes and help stop them from reaching deeper tissues.",
    note: "Innate defense: mucous membranes are part of the first line of defense."
  },
  "stomach-acid": {
    type: "neutral",
    threatChange: -2,
    defenseChange: +2,
    title: "Useful in the wrong location",
    text: "Stomach acid kills many swallowed microbes, but this pathogen entered through the respiratory tract. It helps only a little here.",
    note: "Scientific idea: a defense can be strong, but only in the right place."
  },
  skin: {
    type: "bad",
    threatChange: 0,
    defenseChange: +1,
    title: "Too late for the skin barrier",
    text: "Skin is a great outer barrier, but the pathogen is already inside through the nose or mouth. This does not solve the current problem.",
    note: "Scientific idea: barriers work best before entry, not after."
  },
  phagocytes: {
    type: "good",
    threatChange: -18,
    defenseChange: +20,
    title: "Phagocytes move in",
    text: "Excellent choice. Phagocytes such as macrophages and neutrophils can engulf and destroy invaders early in infection.",
    note: "Innate defense: phagocytosis is one of the body's fastest cell-based responses."
  },
  fever: {
    type: "neutral",
    threatChange: -8,
    defenseChange: +10,
    title: "Temperature rises",
    text: "A fever can slow some microbes and support recovery, but it is more of a support response than a precise weapon.",
    note: "Scientific idea: fever helps, but it does not replace immune cells."
  },
  antibodies: {
    type: "bad",
    threatChange: -1,
    defenseChange: +3,
    title: "Too early for antibodies",
    text: "Antibodies belong mainly to the adaptive immune response. At this point, the body has not yet built the specific response it needs.",
    note: "Scientific idea: adaptive immunity is powerful, but slower to begin."
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateMeters() {
  threat = clamp(threat, 0, 100);
  defense = clamp(defense, 0, 100);

  threatFill.style.width = `${threat}%`;
  defenseFill.style.width = `${defense}%`;
  threatValue.textContent = `${threat}%`;
  defenseValue.textContent = `${defense}%`;
}

function addLog(message, type = "neutral") {
  const entry = document.createElement("p");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  logList.prepend(entry);

  while (logList.children.length > 5) {
    logList.removeChild(logList.lastChild);
  }
}

function setResponse(result) {
  responsePanel.innerHTML = `
    <p class="card-label">System Response</p>
    <h3>${result.title}</h3>
    <p>${result.text}</p>
    <p class="mini-note">${result.note}</p>
  `;
}

function checkUnlock() {
  if (defense >= 55 || threat <= 40) {
    unlockAdaptiveBtn.disabled = false;
    unlockAdaptiveBtn.classList.remove("disabled");
    unlockAdaptiveBtn.textContent = "Adaptive System Ready Soon";
  }
}

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;

    if (usedActions.has(action)) {
      addLog("That response was already tested. Try a different layer of defense.", "neutral");
      return;
    }

    usedActions.add(action);

    const result = actionResults[action];
    threat += result.threatChange;
    defense += result.defenseChange;

    updateMeters();
    setResponse(result);
    addLog(result.title, result.type);

    if (result.type === "good") {
      button.style.background = "linear-gradient(135deg, #1faa6d, #79f2b4)";
    } else if (result.type === "neutral") {
      button.style.background = "linear-gradient(135deg, #4060d8, #7aa1ff)";
    } else {
      button.style.background = "linear-gradient(135deg, #7a2c38, #b4475b)";
    }

    checkUnlock();
  });
});

const invasionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        hudStage.textContent = "Stage 1: Invasion";
        hudProgress.textContent = "Progress 10%";
      } else if (window.scrollY < invasionSection.offsetTop - 200) {
        hudStage.textContent = "Stage 0: Loading";
        hudProgress.textContent = "Progress 0%";
      }
    });
  },
  { threshold: 0.45 }
);

const defenseObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        hudStage.textContent = "Stage 2: First Defense";
        hudProgress.textContent = "Progress 25%";
      }
    });
  },
  { threshold: 0.35 }
);

invasionObserver.observe(invasionSection);
defenseObserver.observe(defenseSection);
updateMeters();