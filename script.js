const startBtn = document.getElementById("startBtn");
const invasionSection = document.getElementById("invasion");
const defenseSection = document.getElementById("defense");
const adaptiveSection = document.getElementById("adaptive");
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
const retryDefenseBtn = document.getElementById("retryDefenseBtn");

const adaptiveButtons = document.querySelectorAll(".adaptive-btn");
const adaptiveResponsePanel = document.getElementById("adaptiveResponsePanel");
const adaptiveLogList = document.getElementById("adaptiveLogList");
const adaptiveFill = document.getElementById("adaptiveFill");
const adaptiveValue = document.getElementById("adaptiveValue");
const adaptiveSteps = document.getElementById("adaptiveSteps");
const retryAdaptiveBtn = document.getElementById("retryAdaptiveBtn");

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

function smoothScrollTo(section) {
  const y = section.getBoundingClientRect().top + window.pageYOffset - 84;
  window.scrollTo({ top: y, behavior: "smooth" });
}

startBtn.addEventListener("click", () => {
  smoothScrollTo(invasionSection);
  hudStage.textContent = "Stage 1: Invasion";
  hudProgress.textContent = "Progress 10%";
});

toDefenseBtn.addEventListener("click", () => {
  smoothScrollTo(defenseSection);
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

function createParticles(count = 40) {
  backgroundEffects.innerHTML = "";
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
let usedActions = new Set();

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
    unlockAdaptiveBtn.textContent = "Continue to Adaptive Response";
  }
}

function resetDefenseStage() {
  threat = 80;
  defense = 10;
  usedActions = new Set();

  updateMeters();

  responsePanel.innerHTML = `
    <p class="card-label">System Response</p>
    <h3>Choose your first action</h3>
    <p>
      Click an action to test how the immune system responds. Some actions are correct,
      some are weak, and some are too early for this stage.
    </p>
  `;

  logList.innerHTML = `<p class="log-entry">Simulation ready. Awaiting first defense action.</p>`;

  unlockAdaptiveBtn.disabled = true;
  unlockAdaptiveBtn.classList.add("disabled");
  unlockAdaptiveBtn.textContent = "Adaptive System Locked";

  actionButtons.forEach((button) => {
    button.removeAttribute("style");
  });
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

retryDefenseBtn.addEventListener("click", resetDefenseStage);

unlockAdaptiveBtn.addEventListener("click", () => {
  if (!unlockAdaptiveBtn.disabled) {
    smoothScrollTo(adaptiveSection);
    hudStage.textContent = "Stage 3: Adaptive Response";
    hudProgress.textContent = "Progress 50%";
  }
});

// Stage 3 adaptive logic
const correctOrder = ["dendritic", "helper", "cytotoxic", "bcell"];
let currentStepIndex = 0;
let completedSteps = new Set();

const adaptiveMessages = {
  dendritic: {
    good: true,
    title: "Antigen presentation begins",
    text: "Correct. Dendritic cells collect pieces of the invader and present them to help launch the adaptive immune response.",
    note: "This is the bridge between innate and adaptive immunity."
  },
  helper: {
    good: true,
    title: "Helper T-cells coordinate the response",
    text: "Correct. Helper T-cells release signals that organize and strengthen the immune response.",
    note: "They help activate other immune cells."
  },
  cytotoxic: {
    good: true,
    title: "Cytotoxic T-cells target infected cells",
    text: "Correct. These T-cells can directly kill infected body cells that are hiding the invader.",
    note: "This is one of the body's most precise attack tools."
  },
  bcell: {
    good: true,
    title: "B-cells prepare antibody production",
    text: "Correct. B-cells can become plasma cells that produce antibodies against the specific antigen.",
    note: "Antibody production follows activation."
  },
  "antibodies-now": {
    good: false,
    title: "Too early for free antibodies",
    text: "Not yet. Antibodies usually come after B-cells are activated and expanded.",
    note: "Adaptive immunity is specific, but it takes time to build."
  },
  memory: {
    good: false,
    title: "Memory comes after the battle",
    text: "Memory cells are important, but they are formed after the immune response has been activated and the infection is being controlled.",
    note: "Store the lesson after the fight, not before it."
  }
};

function updateAdaptiveUI() {
  const percent = currentStepIndex * 25;
  adaptiveFill.style.width = `${percent}%`;
  adaptiveValue.textContent = `${percent}%`;
  adaptiveSteps.textContent = `${currentStepIndex} / 4`;
}

function addAdaptiveLog(message, type = "neutral") {
  const entry = document.createElement("p");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  adaptiveLogList.prepend(entry);

  while (adaptiveLogList.children.length > 6) {
    adaptiveLogList.removeChild(adaptiveLogList.lastChild);
  }
}

function setAdaptiveResponse(data) {
  adaptiveResponsePanel.innerHTML = `
    <p class="card-label">Adaptive Response</p>
    <h3>${data.title}</h3>
    <p>${data.text}</p>
    <p class="mini-note">${data.note}</p>
  `;
}

function resetAdaptiveStage() {
  currentStepIndex = 0;
  completedSteps = new Set();
  updateAdaptiveUI();

  adaptiveResponsePanel.innerHTML = `
    <p class="card-label">Adaptive Response</p>
    <h3>Build the correct sequence</h3>
    <p>
      The best path begins with antigen presentation. Then helper T-cells coordinate the
      response, followed by specialized attack and antibody production.
    </p>
  `;

  adaptiveLogList.innerHTML = `<p class="log-entry">Adaptive system waiting for activation.</p>`;

  adaptiveButtons.forEach((button) => {
    button.removeAttribute("style");
  });
}

adaptiveButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const step = button.dataset.step;
    const message = adaptiveMessages[step];

    if (completedSteps.has(step)) {
      addAdaptiveLog("That adaptive action was already used.", "neutral");
      return;
    }

    if (step === correctOrder[currentStepIndex]) {
      completedSteps.add(step);
      currentStepIndex += 1;
      updateAdaptiveUI();
      setAdaptiveResponse(message);
      addAdaptiveLog(message.title, "good");
      button.style.background = "linear-gradient(135deg, #1faa6d, #79f2b4)";

      if (currentStepIndex === 4) {
        adaptiveResponsePanel.innerHTML = `
          <p class="card-label">Adaptive Response</p>
          <h3>Adaptive response assembled</h3>
          <p>
            You built the specialized defense in the correct order. The body can now target infected
            cells and produce specific antibodies against the invader.
          </p>
          <p class="mini-note">Next later stage: memory cells preserve this information for future protection.</p>
        `;
        addAdaptiveLog("Stage 3 complete: specific immune response activated.", "good");
      }
    } else {
      setAdaptiveResponse(message);
      addAdaptiveLog(message.title, "bad");
      button.style.background = "linear-gradient(135deg, #7a2c38, #b4475b)";
    }
  });
});

retryAdaptiveBtn.addEventListener("click", resetAdaptiveStage);

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

const adaptiveObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        hudStage.textContent = "Stage 3: Adaptive Response";
        hudProgress.textContent = "Progress 50%";
      }
    });
  },
  { threshold: 0.35 }
);

invasionObserver.observe(invasionSection);
defenseObserver.observe(defenseSection);
adaptiveObserver.observe(adaptiveSection);

updateMeters();
updateAdaptiveUI();