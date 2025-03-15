import { Logger, LogLevel, logger } from '../logger';
import { TypeCompilerOptions } from '../types';

// Mock console methods
const originalConsole = { ...console };
let consoleOutput: any[] = [];

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((...args) => {
    consoleOutput.push({ type: 'log', args });
  });
  console.error = jest.fn((...args) => {
    consoleOutput.push({ type: 'error', args });
  });
  console.warn = jest.fn((...args) => {
    consoleOutput.push({ type: 'warn', args });
  });
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

describe('Logger Module', () => {
  test('should create a logger with default configuration', () => {
    const testLogger = new Logger();
    expect(testLogger).toBeDefined();
  });

  test('should respect log level configuration', () => {
    const testLogger = new Logger({ level: LogLevel.ERROR });
    
    testLogger.error('Error message');
    testLogger.warn('Warning message');
    testLogger.info('Info message');
    
    expect(consoleOutput.length).toBe(1);
    expect(consoleOutput[0].type).toBe('error');
    expect(consoleOutput[0].args[0]).toContain('Error message');
  });

  test('should include context in log messages', () => {
    const testLogger = new Logger({ level: LogLevel.INFO });
    const context = { user: 'test', id: 123 };
    
    testLogger.info('Info with context', context);
    
    expect(consoleOutput.length).toBe(1);
    expect(consoleOutput[0].args[0]).toContain('Info with context');
    expect(consoleOutput[0].args[0]).toContain('test');
    expect(consoleOutput[0].args[0]).toContain('123');
  });

  test('should configure from TypeCompilerOptions', () => {
    const testLogger = new Logger();
    
    // Test with debug option
    testLogger.configureFromOptions({ debug: true } as TypeCompilerOptions);
    testLogger.debug('Debug message');
    expect(consoleOutput.length).toBe(1);
    
    // Clear output
    consoleOutput = [];
    
    // Test with silent option
    testLogger.configureFromOptions({ silent: true } as TypeCompilerOptions);
    testLogger.info('Should not appear');
    testLogger.error('Should appear');
    expect(consoleOutput.length).toBe(1);
    expect(consoleOutput[0].type).toBe('error');
  });

  test('should track metrics correctly', () => {
    const testLogger = new Logger({ level: LogLevel.DEBUG });
    
    testLogger.resetMetrics();
    testLogger.incrementMetric('filesProcessed', 5);
    testLogger.incrementMetric('typesProcessed');
    testLogger.incrementMetric('errors', 2);
    
    testLogger.logCompilationSummary();
    
    const summaryOutput = consoleOutput.find(output => 
      output.args[0].includes('Compilation completed')
    );
    
    expect(summaryOutput).toBeDefined();
    expect(summaryOutput.args[0]).toContain('filesProcessed');
    expect(summaryOutput.args[0]).toContain('5');
    expect(summaryOutput.args[0]).toContain('typesProcessed');
    expect(summaryOutput.args[0]).toContain('1');
    expect(summaryOutput.args[0]).toContain('errors');
    expect(summaryOutput.args[0]).toContain('2');
  });

  test('should measure time with startTimer', async () => {
    const testLogger = new Logger({ level: LogLevel.DEBUG });
    
    const endTimer = testLogger.startTimer('Test operation');
    
    // Wait a bit to have measurable time
    await new Promise(resolve => setTimeout(resolve, 5));
    
    endTimer();
    
    const timerOutput = consoleOutput.find(output => 
      output.args[0].includes('Test operation completed in')
    );
    
    expect(timerOutput).toBeDefined();
    expect(timerOutput.args[0]).toMatch(/completed in \d+ms/);
  });

  test('global logger instance should be available', () => {
    expect(logger).toBeDefined();
    expect(logger).toBeInstanceOf(Logger);
    
    logger.info('Test global logger');
    
    expect(consoleOutput.length).toBe(1);
    expect(consoleOutput[0].args[0]).toContain('Test global logger');
  });
}); 