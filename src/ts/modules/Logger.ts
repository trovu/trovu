/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/** @module Logger */

/** Logs errors and warnings. */

export default class Logger {
  logs: Array<{ level: string; message: string }>;
  logElement: HTMLElement | null;
  consoleLevels: string[];

  /**
   * Set helper variables.
   */
  constructor(logElementSelector: string = "", options: { consoleLevels?: string[] } = {}) {
    this.logs = [];
    this.consoleLevels = options.consoleLevels || ["warning", "error"];
    if (!(typeof document === "undefined")) {
      this.logElement = logElementSelector ? document.querySelector(logElementSelector) : null;
    }
  }

  setConsoleLevels(levels) {
    this.consoleLevels = levels;
  }

  writeToConsole(level, message) {
    if (!this.consoleLevels.includes(level)) {
      return;
    }
    const consoleMethodByLevel = {
      info: "info",
      success: "log",
      warning: "warn",
      error: "error",
    };
    const consoleMethod = consoleMethodByLevel[level] || "log";
    console[consoleMethod](message);
  }

  log(level, message) {
    // Check if message is already in this.logs
    // if yes, do not log again
    if (this.logs.some((log) => log.level === level && log.message === message)) {
      return;
    }
    this.logs.push({
      level: level,
      message: message,
    });
    this.writeToConsole(level, message);
    if (this.logElement) {
      this.logElement.textContent += `${message}\n`;
    }
  }
  info(message) {
    this.log("info", message);
  }
  warning(message) {
    this.log("warning", message);
    this.showLog();
  }
  success(message) {
    this.log("success", message);
  }
  error(message) {
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
