# Changelog

## [Unreleased]
### Added
- Custom error messages for validators
  - Support for field-level custom error messages
  - Support for pattern-based validator error messages
  - Support for contextual validator error messages
  - Improved user experience with more helpful validation feedback

## [Unreleased] - 2024-06-20
### Added
- TypeScript Language Service plugin for enhanced IDE integration
- Contextual validation based on parent type names
- Pattern-based field validation with regex support
- IDE features:
  - Hover tooltips showing validation rules
  - Code completion suggestions for validated fields
  - Diagnostics for fields with special validation
- Comprehensive documentation for IDE integration
- Examples demonstrating language service features
- Unit tests for language service functionality

## [Unreleased] - 2024-06-10
### Added
- Parallel processing feature using worker threads for improved performance
- New configuration options:
  - `parallelProcessing` - Enable/disable parallel processing
  - `workerCount` - Control number of worker threads
  - `workerBatchSize` - Adjust batch size for worker tasks
- Worker pool implementation for efficient task distribution
- Automatic worker lifecycle management
- Thread-safe type processing

### Improved
- More efficient type handling with batch processing
- Enhanced documentation with detailed performance optimization guidelines
- Better error handling for worker thread failures
- Optimized type serialization for cross-thread communication

## [Unreleased] - YYYY-MM-DD
### Added
- Support for TypeScript mapped types conversion to Zod schemas
- Built-in utility types handling (Partial, Pick, Omit, Record, Readonly, etc.)
- Custom mapped types with property transformations
- Conditional types within mapped types
- Added extensive documentation for working with mapped types
- Created examples demonstrating mapped types usage
- New test suite for verifying mapped types support

### Improved
- Enhanced type resolution for complex types
- Better handling of property transformations

## [Unreleased] - YYYY-MM-DD
### Added
- Enhanced support for generic types in TypeScript to Zod conversion
- Generate function-based Zod schemas for generic interfaces and type aliases
- Support for resolving and mapping type parameters within generic types
- Added handling for complex generic patterns:
  - Record types with generic value types
  - Promise types for async operations
  - Nested generic types
- New test suite specifically for verifying generic type support
- Comprehensive documentation for working with generic types
- Example code demonstrating usage of generic types with the compiler

### Fixed
- Improved type parameter resolution within generic context
- Prevent infinite recursion with circular type references
- Better handling of type parameters in nested objects

## [Unreleased] - YYYY-MM-DD
### Added
- Initial implementation of TypeScript to Zod schema conversion
- Support for interfaces, type aliases, and enums
- Class constructor and method validation
- Runtime type checking with Zod 