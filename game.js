// ======================
// TEXTOS EDITABLES
// ======================
const TEXTS = {
  sleepButton: "Durmir que xa vai sendo hora",
  sleepingButton: "Estou a descansar…",
  sleepWarning: "Ao descansar ou facer un hobby, Tim gaña +5 minutos por cada 30 minutos!",
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
  felicidade: 50,
  restStart: null,
  thoughtCount: 0,
  lastDecay: Date.now()
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

const thoughtListEl = document.getElementById("thoughtList");

// Minijuego
const fruitGame = document.getElementById("fruitGame");
const fruitScoreEl = document.getElementById("fruitScore");
const fruitTimerEl = document.getElementById("fruitTimer");
const timPlayer = document.getElementById("timPlayer");

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
function clamp(value){ return Math.max(0,Math.min(100,value)); }

function updateBars(){
  hungerBar.value=state.barriguita;
  energyBar.value=state.xogar;
  happinessBar.value=state.felicidade || 50;
  hungerValue.textContent=state.barriguita;
  energyValue.textContent=state.xogar;
  happinessValue.textContent=state.felicidade || 50;
  updateSprite();
}

function saveState(){ localStorage.setItem("timState",JSON.stringify(state)); }
function loadState(){ 
  try {
    const saved=localStorage.getItem("timState"); 
    if(saved) Object.assign(state,JSON.parse(saved));
    if(!state.lastDecay) state.lastDecay = Date.now();
  } catch(e){ console.error("Error cargando estado:",e); }
}

function lockButtons(){ feedBtn.disabled=true; playBtn.disabled=true; }
function unlockButtons(){ feedBtn.disabled=false; playBtn.disabled=false; }

function updateSprite(isPlaying=false){
  let sprite = SPRITES.idle;
  if(state.restStart){ sprite=SPRITES.tired; }
  else if(isPlaying){ sprite=SPRITES.play; }
  else if(state.barriguita<25 || state.xogar<25 || state.felicidade<25){ sprite=SPRITES.sad; }
  else if(state.barriguita<30){ sprite=SPRITES.hungry; }
  else if(state.barriguita>70 && state.xogar>70 && state.felicidade>70){ sprite=SPRITES.happy; }
  
  petSprite.onerror = () => { 
    petSprite.style.display = 'none'; 
    petPlaceholder.style.display = 'flex'; 
  };
  petSprite.src = sprite;
}

// ======================
// BARRIGUITA FELIZ
// ======================
feedBtn.addEventListener("click",()=>{
  const thought=prompt(TEXTS.positiveThoughtPrompt);
  if(thought && thought.trim()){
    state.barriguita = clamp(state.barriguita+5);
    messageEl.textContent=TEXTS.fedMessage;
    updateBars();
    saveState();

    const li = document.createElement("li");
    li.textContent = thought;
    thoughtListEl.appendChild(li);

    state.thoughtCount++;
    if(state.thoughtCount % 10 ===0){ startFruitGame(); }
  }
});

// ======================
// XOGAR
// ======================
playBtn.addEventListener("click",()=>{
  let clicks=0; let active=true;
  messageEl.textContent=TEXTS.playStart;
  updateSprite(true);

  function registerClick(){ if(active) clicks++; }

  petSprite.addEventListener("click",registerClick);
  petPlaceholder.addEventListener("click",registerClick);

  setTimeout(()=>{
    active=false;
    petSprite.removeEventListener("click",registerClick);
    petPlaceholder.removeEventListener("click",registerClick);

    if(clicks>=100){ 
      state.xogar=clamp(state.xogar+10);
      messageEl.textContent=TEXTS.playWin;
    } else { messageEl.textContent=TEXTS.playFail(clicks); }

    updateSprite(false);
    updateBars();
    saveState();
  },25000);
});

// ======================
// DESCANSO
// ======================
sleepBtn.addEventListener("click",()=>{
  messageEl.textContent=TEXTS.sleepWarning;

  if(!state.restStart){
    state.restStart=Date.now();
    sleepBtn.textContent=TEXTS.sleepingButton;
    petSprite.src=SPRITES.tired;
    body.classList.add("resting");
    lockButtons();
    saveState();
    return;
  }

  const minutes=Math.floor((Date.now()-state.restStart)/60000);
  const blocks=Math.floor(minutes/30);

  if(blocks>0){
    const points=blocks*5;
    state.sono = clamp(state.sono+points);
    messageEl.textContent=TEXTS.restSuccess(points);
  } else { messageEl.textContent=TEXTS.restFail; }

  state.restStart=null;
  state.lastDecay=Date.now();
  sleepBtn.textContent=TEXTS.sleepButton;
  petSprite.src=SPRITES.idle;
  body.classList.remove("resting");
  unlockButtons();
  updateBars();
  saveState();
});

// ======================
// DECAY (pérdida de puntos cada media hora)
// ======================
function applyDecay(){
  if(state.restStart) return;
  
  const now = Date.now();
  const minutes = Math.floor((now - state.lastDecay) / 60000);
  const blocks = Math.floor(minutes / 30);
  
  if(blocks > 0){
    state.barriguita = clamp(state.barriguita - (blocks * 10));
    state.xogar = clamp(state.xogar - (blocks * 10));
    state.felicidade = clamp(state.felicidade - (blocks * 10));
    state.lastDecay = now;
    updateBars();
    saveState();
  }
}

setInterval(applyDecay, 60000);

// ======================
// MINIJUEGO FRUTAS
// ======================
function startFruitGame(){
  fruitGame.classList.add("active");
  body.classList.add("fruit-game-active");
  let score=0; let timeLeft=60; let speed=4; let spawnRate=700; let timPos=45; let gameActive=true;

  fruitScoreEl.textContent=score;
  fruitTimerEl.textContent=`${timeLeft}s`;
  timPlayer.style.left=timPos+"%";
  lockButtons();

  const fruitContainer = fruitGame.querySelector(".fruitGameUI");
  const containerRect = fruitContainer.getBoundingClientRect();
  const timWidth = 50;
  const fruitWidth = 30;
  const containerHeight = 400;

  // Movimiento táctil
  let touchStartX=null;
  timPlayer.addEventListener("touchstart",(e)=>{touchStartX=e.touches[0].clientX;});
  timPlayer.addEventListener("touchmove",(e)=>{
    if(!gameActive || touchStartX===null) return;
    e.preventDefault();
    const touchX=e.touches[0].clientX;
    const deltaX=touchX-touchStartX;
    const containerWidth=fruitContainer.offsetWidth;
    timPos+=(deltaX/containerWidth)*100;
    timPos=Math.max(0,Math.min(90,timPos));
    timPlayer.style.left=timPos+"%";
    touchStartX=touchX;
  });
  timPlayer.addEventListener("touchend",()=>{touchStartX=null;});

  // Movimiento con teclado (PC)
  const keyHandler = (e) => {
    if(!gameActive) return;
    if(e.key==="ArrowLeft") timPos = Math.max(0, timPos-5);
    if(e.key==="ArrowRight") timPos = Math.min(90, timPos+5);
    timPlayer.style.left=timPos+"%";
  };
  document.addEventListener("keydown", keyHandler);

  // Movimiento con ratón
  const mouseHandler = (e) => {
    if(!gameActive) return;
    const rect = fruitContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    timPos = (x/rect.width)*100;
    timPos = Math.max(0, Math.min(90, timPos));
    timPlayer.style.left = timPos+"%";
  };
  fruitContainer.addEventListener("mousemove", mouseHandler);

  // Crear fruta
  function createFruit(){
    if(!gameActive) return;
    const fruit=document.createElement("img");
    const isPlancton=Math.random()<0.2;
    fruit.src=isPlancton?"sprites/plancton.png":"sprites/fruit.png";
    fruit.className="fruit";
    fruit.dataset.value=isPlancton?2:1;
    fruit.style.left=Math.random()*90+"%";
    fruit.style.top="0px";
    fruitContainer.appendChild(fruit);

    const fallInterval=setInterval(()=>{
      if(!gameActive){ clearInterval(fallInterval); return; }
      let top=parseFloat(fruit.style.top);
      if(top>containerHeight - 50){ fruit.remove(); clearInterval(fallInterval); return; }
      top+=speed;
      fruit.style.top=top+"px";

      // Colisión simplificada
      const timLeft = (timPos / 100) * fruitContainer.offsetWidth;
      const timRight = timLeft + timWidth;
      const fruitLeft = parseFloat(fruit.style.left) / 100 * fruitContainer.offsetWidth;
      const fruitRight = fruitLeft + fruitWidth;
      const timTop = containerHeight - 50;

      if(top + fruitWidth >= timTop && fruitRight > timLeft && fruitLeft < timRight){
        score+=parseInt(fruit.dataset.value);
        fruitScoreEl.textContent=score;
        fruit.remove();
        clearInterval(fallInterval);
      }
    },30);
  }

  let spawner=setInterval(createFruit,spawnRate);

  // dificultad progresiva
  let difficulty=setInterval(()=>{
    if(!gameActive){ clearInterval(difficulty); return; }
    speed+=1;
    spawnRate=Math.max(250,spawnRate-100);
    clearInterval(spawner);
    spawner=setInterval(createFruit,spawnRate);
  },10000);

  // timer
  const timerInterval=setInterval(()=>{
    if(!gameActive){ clearInterval(timerInterval); return; }
    timeLeft--;
    fruitTimerEl.textContent=`${timeLeft}s`;
    if(timeLeft<=0){
      gameActive=false;
      clearInterval(spawner); clearInterval(difficulty); clearInterval(timerInterval);
      fruitGame.classList.remove("active");
      body.classList.remove("fruit-game-active");
      document.removeEventListener("keydown", keyHandler);
      fruitContainer.removeEventListener("mousemove", mouseHandler);
      unlockButtons();
      if(score>=100){ state.barriguita=clamp(state.barriguita+10); messageEl.textContent="Extra conseguido! +10 Barriguita"; }
      else{ messageEl.textContent=`Acabou o reto! Fixeches ${score} puntos`; }
      updateBars();
      saveState();
    }
  },1000);
}

// ======================
// INIT
// ======================
loadState();
if(state.restStart){ 
  sleepBtn.textContent=TEXTS.sleepingButton; 
  petSprite.src=SPRITES.tired; 
  body.classList.add("resting"); 
  lockButtons(); 
} else { 
  sleepBtn.textContent=TEXTS.sleepButton; 
  applyDecay();
}
updateBars();
