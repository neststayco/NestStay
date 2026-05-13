/**
 * Structured Logger Service
 * Outputs logs in JSON format for production observability
 */
class Logger {
  static format(level, message, context = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context
    });
  }

  static info(message, context = {}) {
    console.log(this.format("INFO", message, context));
  }

  static error(message, context = {}) {
    console.error(this.format("ERROR", message, context));
  }

  static event(eventName, context = {}) {
    console.log(this.format("EVENT", `Event triggered: ${eventName}`, { event: eventName, ...context }));
  }

  static warn(message, context = {}) {
    console.warn(this.format("WARN", message, context));
  }
}

export default Logger;
