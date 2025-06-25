export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface Logger {
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

export class SimpleLogger implements Logger {
  private readonly name: string;
  private readonly level: LogLevel;
  
  constructor(name: string, level?: LogLevel) {
    this.name = name;
    this.level = level || (process.env.LOG_LEVEL as LogLevel) || 'info';
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const currentIndex = levels.indexOf(this.level);
    const requestedIndex = levels.indexOf(level);
    return requestedIndex <= currentIndex;
  }
  
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}`;
  }
  
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }
  
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }
}

export function createLogger(name: string, level?: LogLevel): Logger {
  return new SimpleLogger(name, level);
}