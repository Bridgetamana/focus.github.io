class PomodoroTimer {
    constructor() {
        this.focusScore = parseInt(localStorage.getItem("focusScore")) || 0;
        this.tasksComplete =
            parseInt(localStorage.getItem("tasksComplete")) || 0;
        this.timeLeft = 25 * 60;
        this.isRunning = false;
        this.interval = null;
        this.currentTask = null;
        this.tasks = [];
        this.mode = "focus";
        this.timerDisplay = document.querySelector(".timer-display");
        this.statusText = document.querySelector(".status");
        this.startBtn = document.getElementById("startBtn");
        this.resetBtn = document.getElementById("resetBtn");
        this.breakBtn = document.getElementById("breakBtn");
        this.taskForm = document.getElementById("taskForm");
        this.notification = document.getElementById("notification");
        this.taskList = document.getElementById("taskList");
        this.currentTaskContainer = document.getElementById("currentTask");
        this.settings = this.loadSettings();
        this.timeLeft = this.settings.focusDuration * 60;

        this.initializeEventListeners();
        this.loadTasks();
        this.initializeSettings();
        this.initializeHelp();
        this.initializeNotifications();
        this.updateDisplay();
        this.updateStats();
    }

    initializeHelp() {
        const helpBtn = document.getElementById("helpBtn");
        const helpModal = document.getElementById("helpModal");
        const closeHelp = document.getElementById("closeHelp");
        helpBtn.addEventListener("click", () => {
            helpModal.classList.add("show");
        });

        closeHelp.addEventListener("click", () => {
            helpModal.classList.remove("show");
        });
        helpModal
            .querySelector(".modal-overlay")
            .addEventListener("click", () => {
                helpModal.classList.remove("show");
            });
    }
    initializeSettings() {
        const settingsBtn = document.getElementById("settingsBtn");
        const settingsModal = document.getElementById("settingsModal");
        const closeSettings = document.getElementById("closeSettings");
        const saveSettings = document.getElementById("saveSettings");
        settingsBtn.addEventListener("click", () => {
            settingsModal.classList.add("show");
        });

        closeSettings.addEventListener("click", () => {
            settingsModal.classList.remove("show");
        });
        settingsModal
            .querySelector(".modal-overlay")
            .addEventListener("click", () => {
                settingsModal.classList.remove("show");
            });
        saveSettings.addEventListener("click", () => {
            const focusDuration = parseInt(
                document.getElementById("focusDuration").value
            );
            const breakDuration = parseInt(
                document.getElementById("breakDuration").value
            );
            if (focusDuration <= 0 || breakDuration <= 0) {
                this.showNotification("Duration must be greater than 0");
                return;
            }
            if (focusDuration > 60 || breakDuration > 30) {
                this.showNotification("Duration exceeds maximum limit");
                return;
            }
            this.settings = { focusDuration, breakDuration };
            localStorage.setItem("settings", JSON.stringify(this.settings));
            if (this.mode === "focus") {
                this.timeLeft = this.settings.focusDuration * 60;
            } else {
                this.timeLeft = this.settings.breakDuration * 60;
            }
            this.updateDisplay();
            settingsModal.classList.remove("show");
            this.showNotification("Timer has been updated!");
        });
    }

    loadTasks() {
        const savedTasks = localStorage.getItem("tasks");
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
            this.updateCurrentTask();
            this.renderTasks();
        }
    }
    saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(this.tasks));
        localStorage.setItem("focusScore", this.focusScore.toString());
        localStorage.setItem("tasksComplete", this.tasksComplete.toString());
    }
    updateCurrentTask() {
        const incompleteTasks = this.tasks.filter((task) => !task.completed);
        if (incompleteTasks.length > 0) {
            this.currentTask = incompleteTasks[0];
            this.currentTaskContainer.innerHTML = `
            <div class="task-actions">
                <div class="current-task-content">
                    <span class="task-name"
                    >${this.currentTask.name}</span>
                    <button class="complete-btn" onclick="window.pomodoroTimer. markTaskComplete(${this.currentTask.id})">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="delete-btn" onclick="window.pomodoroTimer.deleteTask(${this.currentTask.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            `;
        } else {
            this.currentTask = null;
            this.currentTaskContainer.innerHTML = "<p>No task available</p>";
        }
    }
    renderTasks() {
        this.taskList.innerHTML = "";
        const queuedTasks = this.tasks.filter(
            (task) => !task.completed && task.id !== this.currentTask?.id
        );
        queuedTasks.forEach((task) => {
            const taskItem = document.createElement("li");
            taskItem.classList.add("task-item");
            taskItem.dataset.id = task.id;
            taskItem.innerHTML = `
            <span class="task-name">${task.name}</span>
                <div class="task-actions">
                    <button class="delete-btn" onclick="window.pomodoroTimer.deleteTask(${task.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </span>
            `;
            const taskName = taskItem.querySelector(".task-name");
            this.taskList.appendChild(taskItem);
        });
    }
    handleTaskSubmit(e) {
        e.preventDefault();
        const taskName = document.getElementById("taskName").value;
        const task = {
            id: Date.now(),
            name: taskName,
            completed: false,
            timestamp: Date.now(),
        };
        this.tasks.push(task);
        this.saveTasks();
        if (!this.currentTask) {
            this.updateCurrentTask();
            this.currentFlowStreak = true;
        }
        this.renderTasks();
        this.showNotification("Task '" + taskName + "' added to queue!");
        this.taskForm.reset();
    }
    markTaskComplete(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.completed = true;
            this.tasksComplete++;
            this.focusScore += 20;
            this.updateStats();
            this.saveTasks();
            this.updateCurrentTask();
            this.renderTasks();
            this.showNotification(`Task "${task.name}" completed!`);
        }
    }
    deleteTask(taskId) {
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        this.saveTasks();
        this.updateCurrentTask();
        this.renderTasks();
    }
    loadSettings() {
        return (
            JSON.parse(localStorage.getItem("settings")) || {
                focusDuration: 25,
                breakDuration: 5,
            }
        );
    }
    saveSettings() {
        localStorage.setItem("settings", JSON.stringify(this.settings));
    }
    initializeEventListeners() {
        this.startBtn.addEventListener("click", () => this.toggleTimer());
        this.resetBtn.addEventListener("click", () => this.resetTimer());
        this.breakBtn.addEventListener("click", () => this.toggleBreak());
        this.taskForm.addEventListener("submit", (e) =>
            this.handleTaskSubmit(e)
        );
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.startBtn.textContent = "Pause";
        this.timerDisplay.classList.add("running");
        this.interval = setInterval(() => this.tick(), 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.startBtn.textContent = "Resume";
        this.timerDisplay.classList.remove("running");
        clearInterval(this.interval);
        if (this.mode === "focus") {
            this.deductPoints(15);
            this.showNotification("Timer paused! -15 points");
        }
    }

    resetTimer() {
        this.isRunning = false;
        this.startBtn.textContent = "Start Focus";
        this.timerDisplay.classList.remove("running");
        clearInterval(this.interval);
        if (this.mode === "focus") {
            this.timeLeft = this.settings.focusDuration * 60;
        } else {
            this.timeLeft = this.settings.breakDuration * 60;
        }

        this.updateDisplay();
    }

    tick() {
        this.timeLeft--;
        this.updateDisplay();
        if (this.timeLeft <= 0) {
            this.completeSession();
        }
    }

    toggleBreak() {
        if (this.mode === "focus") {
            this.mode = "break";
            this.timeLeft = this.settings.breakDuration * 60;
            this.statusText.textContent = "Time for a break";
            this.breakBtn.textContent = "End Break";
            if (this.isRunning) {
                clearInterval(this.interval);
            }
            this.startTimer();
        } else {
            this.mode = "focus";
            this.timeLeft = this.settings.focusDuration * 60;
            this.statusText.textContent = "Time to focus";
            this.breakBtn.textContent = "Take Break";
            if (this.isRunning) {
                clearInterval(this.interval);
            }
            this.startTimer();
        }
        this.updateDisplay();
    }
    deductPoints(points) {
        this.focusScore = Math.max(0, this.focusScore - points);
        this.updateStats();
        localStorage.setItem("focusScore", this.focusScore.toString());
    }
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = `${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    updateStats() {
        document.querySelector(
            ".stat-card:nth-child(1) .stat-value"
        ).textContent = `${this.focusScore}`;
        document.querySelector(
            ".stat-card:nth-child(1) .stat-label"
        ).textContent = "Focus Score";
        document.querySelector(
            ".stat-card:nth-child(2) .stat-value"
        ).textContent = this.tasksComplete;
    }

    showNotification(message) {
        this.notification.textContent = message;
        this.notification.classList.add("show");
        setTimeout(() => {
            this.notification.classList.remove("show");
        }, 3000);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.pomodoroTimer = new PomodoroTimer();
});