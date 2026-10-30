/* Dino Park — one web app combining 10 adapted dinosaur mini-games.
   Original code; mechanics inspired by (not copied from) public kids' apps. */
"use strict";

// ---------- shared helpers ----------
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const DINO = {
  triceratops: "🦕", trex: "🦖", bronto: "🦕", raptor: "🦖",
  stego: "🦕", ptero: "🦅", egg: "🥚", bone: "🦴",
  leaf: "🍃", fruit: "🍎", fish: "🐟", volcano: "🌋",
  footprint: "🐾", star: "⭐", heart: "💚",
  cube: "🟦", ball: "🔴", tri: "🔺", ring: "⭕",
};
const DINOS = [DINO.triceratops, DINO.trex, DINO.bronto, DINO.raptor, DINO.stego, DINO.ptero];
const FOODS = [DINO.leaf, DINO.fruit, DINO.fish, DINO.bone];
const SHAPES = [DINO.cube, DINO.ball, DINO.tri, DINO.ring];
const COLORS = { red: "#e2604f", blue: "#4f8fd6", green: "#4a8f3c", yellow: "#f4c542", purple: "#9b6fc6", orange: "#f2a541" };

// ---------- audio (WebAudio beeps, no assets) ----------
let audioCtx = null, soundOn = true;
function beep(freq = 600, dur = 0.12, type = "sine", gain = 0.15) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* audio unavailable */ }
}
const sfx = {
  tap: () => beep(500, 0.06, "triangle"),
  good: () => { beep(660, 0.1); setTimeout(() => beep(880, 0.14), 90); },
  bad: () => beep(220, 0.2, "sawtooth", 0.08),
  win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.16), i * 120)),
};

// ---------- stars (progress per game, localStorage) ----------
const store = {
  get(id) { try { return JSON.parse(localStorage.getItem("dino_" + id)) || 0; } catch (e) { return 0; } },
  set(id, v) { try { localStorage.setItem("dino_" + id, JSON.stringify(v)); } catch (e) {} },
};

// ---------- app shell ----------
const menuEl = $("#menu"), gameEl = $("#game"), area = $("#gameArea");
let currentGame = null;

function showMenu() {
  hideWin();
  gameEl.classList.add("hidden");
  menuEl.classList.remove("hidden");
  currentGame = null;
  renderMenu();
}
function showGame(id) {
  menuEl.classList.add("hidden");
  gameEl.classList.remove("hidden");
  $("#gameTitle").textContent = GAMES.find(g => g.id === id).name;
  hideWin();
  currentGame = GAMES.find(g => g.id === id);
  currentGame.init(area);
}
function renderMenu() {
  const grid = $("#gameGrid");
  grid.innerHTML = "";
  GAMES.forEach(g => {
    const b = document.createElement("button");
    b.className = "tile";
    const stars = store.get(g.id);
    b.innerHTML = `<span class="emoji">${g.emoji}</span><span class="name">${g.name}</span>${stars ? `<span class="stars">${"⭐".repeat(stars)}</span>` : ""}`;
    b.onclick = () => { sfx.tap(); showGame(g.id); };
    grid.appendChild(b);
  });
}
function hideWin() { $("#winOverlay").classList.add("hidden"); }
function win(id, msg) {
  $("#winText").textContent = msg || "Great job!";
  $("#winOverlay").classList.remove("hidden");
  sfx.win();
  const cur = store.get(id);
  if (cur < 3) store.set(id, cur + 1);
}
$("#homeBtn").onclick = () => { sfx.tap(); showMenu(); };
$("#backBtn").onclick = () => { sfx.tap(); showMenu(); };
$("#menuBtn").onclick = () => { sfx.tap(); showMenu(); };
$("#againBtn").onclick = () => { sfx.tap(); hideWin(); if (currentGame) currentGame.init(area); };
$("#soundBtn").onclick = () => {
  soundOn = !soundOn;
  $("#soundBtn").textContent = soundOn ? "🔊" : "🔇";
  if (soundOn) sfx.tap();
};

// ---------- game registry ----------
const GAMES = [];
function register(g) { GAMES.push(g); }