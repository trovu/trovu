/** @module Logger */

/** Logs errors and warnings. */

export default class Logger {
  logs: Array<{ level: string; message: string }>;
  logElement: HTMLElement | null;

  /**
   * Set helper variables.
   */
  constructor(logElementSelector = "") {
    this.logs = [];
    this.logElement = null;
    if (!(typeof document === "undefined") && logElementSelector) {
      this.logElement = document.querySelector(logElementSelector) as HTMLElement | null;
    }
  }

  log(level: string, message: string) {
    // Check if message is already in this.logs
    // if yes, do not log again
    if (this.logs.some((log) => log.level === level && log.message === message)) {
      return;
    }
    this.logs.push({
      level: level,
      message: message,
    });
    console.log(level, message);
    if (this.logElement) {
      this.logElement.textContent += `${message}\n`;
    }
  }
  info(message: string) {
    this.log("info", message);
  }
  warning(message: string) {
    this.log("warning", message);
    this.showLog();
  }
  success(message: string) {
    this.log("success", message);
  }
  error(message: string) {
    this.log("error", message);
    this.showLog();
    throw new Error(message);
  }
  showLog() {
    if (this.logElement) {
      this.logElement.removeAttribute("hidden");
    }
  }
}
