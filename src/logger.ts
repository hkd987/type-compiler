import ts from 'typescript';
import { TypeCompilerOptions } from './types';

/**
 * Log levels for the type compiler
 */
export enum LogLevel {
  ERROR = 0,   // Only errors
  WARN = 1,    // Errors and warnings
  INFO = 2,    // Basic information about the compilation process
  DEBUG = 3,   // Detailed information for debugging
  TRACE = 4    // Very verbose logging
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /**
   * The minimum log level to display
   */
  level: LogLevel;

  /**
   * Whether to use colors in the console output
   */
  useColors: boolean;

  /**
   * Whether to include timestamps in log messages
   */
  includeTimestamps: boolean;

  /**
   * Whether to log to a file in addition to the console
   */
  logToFile: boolean;

  /**
   * The path to the log file (if logToFile is true)
   */
  logFilePath?: string;

  /**
   * Custom log filter function. Return true to include the message, false to exclude it.
   */
  filter?: (level: LogLevel, message: string, context?: Record<string, any>) => boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  useColors: true,
  includeTimestamps: true,
  logToFile: false
};

/**
 * Colors for different log levels when useColors is true
 */
const COLORS = {
  [LogLevel.ERROR]: '\x1b[31m', // Red
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.INFO]: '\x1b[36m',  // Cyan
  [LogLevel.DEBUG]: '\x1b[90m', // Gray
  [LogLevel.TRACE]: '\x1b[90m', // Gray
  RESET: '\x1b[0m'
};

/**
 * Logger class for the type compiler
 */
export class Logger {
  private config: LoggerConfig;
  private buffer: string[] = [];
  private startTime: number = Date.now();
  private compilationMetrics: Record<string, number> = {
    typesProcessed: 0,
    filesProcessed: 0,
    cacheHits: 0,
    cacheMisses: 0,
    workerTasksProcessed: 0,
    errors: 0,
    warnings: 0
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Reconfigure the logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Configure the logger from TypeCompilerOptions
   */
  configureFromOptions(options: TypeCompilerOptions): void {
    const level = this.getLogLevelFromOptions(options);
    this.configure({ level });
  }

  /**
   * Map TypeCompilerOptions to LogLevel
   */
  private getLogLevelFromOptions(options: TypeCompilerOptions): LogLevel {
    if (options.logLevel !== undefined) {
      return options.logLevel;
    }

    // Determine log level based on other options
    if (options.debug === true) {
      return LogLevel.DEBUG;
    }
    if (options.verbose === true) {
      return LogLevel.INFO;
    }
    if (options.silent === true) {
      return LogLevel.ERROR;
    }

    return LogLevel.INFO; // Default log level
  }

  /**
   * Log a message at a specific level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level > this.config.level) {
      return;
    }

    if (this.config.filter && !this.config.filter(level, message, context)) {
      return;
    }

    let formattedMessage = '';

    // Add timestamp if configured
    if (this.config.includeTimestamps) {
      const timestamp = new Date().toISOString();
      formattedMessage += `[${timestamp}] `;
    }

    // Add log level indicator
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    const levelName = levelNames[level] || 'UNKNOWN';

    // Add colors if configured
    if (this.config.useColors) {
      formattedMessage += `${COLORS[level]}[${levelName}]${COLORS.RESET} `;
    } else {
      formattedMessage += `[${levelName}] `;
    }

    // Add the message
    formattedMessage += message;

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      const contextStr = JSON.stringify(context, null, 2);
      formattedMessage += ` ${contextStr}`;
    }

    // Output to console
    if (level === LogLevel.ERROR) {
      console.error(formattedMessage);
      this.compilationMetrics.errors++;
    } else if (level === LogLevel.WARN) {
      console.warn(formattedMessage);
      this.compilationMetrics.warnings++;
    } else {
      console.log(formattedMessage);
    }

    // Store in buffer for later retrieval
    this.buffer.push(formattedMessage);

    // TODO: Log to file if configured
    // This would be implemented with Node.js fs functions
  }

  /**
   * Log an error message
   */
  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log a trace message
   */
  trace(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  /**
   * Handle TypeScript diagnostics
   */
  logDiagnostics(diagnostics: readonly ts.Diagnostic[]): void {
    if (diagnostics.length === 0) {
      return;
    }

    this.info(`Found ${diagnostics.length} TypeScript diagnostic messages`);

    for (const diagnostic of diagnostics) {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      
      if (diagnostic.category === ts.DiagnosticCategory.Error) {
        this.error(message, this.formatDiagnosticLocation(diagnostic));
      } else if (diagnostic.category === ts.DiagnosticCategory.Warning) {
        this.warn(message, this.formatDiagnosticLocation(diagnostic));
      } else {
        this.info(message, this.formatDiagnosticLocation(diagnostic));
      }
    }
  }

  /**
   * Format diagnostic location information
   */
  private formatDiagnosticLocation(diagnostic: ts.Diagnostic): Record<string, any> | undefined {
    if (!diagnostic.file || diagnostic.start === undefined) {
      return undefined;
    }

    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return {
      file: diagnostic.file.fileName,
      line: line + 1,
      character: character + 1
    };
  }

  /**
   * Update compilation metrics
   */
  updateMetrics(metrics: Partial<Record<string, number>>): void {
    Object.assign(this.compilationMetrics, metrics);
  }

  /**
   * Increment a specific metric
   */
  incrementMetric(metric: string, amount: number = 1): void {
    if (this.compilationMetrics[metric] !== undefined) {
      this.compilationMetrics[metric] += amount;
    } else {
      this.compilationMetrics[metric] = amount;
    }
  }

  /**
   * Log compilation summary
   */
  logCompilationSummary(): void {
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    
    this.info('Compilation completed', {
      elapsedTime: `${elapsedTime.toFixed(2)}s`,
      ...this.compilationMetrics
    });

    // Log performance information
    if (this.compilationMetrics.typesProcessed > 0) {
      const typesPerSecond = (this.compilationMetrics.typesProcessed / elapsedTime).toFixed(2);
      this.info(`Processed ${this.compilationMetrics.typesProcessed} types (${typesPerSecond} types/sec)`);
    }

    if (this.compilationMetrics.cacheHits > 0 || this.compilationMetrics.cacheMisses > 0) {
      const totalCacheRequests = this.compilationMetrics.cacheHits + this.compilationMetrics.cacheMisses;
      const cacheHitRate = (this.compilationMetrics.cacheHits / totalCacheRequests * 100).toFixed(2);
      this.info(`Cache hit rate: ${cacheHitRate}% (${this.compilationMetrics.cacheHits} hits, ${this.compilationMetrics.cacheMisses} misses)`);
    }

    // Log errors and warnings
    if (this.compilationMetrics.errors > 0 || this.compilationMetrics.warnings > 0) {
      this.info(`Encountered ${this.compilationMetrics.errors} errors and ${this.compilationMetrics.warnings} warnings`);
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(label: string): () => void {
    const startTime = Date.now();
    
    // Return a function that, when called, will end the timer and log the duration
    return () => {
      const duration = Date.now() - startTime;
      this.debug(`${label} completed in ${duration}ms`);
    };
  }

  /**
   * Get the log buffer
   */
  getBuffer(): string[] {
    return [...this.buffer];
  }

  /**
   * Clear the log buffer
   */
  clearBuffer(): void {
    this.buffer = [];
  }

  /**
   * Reset compilation metrics
   */
  resetMetrics(): void {
    this.startTime = Date.now();
    Object.keys(this.compilationMetrics).forEach(key => {
      this.compilationMetrics[key] = 0;
    });
  }
}

// Create a global logger instance with default configuration
export const logger = new Logger();

// Helper function to get the global logger
export function getLogger(): Logger {
  return logger;
} 