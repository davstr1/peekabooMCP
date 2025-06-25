import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, SimpleLogger } from '../logger.js';

describe('Logger', () => {
  const originalEnv = process.env.LOG_LEVEL;
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    process.env.LOG_LEVEL = originalEnv;
  });
  
  test('creates logger with default info level', () => {
    const logger = createLogger('test');
    expect(logger).toBeInstanceOf(SimpleLogger);
  });
  
  test('respects LOG_LEVEL environment variable', () => {
    process.env.LOG_LEVEL = 'debug';
    const logger = createLogger('test');
    
    logger.debug('debug message');
    expect(consoleLogSpy).toHaveBeenCalled();
  });
  
  test('formats messages with timestamp and level', () => {
    const logger = createLogger('test-logger', 'error');
    logger.error('test error');
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    const call = consoleErrorSpy.mock.calls[0][0];
    expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    expect(call).toContain('[ERROR]');
    expect(call).toContain('[test-logger]');
    expect(call).toContain('test error');
  });
  
  test('respects log level hierarchy', () => {
    const logger = createLogger('test', 'warn');
    
    logger.error('error'); // Should log
    logger.warn('warn');   // Should log
    logger.info('info');   // Should NOT log
    logger.debug('debug'); // Should NOT log
    
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
  
  test('passes additional arguments', () => {
    const logger = createLogger('test', 'error');
    const error = new Error('test error');
    const data = { foo: 'bar' };
    
    logger.error('Error occurred', error, data);
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error occurred'),
      error,
      data
    );
  });
  
  test('all log levels work correctly', () => {
    const logger = createLogger('test', 'debug');
    
    logger.error('error message');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    
    logger.warn('warn message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    
    logger.info('info message');
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    
    logger.debug('debug message');
    expect(consoleLogSpy).toHaveBeenCalledTimes(2);
  });
});