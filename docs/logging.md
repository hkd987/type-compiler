# Type Compiler Logging System

The type-compiler plugin includes a powerful, flexible logging system that helps you understand what's happening during compilation, diagnose issues, and monitor performance.

## Logging Levels

The logging system supports five levels of verbosity:

| Level | Description | Use Case |
|-------|-------------|----------|
| ERROR | Only critical errors | Production builds where you want minimal output |
| WARN  | Errors and warnings | Identifying potential issues that don't prevent compilation |
| INFO  | Basic information about compilation | Default level, suitable for most use cases |
| DEBUG | Detailed information for debugging | Troubleshooting issues or understanding the compilation process |
| TRACE | Very verbose logging | Deep debugging of specific compiler parts |

## Configuration Options

You can configure the logging behavior through your `tsconfig.json` file in the plugin options:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "generateZodSchemas": true,
        // Logging options
        "debug": true,         // Set log level to DEBUG
        "verbose": true,       // Set log level to INFO if not already higher
        "silent": false,       // When true, only shows errors
        "logLevel": "DEBUG",   // Explicitly set log level (overrides debug/verbose/silent)
        "logPerformance": true, // Log performance metrics
        "logFilePath": "./logs/type-compiler.log", // Optional file output path
        "noColor": false       // Disable colors in log output
      }
    ]
  }
}
```

Or you can configure it programmatically:

```typescript
import { typeCompilerPlugin, Logger, LogLevel } from 'type-compiler';
import ts from 'typescript';

// Configure the global logger
import { logger } from 'type-compiler';
logger.configure({ 
  level: LogLevel.DEBUG,
  useColors: true,
  includeTimestamps: true
});

// Or create your own logger instance
const customLogger = new Logger({ 
  level: LogLevel.DEBUG,
  useColors: true,
  includeTimestamps: true,
  logToFile: true,
  logFilePath: './custom-log.txt'
});
```

## Log Output Format

Log messages include:

1. Timestamp (if `includeTimestamps` is true)
2. Log level with color-coding (if `useColors` is true)
3. Message text
4. Optional context data (formatted as JSON)

Example output:

```
[2023-06-15T12:34:56.789Z] [INFO] Initializing type-compiler plugin {"generateZodSchemas":true,"parallelProcessing":true}
[2023-06-15T12:34:56.799Z] [DEBUG] Transformer factory created
[2023-06-15T12:34:56.810Z] [INFO] Processing file: src/types.ts
[2023-06-15T12:34:56.899Z] [DEBUG] Generated 15 schemas in 89ms
```

## Performance Logging

The type-compiler includes built-in performance logging to help you identify bottlenecks and optimize your build process:

```json
{
  "plugins": [
    {
      "name": "type-compiler",
      "logPerformance": true
    }
  ]
}
```

With performance logging enabled, you'll see:

1. Time taken for each file and type processed
2. Cache hit/miss rates
3. Worker thread utilization (when parallel processing is enabled)
4. Overall compilation metrics

Example performance summary:

```
[INFO] Compilation completed {
  "elapsedTime": "3.45s",
  "typesProcessed": 346,
  "filesProcessed": 28,
  "cacheHits": 230,
  "cacheMisses": 116,
  "workerTasksProcessed": 116,
  "errors": 0,
  "warnings": 2
}
[INFO] Processed 346 types (100.29 types/sec)
[INFO] Cache hit rate: 66.47% (230 hits, 116 misses)
```

## Diagnostic Integration

The logger integrates with TypeScript's diagnostic system, providing properly formatted and color-coded diagnostic messages:

```typescript
// Log TypeScript diagnostics
const diagnostics = ts.getPreEmitDiagnostics(program);
logger.logDiagnostics(diagnostics);
```

This produces user-friendly error and warning messages with source file locations.

## Use in Custom Plugins

If you're extending the type-compiler or building your own TypeScript plugin, you can use the logging system:

```typescript
import { logger } from 'type-compiler';

// Log at different levels
logger.error('Critical error occurred', { details: 'error details' });
logger.warn('Warning: this might cause issues');
logger.info('Processing file', { fileName: 'example.ts' });
logger.debug('Detailed debug information');
logger.trace('Very verbose information');

// Time an operation
const endTimer = logger.startTimer('Complex operation');
// ... perform operation
endTimer(); // Logs: "Complex operation completed in XXXms"
```

## Troubleshooting

If you're experiencing issues with the type-compiler, enabling debug logging often helps identify the problem:

```json
{
  "plugins": [
    {
      "name": "type-compiler",
      "debug": true
    }
  ]
}
```

Common issues that can be diagnosed through logs:

1. Files not being processed (check file exclusion patterns)
2. Types missing schemas (check exclusion or inclusion lists)
3. Performance bottlenecks (enable performance logging)
4. Worker thread issues (when using parallel processing)

## Log File Output

To save logs to a file for later analysis:

```json
{
  "plugins": [
    {
      "name": "type-compiler",
      "logFilePath": "./logs/type-compiler.log"
    }
  ]
}
```

This creates a log file in the specified location with all log messages, which can be useful for:

1. Sharing logs when reporting issues
2. Analyzing performance across different builds
3. Tracking changes in compilation over time 