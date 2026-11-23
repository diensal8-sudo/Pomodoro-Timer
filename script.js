// ---- Settings (in minutes) ----
const MODES = {
  focus: { label: "Focus", minutes: 25 },
  short: { label: "Short break", minutes: 5 },
  long:  { label: "Long break", minutes: 15 },
};

// ---- Elements ----
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start");
const resetBtn = document.getElementById("reset");
const sessionsEl = document.getElementById("sessions");
const progress = document.getElementById("progress");
const modeButtons = document.querySelectorAll(".mode");

const CIRCLE = 2 * Math.PI * 54; // length of the ring

// ---- State ----
let mode = "focus";
let total = MODES[mode].minutes * 60; // seconds in this mode
let endTime = null;                   // timestamp when the timer ends
let remaining = total;                // seconds left while paused
let intervalId = null;
let sessions = Number(localStorage.getItem("pomodoro-sessions")) || 0;

// ---- Helpers ----
function format(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return m + ":" + s;
}

function render() {
  timeEl.textContent = format(Math.ceil(remaining));
  const done = 1 - remaining / total;
  progress.style.strokeDashoffset = CIRCLE * done;
  sessionsEl.textContent = sessions;
  document.title = format(Math.ceil(remaining)) + " · " + MODES[mode].label;
}

// ---- Timer ----
function tick() {
  remaining = Math.max(0, (endTime - Date.now()) / 1000);
  render();
  if (remaining === 0) finish();
}

function start() {
  endTime = Date.now() + remaining * 1000;
  intervalId = setInterval(tick, 250);
  startBtn.textContent = "Pause";
}

function pause() {
  clearInterval(intervalId);
  intervalId = null;
  startBtn.textContent = "Resume";
}

function finish() {
  pause();
  startBtn.textContent = "Start";
  beep();
  if (mode === "focus") {
    sessions++;
    localStorage.setItem("pomodoro-sessions", sessions);
    setMode(sessions % 4 === 0 ? "long" : "short");
  } else {
    setMode("focus");
  }
}

function reset() {
  pause();
  remaining = total;
  startBtn.textContent = "Start";
  render();
}

// ---- Modes ----
function setMode(newMode) {
  pause();
  mode = newMode;
  total = MODES[mode].minutes * 60;
  remaining = total;
  startBtn.textContent = "Start";
  document.body.className = mode === "focus" ? "" : mode;
  modeButtons.forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  render();
}

// ---- Sound: a short beep, no audio file needed ----
function beep() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  osc.frequency.value = 880;
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

// ---- Events ----
startBtn.addEventListener("click", () => (intervalId ? pause() : start()));
resetBtn.addEventListener("click", reset);
modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); startBtn.click(); }
  if (e.key === "r") reset();
});

render();
