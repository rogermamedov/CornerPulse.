const athletes = [
  { name: "Alex", maxHr: 193, hr: 181, load: "Very high", recovery: "Slow", soreness: 4, readiness: 67, connected: true },
  { name: "John", maxHr: 194, hr: 166, load: "High", recovery: "Normal", soreness: 2, readiness: 82, connected: true },
  { name: "Mike", maxHr: 193, hr: 143, load: "Moderate", recovery: "Fast", soreness: 1, readiness: 91, connected: true },
  { name: "Rafael", maxHr: 188, hr: 174, load: "High", recovery: "Slow", soreness: 3, readiness: 74, connected: true },
  { name: "Dylan", maxHr: 199, hr: 128, load: "Light", recovery: "Fast", soreness: 2, readiness: 88, connected: true },
  { name: "Omar", maxHr: 190, hr: 171, load: "High", recovery: "Normal", soreness: 3, readiness: 78, connected: true },
  { name: "Chris", maxHr: 185, hr: 151, load: "Moderate", recovery: "Normal", soreness: 2, readiness: 80, connected: true },
  { name: "Ben", maxHr: 197, hr: 187, load: "Very high", recovery: "Slow", soreness: 5, readiness: 61, connected: true },
  { name: "Sam", maxHr: 192, hr: 139, load: "Moderate", recovery: "Fast", soreness: 1, readiness: 93, connected: true },
  { name: "Leo", maxHr: 189, hr: 0, load: "Unknown", recovery: "Unknown", soreness: 2, readiness: 77, connected: false }
];

const zoneConfig = {
  green: { label: "Green", color: "var(--green)" },
  yellow: { label: "Yellow", color: "var(--yellow)" },
  orange: { label: "Orange", color: "var(--orange)" },
  red: { label: "Red", color: "var(--red)" },
  disconnected: { label: "Offline", color: "var(--gray)" }
};

let activeFilter = "all";
let activeView = "tiles";
let timerSeconds = 134;
let timerRunning = true;

const grid = document.querySelector("#athleteGrid");
const table = document.querySelector("#athleteTable");
const tableWrap = document.querySelector("#tableWrap");
const searchInput = document.querySelector("#searchInput");
const filterButtons = document.querySelectorAll("[data-filter]");
const viewButtons = document.querySelectorAll("[data-view]");
const playPause = document.querySelector("#playPause");
const markRound = document.querySelector("#markRound");
const resetTimer = document.querySelector("#resetTimer");

function getZone(athlete) {
  if (!athlete.connected) return "disconnected";
  const pct = (athlete.hr / athlete.maxHr) * 100;
  if (pct >= 92) return "red";
  if (pct >= 84) return "orange";
  if (pct >= 70) return "yellow";
  return "green";
}

function getStatus(athlete) {
  if (!athlete.connected) return "Sensor disconnected";
  const zone = getZone(athlete);
  if (zone === "red" && athlete.recovery === "Slow") return "Ease up next exchange";
  if (zone === "red") return "Very high personal workload";
  if (zone === "orange") return "Approaching high intensity";
  if (zone === "yellow") return "Productive working range";
  return "Lower load than baseline";
}

function getVisibleAthletes() {
  const query = searchInput.value.trim().toLowerCase();
  return athletes.filter((athlete) => {
    const zone = getZone(athlete);
    const matchesFilter = activeFilter === "all" || activeFilter === zone;
    const matchesSearch = athlete.name.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });
}

function renderAthletes() {
  const visible = getVisibleAthletes();
  grid.innerHTML = visible.map(renderCard).join("");
  table.innerHTML = visible.map(renderRow).join("");
  updateSummary();
  updateZones();
  updateAlerts();
}

function renderCard(athlete) {
  const zone = getZone(athlete);
  const pct = athlete.connected ? Math.round((athlete.hr / athlete.maxHr) * 100) : 0;
  const hrText = athlete.connected ? athlete.hr : "--";
  return `
    <article class="athlete-card ${zone}">
      <div class="athlete-head">
        <div>
          <p class="eyebrow">${athlete.readiness}% readiness</p>
          <h3>${athlete.name}</h3>
        </div>
        <span class="sensor-dot ${athlete.connected ? "connected" : ""}" title="${athlete.connected ? "Sensor connected" : "Sensor disconnected"}"></span>
      </div>
      <div class="hr-row">
        <div class="bpm">${hrText}<small>BPM live</small></div>
        <span class="zone-pill ${zone}">${zoneConfig[zone].label}</span>
      </div>
      <div class="card-stats">
        <div><span>Max HR</span><strong>${pct || "--"}%</strong></div>
        <div><span>Load</span><strong>${athlete.load}</strong></div>
        <div><span>Recovery</span><strong>${athlete.recovery}</strong></div>
      </div>
      <div class="status-line">${getStatus(athlete)}</div>
    </article>
  `;
}

function renderRow(athlete) {
  const zone = getZone(athlete);
  const pct = athlete.connected ? `${Math.round((athlete.hr / athlete.maxHr) * 100)}%` : "--";
  const hrText = athlete.connected ? `${athlete.hr} BPM` : "--";
  return `
    <tr>
      <td><strong>${athlete.name}</strong></td>
      <td>${hrText}</td>
      <td>${pct}</td>
      <td><span class="zone-pill ${zone}">${zoneConfig[zone].label}</span></td>
      <td>${athlete.load}</td>
      <td>${athlete.recovery}</td>
      <td>${getStatus(athlete)}</td>
    </tr>
  `;
}

function updateSummary() {
  const connected = athletes.filter((athlete) => athlete.connected);
  const red = athletes.filter((athlete) => getZone(athlete) === "red").length;
  const slow = athletes.filter((athlete) => athlete.recovery === "Slow" && athlete.connected).length;
  const avg = Math.round(connected.reduce((sum, athlete) => sum + athlete.hr, 0) / connected.length);
  const alerts = athletes.filter((athlete) => ["red", "orange", "disconnected"].includes(getZone(athlete))).length;

  document.querySelector("#redCount").textContent = red;
  document.querySelector("#avgHr").textContent = avg;
  document.querySelector("#slowRecovery").textContent = slow;
  document.querySelector("#alertsCount").textContent = alerts;
  document.querySelector("#connectionSummary").textContent = `${connected.length} connected`;
}

function updateZones() {
  const counts = Object.keys(zoneConfig).map((zone) => ({
    zone,
    count: athletes.filter((athlete) => getZone(athlete) === zone).length
  }));

  document.querySelector("#zoneBars").innerHTML = counts.map(({ zone, count }) => {
    const width = Math.max(6, (count / athletes.length) * 100);
    return `
      <div class="zone-row">
        <span>${zoneConfig[zone].label}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${width}%; background:${zoneConfig[zone].color}"></div>
        </div>
        <strong>${count}</strong>
      </div>
    `;
  }).join("");
}

function updateAlerts() {
  const priority = athletes
    .filter((athlete) => ["red", "orange", "disconnected"].includes(getZone(athlete)))
    .slice(0, 5);

  document.querySelector("#alertList").innerHTML = priority.map((athlete) => {
    const zone = getZone(athlete);
    return `
      <div class="alert-item" style="border-left-color:${zoneConfig[zone].color}">
        <strong>${athlete.name}</strong>
        <span>${getStatus(athlete)}</span>
      </div>
    `;
  }).join("");
}

function simulateLiveData() {
  athletes.forEach((athlete) => {
    if (!athlete.connected) return;
    const drift = Math.floor(Math.random() * 7) - 3;
    const trend = timerSeconds < 45 ? 2 : timerSeconds > 150 ? -1 : 0;
    athlete.hr = Math.max(104, Math.min(athlete.maxHr - 3, athlete.hr + drift + trend));
    const pct = Math.round((athlete.hr / athlete.maxHr) * 100);
    athlete.load = pct >= 92 ? "Very high" : pct >= 84 ? "High" : pct >= 70 ? "Moderate" : "Light";
    athlete.recovery = pct >= 90 && athlete.soreness >= 3 ? "Slow" : pct < 76 ? "Fast" : "Normal";
  });

  renderAthletes();
  updateRoundReport();
}

function updateRoundReport() {
  const connected = athletes.filter((athlete) => athlete.connected);
  const peak = Math.max(...connected.map((athlete) => athlete.hr));
  const avg = Math.round(connected.reduce((sum, athlete) => sum + athlete.hr, 0) / connected.length);
  const slow = connected.filter((athlete) => athlete.recovery === "Slow").length;

  document.querySelector("#peakHr").textContent = `${peak} BPM`;
  document.querySelector("#roundAvg").textContent = `${avg} BPM`;
  document.querySelector("#drop30").textContent = `${Math.max(10, 24 - slow * 2)} BPM`;
  document.querySelector("#drop60").textContent = `${Math.max(18, 39 - slow * 3)} BPM`;
}

function tickTimer() {
  if (!timerRunning) return;
  timerSeconds -= 1;
  if (timerSeconds < 0) timerSeconds = 180;
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const seconds = String(timerSeconds % 60).padStart(2, "0");
  document.querySelector("#roundTimer").textContent = `${minutes}:${seconds}`;
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderAthletes();
  });
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    viewButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeView = button.dataset.view;
    grid.classList.toggle("hidden", activeView !== "tiles");
    tableWrap.classList.toggle("hidden", activeView !== "table");
  });
});

searchInput.addEventListener("input", renderAthletes);

playPause.addEventListener("click", () => {
  timerRunning = !timerRunning;
  playPause.textContent = timerRunning ? "II" : ">";
  playPause.setAttribute("aria-label", timerRunning ? "Pause timer" : "Start timer");
});

markRound.addEventListener("click", () => {
  timerSeconds = 180;
  athletes.forEach((athlete) => {
    if (athlete.connected) athlete.hr = Math.max(105, athlete.hr - 14);
  });
  simulateLiveData();
});

resetTimer.addEventListener("click", () => {
  timerSeconds = 180;
  tickTimer();
});

renderAthletes();
tickTimer();
setInterval(tickTimer, 1000);
setInterval(simulateLiveData, 2400);
