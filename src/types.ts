import ts from 'typescript';
import { Worker } from 'worker_threads';
import * as os from 'os';
import { LogLevel } from './logger';

/**
 * Cache for tracking file modifications for incremental compilation
 */
export interface FileInfo {
  timestamp: number;
  contentHash: string;
}

/**
 * Configuration options for the Type Compiler
 */
export interface TypeCompilerOptions {
  /**
   * When true, automatically generate Zod schemas for
   * interfaces and type aliases
   */
  generateZodSchemas?: boolean;
  
  /**
   * When true, validate any types during compilation
   */
  strictTypeChecking?: boolean;
  
  /**
   * Prefix for generated Zod schema variables
   */
  zodSchemaPrefix?: string;
  
  /**
   * When true, generate validation functions for class methods
   */
  validateClassMethods?: boolean;

  /**
   * When true, only generate schemas for exported types
   */
  onlyExported?: boolean;
  
  /**
   * List of specific type names to include in schema generation
   * even if they don't match other inclusion criteria
   */
  includedTypes?: string[];
  
  /**
   * List of specific type names to exclude from schema generation
   * even if they match other inclusion criteria
   */
  excludedTypes?: string[];
  
  /**
   * Glob patterns of files to exclude from processing
   */
  excludePatterns?: string[];
  
  /**
   * When true, enables the global type cache for improved performance
   */
  useGlobalCache?: boolean;
  
  /**
   * Maximum number of entries to keep in the global type cache
   */
  maxCacheSize?: number;
  
  /**
   * When true, enables incremental compilation, only processing files that have changed
   */
  incrementalCompilation?: boolean;
  
  /**
   * Path to store the incremental compilation cache
   * If not provided, cache is kept in memory only for the current session
   */
  incrementalCachePath?: string;
  
  /**
   * When true, enables parallel processing of types using worker threads
   */
  parallelProcessing?: boolean;
  
  /**
   * Number of worker threads to use for parallel processing
   * If not provided, defaults to the number of CPU cores - 1 (minimum 1)
   */
  workerCount?: number;
  
  /**
   * Maximum number of types to process in a single worker batch
   */
  workerBatchSize?: number;

  /**
   * When true, skips importing Zod schemas
   */
  skipZodImport?: boolean;

  /**
   * Explicitly set the log level
   */
  logLevel?: LogLevel;

  /**
   * When true, outputs more detailed logs (sets logLevel to INFO if logLevel not specified)
   */
  verbose?: boolean;

  /**
   * When true, outputs debug information (sets logLevel to DEBUG if logLevel not specified)
   */
  debug?: boolean;

  /**
   * When true, suppresses all non-error output (sets logLevel to ERROR if logLevel not specified)
   */
  silent?: boolean;

  /**
   * When true, logs will include timing information for performance analysis
   */
  logPerformance?: boolean;

  /**
   * Path to write logs to a file in addition to console output
   */
  logFilePath?: string;

  /**
   * When true, disables color output in logs
   */
  noColor?: boolean;
}

/**
 * Default compiler options
 */
export const defaultCompilerOptions: TypeCompilerOptions = {
  generateZodSchemas: false,
  strictTypeChecking: false,
  zodSchemaPrefix: 'z',
  validateClassMethods: false,
  onlyExported: false,
  includedTypes: [],
  excludedTypes: [],
  excludePatterns: [],
  useGlobalCache: true,
  maxCacheSize: 10000,
  incrementalCompilation: false,
  parallelProcessing: false,
  workerCount: Math.max(1, os.cpus().length - 1),
  workerBatchSize: 100,
  skipZodImport: false,
  logPerformance: false,
  verbose: false,
  debug: false,
  silent: false,
  noColor: false
};

/**
 * Worker task data structure
 */
export interface WorkerTaskData {
  taskId: string;
  typeData: {
    name: string;
    kind: string;
    flags: number;
    [key: string]: any;
  };
  options: TypeCompilerOptions;
}

/**
 * Worker result data structure
 */
export interface WorkerResultData {
  success: boolean;
  result?: string;
  error?: string;
  taskId: string;
}

/**
 * Queue task structure
 */
export interface QueueTask {
  taskId: string;
  data: WorkerTaskData;
  resolve: (result: string) => void;
  reject: (error: Error) => void;
} 