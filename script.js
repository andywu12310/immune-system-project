const startBtn = document.getElementById("startBtn");
const invasionSection = document.getElementById("invasion");
const hudStage = document.getElementById("hudStage");
const hudProgress = document.getElementById("hudProgress");
const infoButtons = document.querySelectorAll(".info-btn");
const infoDisplay = document.getElementById("infoDisplay");

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
  {
    threshold: 0.45
  }
);

invasionObserver.observe(invasionSection);