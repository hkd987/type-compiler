# Type Compiler Modular Architecture

## Overview

This project has been structured with a modular architecture to improve maintainability, readability, and testability. Instead of a single monolithic `index.ts` file, the code is now organized into separate modules with clear responsibilities.

## Module Structure

The codebase is now organized into the following modules:

### 1. `types.ts`

Contains all type definitions and interfaces used throughout the codebase.

- `TypeCompilerOptions` - Configuration options for the plugin
- `FileInfo` - Interface for caching file information
- Worker-related interfaces (`WorkerTaskData`, `WorkerResultData`, `QueueTask`)
- Default compiler options

### 2. `cache.ts`

Handles caching of processed files and types.

- `FileCache` class - Manages file-level caching for incremental compilation
- `globalTypeCache` - Caches processed type schemas
- File change detection functions (`isFileUnchanged`, `markFileAsProcessed`)

### 3. `utils.ts`

Contains utility functions shared across the codebase.

- `shouldProcessFile` - Determines if a file should be processed
- `shouldProcessType` - Determines if a type should be processed
- `isExported` - Checks if a node is exported
- `generateStableTypeId` - Generates a unique ID for a type

### 4. `type-processor.ts`

Handles the analysis and processing of TypeScript types.

- `typeToZodSchema` - Converts TypeScript types to Zod schemas
- `generateFunctionParamsValidator` - Generates validators for function parameters
- `generateClassValidators` - Generates validators for class methods
- `processTypeWithWorker` - Processes types using worker threads

### 5. `parallel.ts`

Implements parallel processing using worker threads.

- `WorkerPool` class - Manages worker threads for parallel processing
- `getWorkerPool` - Creates a worker pool based on options
- Worker thread initialization and message handling

### 6. `transformers.ts`

Contains TypeScript transformer factories.

- `createZodTransformer` - Creates a transformer for generating Zod schemas
- `createTypeCompilerPlugin` - Creates the main transformer
- Helper functions for creating import statements and processing types

### 7. `logger.ts`

Provides a flexible and configurable logging system.

- `Logger` class - Core logging functionality with different log levels
- `LogLevel` enum - Defines the available log levels (ERROR, WARN, INFO, DEBUG, TRACE)
- Global logger instance for use throughout the codebase
- Performance tracking and metrics collection
- TypeScript diagnostic integration
- Time measurement utilities for performance analysis

### 8. `index.ts`

Main entry point that imports and re-exports all functionality.

- Named and default export for `typeCompilerPlugin` - Main plugin entry point
- Named export for `zodSchemaPlugin` - Convenience function for Zod schema generation
- Re-exports of all types and utilities for advanced usage

## Building the Project

To build the project:

```bash
npm run build
```

This will compile all modules and create the appropriate entry point.

## Benefits of the Modular Architecture

1. **Maintainability**: Each module has a single responsibility, making it easier to understand and modify.
2. **Testability**: Modules can be tested in isolation, leading to more robust test coverage.
3. **Readability**: Smaller files with focused functionality are easier to read and understand.
4. **Collaboration**: Multiple developers can work on different modules simultaneously with fewer merge conflicts.
5. **Extensibility**: New features can be added by creating new modules or extending existing ones.

## How to Extend the Architecture

When adding new features to the codebase:

1. Identify the appropriate module for your feature based on its responsibility.
2. If your feature doesn't fit into any existing module, consider creating a new one.
3. Update the `index.ts` file to export any new functionality that should be publicly available.
4. Add tests for your new features in the appropriate test files.

## Backward Compatibility

The modular refactoring maintains backward compatibility through:

1. A default export in `index.ts` that matches the original API
2. Re-exporting all relevant functions and types from the modular components
3. Preserving the same function signatures for public APIs

## Testing

Each module has its own test file in the `__tests__` directory, following the naming convention `moduleName.test.ts`. This allows for focused testing of each module's functionality.

All tests can be run with:

```bash
npm test
```

## Logging System

The project includes a comprehensive logging system through the `logger.ts` module. Key features include:

1. Multiple log levels (ERROR, WARN, INFO, DEBUG, TRACE)
2. Configurable output formatting with timestamps and colors
3. Performance metrics tracking
4. Integration with TypeScript's diagnostic system
5. Timer utilities for measuring performance
6. File output capabilities for persistent logs

For detailed information on using the logging system, see the [logging documentation](./docs/logging.md).

## Future Improvements

Potential future improvements to the architecture include:

1. More extensive documentation for each module
2. Stronger typing across module boundaries
3. Performance optimizations for the worker thread implementation
4. Addressing Node.js deprecation warnings (e.g., replacing `fs.rmdir` with `fs.rm`)
5. Further modularization of larger components 