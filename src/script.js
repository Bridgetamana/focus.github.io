class PomodoroTimer {
    constructor() {
        this.focusScore = parseInt(localStorage.getItem("focusScore")) || 0;
        this.tasksComplete =
            parseInt(localStorage.getItem("tasksComplete")) || 0;
        this.bestScore = parseInt(localStorage.getItem("bestScore")) || 0;
        this.lastResetDate =
            localStorage.getItem("lastResetDate") || this.getTodayDate();
        this.currentFlowStreak = true;
        this.timeLeft = 25 * 60;
        this.isRunning = false;
        this.interval = null;
        this.currentTask = null;
        this.tasks = [];
        this.mode = "focus";

        this.checkDailyReset();

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
        this.reminderTimeout = null;

        this.initializeEventListeners();
        this.loadTasks();
        this.setupQueueToggle();
        this.initializeSettings();
        this.initializeHelp();
        this.initializeNotifications();
        this.initializeDragAndDrop();
        this.updateDisplay();
        this.updateStats();
    }

    getTodayDate() {
        return new Date().toDateString();
    }

    checkDailyReset() {
        const today = this.getTodayDate();
        if (this.lastResetDate !== today) {
            if (this.focusScore > this.bestScore) {
                this.bestScore = this.focusScore;
                localStorage.setItem("bestScore", this.bestScore.toString());
            }

            this.focusScore = 0;
            this.lastResetDate = today;
            localStorage.setItem("lastResetDate", today);
            localStorage.setItem("focusScore", "0");

            this.showNotification(
                "New day started! Previous best: " + this.bestScore
            );
        }
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

    initializeNotifications() {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
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
        localStorage.setItem("bestScore", this.bestScore.toString());
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
                        contenteditable="true" 
                        data-task-id="${this.currentTask.id}"
                    >${this.currentTask.name}</span>
                    <button class="complete-btn" onclick="window.pomodoroTimer. markTaskComplete(${this.currentTask.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <button class="delete-btn" onclick="window.pomodoroTimer.deleteTask(${this.currentTask.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
            `;

            const taskName =
                this.currentTaskContainer.querySelector(".task-name");
            this.initializeEditableTask(taskName);
        } else {
            this.currentTask = null;
            this.currentTaskContainer.innerHTML = "<p>No task available</p>";
        }
    }

    initializeEditableTask(element) {
        element.addEventListener("blur", () => {
            const taskId = parseInt(element.dataset.taskId);
            const newName = element.textContent.trim();
            if (newName && newName !== this.currentTask.name) {
                this.updateTaskName(taskId, newName);
            }
        });

        element.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                element.blur();
            }
        });
    }

    updateTaskName(taskId, newName) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.name = newName;
            this.saveTasks();
            this.showNotification("Task name updated!");
        }
    }

    initializeDragAndDrop() {
        this.taskList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.target.classList.add('dragging');
            }
        });

        this.taskList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
            }
        });

        this.taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggedItem = this.taskList.querySelector('.dragging');
            if (!draggedItem) return;

            const siblings = [...this.taskList.querySelectorAll('.task-item:not(.dragging)')];
            const nextSibling = siblings.find(sibling => {
                return e.clientY < sibling.getBoundingClientRect().top + sibling.getBoundingClientRect().height / 2;
            });

            this.taskList.insertBefore(draggedItem, nextSibling);
        });

        this.taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedId = parseInt(e.dataTransfer.getData('text/plain'));

            const newOrder = [...this.taskList.querySelectorAll('.task-item')].map(
                item => parseInt(item.dataset.id)
            );

            const currentTask = this.currentTask ? [this.currentTask] : [];
            const completedTasks = this.tasks.filter(task => task.completed);
            const queuedTasksMap = {};

            this.tasks
                .filter(task => !task.completed && task.id !== this.currentTask?.id)
                .forEach(task => {
                    queuedTasksMap[task.id] = task;
                });

            const orderedQueuedTasks = newOrder.map(id => queuedTasksMap[id]);

            this.tasks = [...currentTask, ...orderedQueuedTasks, ...completedTasks];
            this.saveTasks();
            this.showNotification("Task order updated!");
        });
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
            taskItem.draggable = true;
            taskItem.innerHTML = `
        <span class="task-name" 
            contenteditable="true" 
            data-task-id="${task.id}">${task.name}</span>
            <div class="task-actions">
                <button class="delete-btn" onclick="window.pomodoroTimer.deleteTask(${task.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </span>
      `;

            const taskName = taskItem.querySelector(".task-name");
            this.initializeEditableTask(taskName);

            this.taskList.appendChild(taskItem);
        });
    }

    initializeEditableTask(element) {
        element.addEventListener("blur", () => {
            const taskId = parseInt(element.dataset.taskId);
            const newName = element.textContent.trim();
            if (newName && newName !== this.currentTask?.name) {
                this.updateTaskName(taskId, newName);
            }
        });

        element.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                element.blur();
            }
        });

        element.addEventListener("focus", () => {
            const taskItem = element.closest('.task-item');
            if (taskItem) {
                taskItem.draggable = false;
            }
        });

        element.addEventListener("blur", () => {
            const taskItem = element.closest('.task-item');
            if (taskItem) {
                taskItem.draggable = true;
            }
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
            if (this.currentFlowStreak) {
                pointsEarned += 30; // Significant bonus for maintaining flow
                this.showNotification(`focus state bonus! +30 points`);
            }
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        this.saveTasks();
        this.updateCurrentTask();
        this.renderTasks();
    }

    setupQueueToggle() {
        const toggleBtn = document.getElementById("toggleQueue");
        const taskQueue = document.getElementById("taskQueue");

        toggleBtn.addEventListener("click", () => {
            taskQueue.classList.toggle("show");
            toggleBtn.innerHTML = taskQueue.classList.contains("show")
                ? "Hide Queue"
                : "Show Queue";
        });
    }

    completeSession() {
        clearInterval(this.interval);
        this.isRunning = false;

        if (this.mode === "focus") {
            const message = "Pomodoro completed! Great work!";
            this.sendBrowserNotification("Focus Session Complete", message);

            if (this.currentFlowStreak) {
                this.focusScore += 30;
                localStorage.setItem("focusScore", this.focusScore.toString())
                this.showNotification("Flow state bonus! +30 points");
            }

            this.showNotification(message);
            this.mode = "break";
            this.timeLeft = this.settings.breakDuration * 60;
            this.statusText.textContent = "Time for a break";
            this.breakBtn.textContent = "End Break";
        } else {
            const message = "Break completed! Ready to focus?";
            this.showNotification(message);
            this.sendBrowserNotification("Break Complete", message);
            this.mode = "focus";
            this.timeLeft = this.settings.focusDuration * 60;
            this.statusText.textContent = "Time to focus";
            this.breakBtn.textContent = "Take Break";
        }

        this.startBtn.textContent = "Start";
        this.timerDisplay.classList.remove("running");
        this.updateDisplay();
        this.updateStats();
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
        this.setReminderNotifications();
    }

    pauseTimer() {
        this.isRunning = false;
        this.startBtn.textContent = "Resume";
        this.timerDisplay.classList.remove("running");
        clearInterval(this.interval);

        if (this.reminderTimeout) {
            clearTimeout(this.reminderTimeout);
        }

        if (this.mode === "focus") {
            this.currentFlowStreak = false;
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
        // document.querySelector(
        //   ".stat-card:nth-child(1) .stat-value"
        // ).textContent = this.focusScore;
        document.querySelector(
            ".stat-card:nth-child(1) .stat-value"
        ).textContent = `${this.focusScore} / ${this.bestScore}`;
        document.querySelector(
            ".stat-card:nth-child(1) .stat-label"
        ).textContent = "Focus Score / Best";
        document.querySelector(
            ".stat-card:nth-child(2) .stat-value"
        ).textContent = this.tasksComplete;
    }

    initializeNotifications() {
        if ("Notification" in window) {
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        }
    }

    sendBrowserNotification(title, message) {
        if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification(title, {
                body: message,
                icon: "/favicon" 
            });
            setTimeout(() => notification.close(), 5000);
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }

    setReminderNotifications() {
        if (this.reminderTimeout) {
            clearTimeout(this.reminderTimeout);
        }

        if (!this.isRunning) return;

        const fifteenMinutesInSeconds = 15 * 60;
        if (this.timeLeft > fifteenMinutesInSeconds) {
            this.reminderTimeout = setTimeout(() => {
                const mode = this.mode === "focus" ? "focus session" : "break";
                this.sendBrowserNotification(
                    "15 Minutes Remaining",
                    `You have 15 minutes left in your current ${mode}.`
                );
                this.showNotification("15 minutes remaining!");
            }, (this.timeLeft - fifteenMinutesInSeconds) * 1000);
        }

        const fiveMinuteInSeconds = 5 * 60;
        if (this.timeLeft > fiveMinuteInSeconds) {
            setTimeout(() => {
                const mode = this.mode === "focus" ? "focus session" : "break";
                this.sendBrowserNotification(
                    "5 Minute Remaining",
                    `You have 5 minute left in your current ${mode}.`
                );
                this.showNotification("5 minute remaining!");
            }, (this.timeLeft - fiveMinuteInSeconds) * 1000);
        }
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