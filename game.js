// ======================
// TEXTOS EDITABLES
// ======================
const TEXTS = {
  sleepButton: "Durmir que xa vai sendo hora",
  sleepingButton: "Estou a descansar…",

  sleepWarning: "Clica aquí só se estás a descansar ti ou a facer un hobby",
  sleepInfo: "ao descansar ou facer un hobby, Tim gaña +5 minutos por cada 30 minutos!",

  positiveThoughtPrompt: "Escribe algo que che faga feliz",
  fedMessage: "Tim papou bem",

  playStart: "Reto! 100 toques en 25 segundos!",
  playWin: "TOMA XA BUUUUM",
  playFail: (clicks) => `Fixeches ${clicks} toques! Bo intento`,

  restSuccess: (points) => `Descanso bonito +${points} puntiños para Tim`,
  restFail: "Un pouco máis de descanso e Tim sumará puntiños"
};

// ======================
// ESTADO
// ======================
const state = {
  barriguita: 50,
  xogar: 50,
  sono: 50,
  restStart: null,
  lastDecay: Date.now() // timestamp del último decaimiento
};

// ======================
// ELEMENTOS
// ======================
const hungerBar = document.getElementById("hungerBar");
const energyBar = document.getElementById("energyBar");
const happinessBar = document.getElementById("happinessBar");

const hungerValue = document.getElementById("hungerValue");
const energyValue = document.getElementById("energyValue");
const happinessValue = document.getElementById("happinessValue");

const feedBtn = document.getElementById("feedBtn");
const playBtn = document.getElementById("playBtn");
const sleepBtn = document.getElementById("sleepBtn");

const messageEl = document.getElementById("gameMessage");
const petSprite = document.getElementById("petSprite");
const petPlaceholder = document.getElementById("petPlaceholder");
const body = document.body;

// UI de Xogar
const playUI = document.getElementById("playUI");
const tapCounterEl = document.getElementById("tapCounter");
const timerEl = document.getElementById("timer");

// ======================
// SPRITES
// ======================
const SPRITES = {
  idle: "sprites/pet_idle.png",
  tired: "sprites/pet_tired.png",
  hungry: "sprites/pet_hungry.png",
  play: "sprites/pet_play.png",
  happy: "sprites/pet_happy.png",
  sad: "sprites/pet_sad.png"
};

// ======================
// UTILIDADES
// ======================
function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function updateBars() {
  hungerBar.value = state.barriguita;
  energyBar.value = state.xogar;
  happinessBar.value = state.sono;

  if (hungerValue) hungerValue.textContent = state.barriguita;
  if (energyValue) energyValue.textContent = state.xogar;
  if (happinessValue) happinessValue.textContent = state.sono;

  updateSprite();
}

function saveState() {
  localStorage.setItem("timState", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("timState");
  if (saved) Object.assign(state, JSON.parse(saved));
}

function lockButtons() {
  feedBtn.disabled = true;
  playBtn.disabled = true;
}

function unlockButtons() {
  feedBtn.disabled = false;
  playBtn.disabled = false;
}

function updateSprite(isPlaying = false) {
  let sprite = SPRITES.idle;

  if (state.restStart) {
    sprite = SPRITES.tired;
  } else if (isPlaying) {
    sprite = SPRITES.play;
  } else if (
    state.barriguita < 25 &&
    state.xogar < 25 &&
    state.sono < 25
  ) {
    sprite = SPRITES.sad;
  } else if (state.barriguita < 30) {
    sprite = SPRITES.hungry;
  } else if (
    state.barriguita > 70 &&
    state.xogar > 70 &&
    state.sono > 70
  ) {
    sprite = SPRITES.happy;
  }

  petSprite.src = sprite;
}

// ======================
// DECAY DE BARRAS AUTOMÁTICO
// ======================
function decayStats() {
  const now = Date.now();
  const elapsed = now - state.lastDecay;

  if (elapsed >= 30 * 60 * 1000) { // cada 30 minutos
    const blocks = Math.floor(elapsed / (30 * 60 * 1000));
    state.barriguita = clamp(state.barriguita - 5 * blocks);
    state.xogar = clamp(state.xogar - 5 * blocks);
    state.sono = clamp(state.sono - 5 * blocks);

    state.lastDecay = state.lastDecay + blocks * 30 * 60 * 1000;
    updateBars();
    saveState();
  }
}

// ======================
// BARRIGUITA FELIZ
// ======================
feedBtn.addEventListener("click", () => {
  const thought = prompt(TEXTS.positiveThoughtPrompt);

  if (thought && thought.trim()) {
    state.barriguita = clamp(state.barriguita + 5);
    messageEl.textContent = TEXTS.fedMessage;
    updateBars();
    saveState();
  } else {
    messageEl.textContent = "";
  }
});

// ======================
// XOGAR (CONTADOR + CRONÓMETRO)
// ======================
playBtn.addEventListener("click", () => {
  let clicks = 0;
  let timeLeft = 25;
  let active = true;

  messageEl.textContent = TEXTS.playStart;
  playUI.style.display = "block";
  tapCounterEl.textContent = "Toques: 0 / 100";
  timerEl.textContent = `Tempo: ${timeLeft}s`;

  updateSprite(true);

  function registerClick() {
    if (!active) return;
    clicks++;
    tapCounterEl.textContent = `Toques: ${clicks} / 100`;
  }

  petSprite.addEventListener("click", registerClick);
  petPlaceholder.addEventListener("click", registerClick);

  const countdown = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `Tempo: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      endPlay();
    }
  }, 1000);

  function endPlay() {
    active = false;
    playUI.style.display = "none";

    petSprite.removeEventListener("click", registerClick);
    petPlaceholder.removeEventListener("click", registerClick);

    if (clicks >= 100) {
      state.xogar = clamp(state.xogar + 10);
      messageEl.textContent = TEXTS.playWin;
    } else {
      messageEl.textContent = TEXTS.playFail(clicks);
    }

    updateSprite(false);
    updateBars();
    saveState();
  }
});

// ======================
// DESCANSO
// ======================
sleepBtn.addEventListener("click", () => {
  // Mostrar explicación mecánica siempre
  messageEl.textContent = TEXTS.sleepInfo;

  if (!state.restStart) {
    // Empezar descanso
    state.restStart = Date.now();
    sleepBtn.textContent = TEXTS.sleepingButton;
    petSprite.src = SPRITES.tired;
    body.classList.add("resting");
    lockButtons();
    saveState();
    return;
  }

  // Terminar descanso
  const minutes = Math.floor((Date.now() - state.restStart) / 60000);
  const blocks = Math.floor(minutes / 30);

  if (blocks > 0) {
    const points = blocks * 5;
    state.sono = clamp(state.sono + points);
    messageEl.textContent = TEXTS.restSuccess(points);
  } else {
    messageEl.textContent = TEXTS.restFail;
  }

  state.restStart = null;
  sleepBtn.textContent = TEXTS.sleepButton;
  petSprite.src = SPRITES.idle;
  body.classList.remove("resting");
  unlockButtons();

  updateBars();
  saveState();
});

// ======================
// INIT
// ======================
loadState();

if (state.restStart) {
  sleepBtn.textContent = TEXTS.sleepingButton;
  petSprite.src = SPRITES.tired;
  body.classList.add("resting");
  lockButtons();
}

updateBars();

// Revisar decaimiento cada minuto
setInterval(decayStats, 60 * 1000);