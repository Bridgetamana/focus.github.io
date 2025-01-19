class PomodoroTimer {
    constructor() {
        this.timerDisplay = document.querySelector(".timer-display");
        this.startBtn = document.getElementById("startBtn");
        this.resetBtn = document.getElementById("resetBtn");
        this.breakBtn = document.getElementById("breakBtn");
        this.taskForm = document.getElementById("taskForm");
        this.timeLeft = 25 * 60;
        this.isRunning = false;
        this.interval = null;
        this.mode = "focus";
        
        this.settings = {
            focusDuration: 25,
            breakDuration: 5
        };
        this.initializeEventListeners();
        this.initializeModals();
        this.updateDisplay();
    }
    initializeModals() {
        const helpBtn = document.getElementById("helpBtn");
        const settingsBtn = document.getElementById("settingsBtn");
        const helpModal = document.getElementById("helpModal");
        const settingsModal = document.getElementById("settingsModal");
        
        helpBtn.addEventListener("click", () => {
            helpModal.classList.add("show");
        });
        settingsBtn.addEventListener("click", () => {
            settingsModal.classList.add("show");
        });
        document.querySelectorAll(".modal-overlay, .modal .btn-icon").forEach(elem => {
            elem.addEventListener("click", () => {
                helpModal.classList.remove("show");
                settingsModal.classList.remove("show");
            });
        });
    }
    initializeEventListeners() {
        this.startBtn.addEventListener("click", () => this.toggleTimer());
        this.resetBtn.addEventListener("click", () => this.resetTimer());
        this.breakBtn.addEventListener("click", () => this.toggleBreak());
        if (this.taskForm) {
            this.taskForm.addEventListener("submit", (e) => this.handleTaskSubmit(e));
        }
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
        this.startBtn.textContent = "Start";
        this.timerDisplay.classList.remove("running");
        clearInterval(this.interval);
    }
    resetTimer() {
        this.pauseTimer();
        if (this.mode === "focus") {
            this.timeLeft = this.settings.focusDuration * 60;
        } else {
            this.timeLeft = this.settings.breakDuration * 60;
        }
        this.updateDisplay();
    }
    toggleBreak() {
        this.pauseTimer();
        this.mode = this.mode === "focus" ? "break" : "focus";
        this.resetTimer();
        this.breakBtn.textContent = this.mode === "focus" ? "Start Break" : "End Break";
    }
    tick() {
        this.timeLeft--;
        this.updateDisplay();
        if (this.timeLeft <= 0) {
            this.completeSession();
        }
    }
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
}
document.addEventListener("DOMContentLoaded", () => {
    window.pomodoroTimer = new PomodoroTimer();
});