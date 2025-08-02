import fs from 'fs';
import path from 'path';

interface LogLevel {
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
};

class Logger {
  private logLevel: string;
  private logFile: string;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || 'logs/fertyflow.log';
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(level: string, message: string, data?: any): void {
    const formattedMessage = this.formatMessage(level, message, data);
    
    // Always write to file
    this.writeToFile(formattedMessage);
    
    // Console output based on environment
    if (process.env.NODE_ENV === 'development') {
      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error(formattedMessage);
          break;
        case LOG_LEVELS.WARN:
          console.warn(formattedMessage);
          break;
        case LOG_LEVELS.DEBUG:
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }
  }

  info(message: string, data?: any): void {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LOG_LEVELS.ERROR, message, data);
  }

  debug(message: string, data?: any): void {
    if (this.logLevel === 'debug') {
      this.log(LOG_LEVELS.DEBUG, message, data);
    }
  }
}

export const logger = new Logger();