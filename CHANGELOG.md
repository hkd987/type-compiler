# Changelog

## [1.0.1] - 2025-03-16
### Changed
- Bug fixes and improvements

## [1.0.0] - 2024-07-01
### Added
- Custom error messages for validators
  - Support for field-level custom error messages
  - Support for pattern-based validator error messages
  - Support for contextual validator error messages
  - Improved user experience with more helpful validation feedback
- TypeScript Language Service plugin for enhanced IDE integration
- Contextual validation based on parent type names
- Pattern-based field validation with regex support
- IDE features:
  - Hover tooltips showing validation rules
  - Code completion suggestions for validated fields
  - Diagnostics for fields with special validation
- Parallel processing feature using worker threads for improved performance
- New configuration options:
  - `parallelProcessing` - Enable/disable parallel processing
  - `workerCount` - Control number of worker threads
  - `workerBatchSize` - Adjust batch size for worker tasks
- Support for TypeScript mapped types conversion to Zod schemas
- Enhanced support for generic types in TypeScript to Zod conversion
- Initial implementation of TypeScript to Zod schema conversion
- Support for interfaces, type aliases, and enums
- Class constructor and method validation
- Runtime type checking with Zod
- Comprehensive documentation for all features
- Examples demonstrating usage of all features
- Unit tests for all functionality

### Improved
- More efficient type handling with batch processing
- Enhanced documentation with detailed performance optimization guidelines
- Better error handling for worker thread failures
- Optimized type serialization for cross-thread communication
- Enhanced type resolution for complex types
- Better handling of property transformations
- Improved type parameter resolution within generic context
- Prevent infinite recursion with circular type references
- Better handling of type parameters in nested objects 