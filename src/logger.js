class Logger {
  static LEVELS = {
    SILENT: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4
  };

  constructor() {
    this.level = process.env.LOG_LEVEL !== undefined
      ? parseInt(process.env.LOG_LEVEL, 10)
      : Logger.LEVELS.INFO;
  }

  shouldLog(level) {
    return this.level >= level;
  }

  error(...args) {
    if (this.shouldLog(Logger.LEVELS.ERROR)) {
      console.error(...args);
    }
  }

  warn(...args) {
    if (this.shouldLog(Logger.LEVELS.WARN)) {
      console.warn(...args);
    }
  }

  info(...args) {
    if (this.shouldLog(Logger.LEVELS.INFO)) {
      console.log(...args);
    }
  }

  log(...args) {
    this.info(...args);
  }

  debug(...args) {
    if (this.shouldLog(Logger.LEVELS.DEBUG)) {
      console.log(...args);
    }
  }
}

export default new Logger();
