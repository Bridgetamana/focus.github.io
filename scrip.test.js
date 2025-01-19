const { JSDOM } = require("jsdom");
const { window } = new JSDOM();
global.document = window.document;
global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
};

class PomodoroTimer {
    constructor() {
        this.focusScore = parseInt(localStorage.getItem("focusScore")) || 0;
        this.bestScore = parseInt(localStorage.getItem("bestScore")) || 0;
        this.lastResetDate = localStorage.getItem("lastResetDate") || this.getTodayDate();
    }

    getTodayDate() {
        return new Date().toDateString();
    }

    showNotification(message) {
        console.log(message);
    }

    checkDailyReset() {
        const today = this.getTodayDate();
        if (this.lastResetDate !== today) {
            if (this.focusScore > this.bestScore) {
                this.bestScore = this.focusScore;
                localStorage.setItem("bestScore", this.bestScore.toString());
                this.showNotification("New best score achieved: " + this.bestScore);
            }
            this.focusScore = 0;
            this.lastResetDate = today;
            localStorage.setItem("lastResetDate", today);
            localStorage.setItem("focusScore", "0");
            this.showNotification("New day started! Previous best: " + this.bestScore);
        }
    }
}

test("checkDailyReset updates scores and date correctly", () => {
    localStorage.getItem.mockImplementation((key) => {
        switch (key) {
            case "focusScore":
                return "20"; 
            case "bestScore":
                return "15";
            case "lastResetDate":
                return "Mon Oct 09 2023";
            default:
                return null;
        }
    });

    const timer = new PomodoroTimer();
    timer.showNotification = jest.fn();

    timer.checkDailyReset();

    expect(localStorage.setItem).toHaveBeenCalledWith("bestScore", "20");
    expect(localStorage.setItem).toHaveBeenCalledWith("lastResetDate", timer.getTodayDate());
    expect(localStorage.setItem).toHaveBeenCalledWith("focusScore", "0");
    expect(timer.showNotification).toHaveBeenCalledWith("New day started! Previous best: 20");
});