// FocusFlow — a simple student dashboard built with vanilla JavaScript.

const STORAGE_KEY = "FocusFlow-dashboard-v1";
let tasks = [];
let skills = [];
let currentFilter = "all";
let timerSeconds = 25 * 60;
let totalSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let timerMode = "focus";

const $ = (selector) => document.querySelector(selector);

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      tasks = Array.isArray(saved.tasks) ? saved.tasks : [];
      skills = Array.isArray(saved.skills) ? saved.skills : [];
    }
  } catch (error) {
    console.warn("Could not load saved dashboard data:", error);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, skills }));
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function updateDate() {
  const now = new Date();
  $("#dateLabel").textContent = now.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric"
  }).toUpperCase();
  $("#todayLabel").textContent = now.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric"
  });
}

function renderTasks() {
  const list = $("#taskList");
  const visibleTasks = tasks.filter(task => {
    if (currentFilter === "active") return !task.done;
    if (currentFilter === "done") return task.done;
    return true;
  });

  list.innerHTML = "";
  $("#emptyTasks").style.display = visibleTasks.length ? "none" : "block";

  visibleTasks.forEach(task => {
    const item = document.createElement("div");
    item.className = "task-item";

    const check = document.createElement("button");
    check.className = `task-check ${task.done ? "checked" : ""}`;
    check.textContent = task.done ? "✓" : "";
    check.setAttribute("aria-label", task.done ? "Mark task incomplete" : "Complete task");
    check.addEventListener("click", () => {
      task.done = !task.done;
      saveData();
      renderAll();
      if (task.done) showToast("Nice work! One more step forward.");
    });

    const name = document.createElement("span");
    name.className = `task-name ${task.done ? "done" : ""}`;
    name.textContent = task.title;

    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = task.priority;

    const remove = document.createElement("button");
    remove.className = "delete-task";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Delete task");
    remove.addEventListener("click", () => {
      tasks = tasks.filter(entry => entry.id !== task.id);
      saveData();
      renderAll();
      showToast("Task removed.");
    });

    item.append(check, name, priority, remove);
    list.appendChild(item);
  });
}

function renderSkills() {
  const list = $("#skillList");
  list.innerHTML = "";
  $("#emptySkills").style.display = skills.length ? "none" : "block";

  skills.forEach(skill => {
    const row = document.createElement("div");
    row.className = "skill-row";

    const name = document.createElement("strong");
    name.textContent = skill.name;

    const controls = document.createElement("div");
    controls.className = "skill-controls";

    const value = document.createElement("span");
    value.textContent = `${skill.level}%`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = skill.level;
    slider.setAttribute("aria-label", `${skill.name} progress`);
    slider.addEventListener("input", () => {
      skill.level = Number(slider.value);
      value.textContent = `${skill.level}%`;
      bar.style.width = `${skill.level}%`;
      saveData();
      updateStats();
    });

    const remove = document.createElement("button");
    remove.className = "skill-delete";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove ${skill.name}`);
    remove.addEventListener("click", () => {
      skills = skills.filter(entry => entry.id !== skill.id);
      saveData();
      renderAll();
      showToast("Skill removed.");
    });

    controls.append(value, slider, remove);

    const track = document.createElement("div");
    track.className = "skill-track";
    const bar = document.createElement("span");
    bar.style.width = `${skill.level}%`;
    track.appendChild(bar);

    row.append(name, controls, track);
    list.appendChild(row);
  });
}

function updateStats() {
  const completed = tasks.filter(task => task.done).length;
  const remaining = tasks.length - completed;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  $("#completedStat").textContent = completed;
  $("#remainingStat").textContent = remaining;
  $("#skillsStat").textContent = skills.length;
  $("#weeklyStat").textContent = `${percent}%`;
  $("#weeklyBar").style.width = `${percent}%`;
  $("#streakNumber").textContent = completed === 1 ? "1 task done" : `${completed} tasks done`;
}

function renderAll() {
  renderTasks();
  renderSkills();
  updateStats();
}

function openModal(id) {
  $(`#${id}`).classList.add("show");
}
function closeModal(id) {
  $(`#${id}`).classList.remove("show");
}

$("#openTaskBtn").addEventListener("click", () => openModal("taskModal"));
$("#addSkillBtn").addEventListener("click", () => openModal("skillModal"));

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeModal(button.dataset.close));
});

document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeModal(backdrop.id);
  });
});

$("#taskForm").addEventListener("submit", event => {
  event.preventDefault();
  const title = $("#taskInput").value.trim();
  if (!title) return;
  tasks.unshift({
    id: Date.now(),
    title,
    priority: $("#taskPriority").value,
    done: false
  });
  saveData();
  renderAll();
  event.target.reset();
  closeModal("taskModal");
  showToast("Task added. You've got this!");
});

$("#skillLevel").addEventListener("input", event => {
  $("#skillLevelValue").textContent = `${event.target.value}%`;
});

$("#skillForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("#skillInput").value.trim();
  if (!name) return;
  if (skills.some(skill => skill.name.toLowerCase() === name.toLowerCase())) {
    showToast("You're already tracking that skill.");
    return;
  }
  skills.push({ id: Date.now(), name, level: Number($("#skillLevel").value) });
  saveData();
  renderAll();
  event.target.reset();
  $("#skillLevelValue").textContent = "25%";
  closeModal("skillModal");
  showToast("A new skill journey begins!");
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    renderTasks();
  });
});

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
  const seconds = (timerSeconds % 60).toString().padStart(2, "0");
  $("#timerDisplay").textContent = `${minutes}:${seconds}`;
  const progress = totalSeconds ? timerSeconds / totalSeconds : 0;
  $("#timerProgress").style.strokeDashoffset = 603.2 * (1 - progress);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  $("#startTimer").textContent = "Start focus";
}

function startTimer() {
  if (timerRunning) {
    stopTimer();
    return;
  }
  timerRunning = true;
  $("#startTimer").textContent = "Pause session";
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      stopTimer();
      $("#timerHint").textContent = timerMode === "break" ? "Break complete — ready when you are" : "Session complete — well done!";
      showToast(timerMode === "break" ? "Break finished. Ready for another round?" : "Focus session complete. Take a little break!");
    }
  }, 1000);
}

function setTimer(minutes, mode = "focus") {
  stopTimer();
  timerMode = mode;
  totalSeconds = minutes * 60;
  timerSeconds = totalSeconds;
  $("#timerMode").textContent = mode === "break" ? "BREAK TIME" : "FOCUS SESSION";
  $("#timerHint").textContent = mode === "break" ? "Relax and recharge" : "One step at a time";
  $("#startTimer").textContent = mode === "break" ? "Start break" : "Start focus";
  updateTimerDisplay();
}

$("#startTimer").addEventListener("click", startTimer);
$("#resetTimer").addEventListener("click", () => {
  stopTimer();
  timerSeconds = totalSeconds;
  $("#timerHint").textContent = timerMode === "break" ? "Relax and recharge" : "One step at a time";
  updateTimerDisplay();
});

document.querySelectorAll(".preset").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".preset").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    $("#customMinutes").value = button.dataset.minutes;
    setTimer(Number(button.dataset.minutes), "focus");
  });
});

$("#setCustomTimer").addEventListener("click", () => {
  const minutes = Number($("#customMinutes").value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
    showToast("Choose a focus time between 1 and 180 minutes.");
    return;
  }
  document.querySelectorAll(".preset").forEach(item => item.classList.remove("active"));
  setTimer(minutes, "focus");
  showToast(`Custom focus set to ${minutes} minutes.`);
});

$("#startBreak").addEventListener("click", () => {
  const minutes = Number($("#breakMinutes").value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) {
    showToast("Choose a break between 1 and 60 minutes.");
    return;
  }
  setTimer(minutes, "break");
  startTimer();
  showToast(`${minutes}-minute break started. Enjoy it!`);
});

// Remember the theme choice on this device.
const savedTheme = localStorage.getItem("FocusFlow-theme");
if (savedTheme === "dark") document.body.classList.add("dark-mode");
updateThemeButton();

function updateThemeButton() {
  const isDark = document.body.classList.contains("dark-mode");
  $("#themeToggle").innerHTML = isDark ? "☀ <span>Light mode</span>" : "☾ <span>Dark mode</span>";
  $("#themeToggle").setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("FocusFlow-theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
  updateThemeButton();
});

loadData();
updateDate();
renderAll();
updateTimerDisplay();
