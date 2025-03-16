# Type Compiler

A TypeScript compiler plugin that automatically generates Zod schemas from TypeScript types for runtime validation. The plugin integrates directly with the TypeScript compiler (tsc) to provide runtime type checking through Zod.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Features](#features)
- [Plugin Options](#plugin-options)
- [Examples](#examples)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Development](#development)
- [Testing & Stability](#testing-stability)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install --save-dev type-compiler zod
```

## Getting Started

This guide will help you quickly set up Type Compiler and understand its basic functionality.

### 1. Basic Setup

Add the plugin to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "generateZodSchemas": true
      }
    ]
  }
}
```

### 2. Create a Simple Interface

```typescript
// user.ts
export interface User {
  id: number;
  name: string;
  email: string;
}
```

### 3. Compile Your TypeScript Code

When you compile your code with TypeScript, the plugin automatically generates Zod schemas:

```bash
npx tsc
```

### 4. Use the Generated Schema

The plugin adds a Zod schema to your file with a 'z' prefix:

```typescript
// In user.ts after compilation, you can use:
import { zUser } from './user';

// Get some data (from an API, user input, etc.)
const userData = fetchUserData();

// Validate at runtime
try {
  const validUser = zUser.parse(userData);
  console.log("Valid user:", validUser);
} catch (error) {
  console.error("Invalid user data:", error);
}
```

### 5. Add Field-Specific Validation

For more specific validation requirements, configure special validators:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "generateZodSchemas": true,
        "specialFieldValidators": {
          "email": "z.string().email()",
          "url": "z.string().url()"
        }
      }
    ]
  }
}
```

Now fields named "email" will automatically use `z.string().email()` validation.

### 6. Configure IDE Support

The plugin includes TypeScript Language Service integration that provides:
- Hover tooltips showing validation rules
- Code completion for validated fields
- Visual indicators for fields with special validation

No additional configuration is needed for IDE support beyond the tsconfig.json setup.

## Features

- **Automatic Zod Schema Generation**: Converts TypeScript interfaces and type aliases to Zod schemas
- **TypeScript Language Service Integration**: Provides IDE hints, hover information, and code completion
- **Pattern-Based Field Matching**: Apply validators to fields matching regex patterns
- **Contextual Validation**: Apply different validation to fields based on parent type
- **Class Method Validation**: Generate validators for class constructors and methods
- **Support for Advanced TypeScript Types**:
  - Generic types
  - Mapped types (Partial, Pick, Omit, etc.)
  - Union and intersection types
  - Literal types and more
- **Performance Optimizations**:
  - Global type cache
  - Incremental compilation
  - Parallel processing with worker threads

## Configuration

### Basic Configuration

Configure the plugin in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "generateZodSchemas": true,
        "zodSchemaPrefix": "z",
        "strictTypeChecking": true,
        "validateClassMethods": true,
        "specialFieldValidators": {
          "email": "z.string().email()",
          "url": "z.string().url()",
          "phoneNumber": "z.string().regex(/^\\+?[1-9]\\d{1,14}$/)",
          "^.*Email$": {
            "pattern": true,
            "validator": "z.string().email()"
          },
          "^id[A-Z]": {
            "pattern": true, 
            "validator": "z.string().uuid()"
          }
        },
        "contextualValidators": {
          "User": {
            "email": "z.string().email().endsWith('@company.com')",
            "role": "z.enum(['admin', 'user', 'guest'])"
          },
          "Customer": {
            "email": "z.string().email()",
            "status": "z.enum(['active', 'inactive', 'pending'])"
          },
          "^.*Product$": {
            "pattern": true,
            "fields": {
              "price": "z.number().positive().min(0.01)",
              "inventory": "z.number().int().min(0)"
            }
          }
        }
      }
    ]
  }
}
```

### TypeScript CLI Configuration

If you're using TypeScript CLI, specify the plugin via command line:

```bash
tsc --plugin type-compiler
```

### Webpack Configuration

For webpack users:

```javascript
// webpack.config.js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          compiler: 'typescript',
          compilerOptions: {
            plugins: [
              { 
                transform: 'type-compiler', 
                generateZodSchemas: true
              }
            ]
          }
        }
      }
    ]
  }
};
```

## Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `generateZodSchemas` | boolean | `false` | Enables automatic Zod schema generation for interfaces and type aliases |
| `zodSchemaPrefix` | string | `"z"` | Prefix for generated Zod schema variables |
| `strictTypeChecking` | boolean | `false` | Enables additional type checking rules and warnings |
| `validateClassMethods` | boolean | `false` | Generates validators for class constructors and methods |
| `onlyExported` | boolean | `false` | When true, only generates schemas for exported types |
| `includedTypes` | string[] | `[]` | Specific type names to include even if they don't match other criteria |
| `excludedTypes` | string[] | `[]` | Specific type names to exclude even if they match other criteria |
| `excludePatterns` | string[] | `[]` | Glob patterns for files to exclude from processing |
| `useGlobalCache` | boolean | `false` | When true, enables the global type cache for improved performance |
| `maxCacheSize` | number | `1000` | Maximum number of entries to keep in the global type cache |
| `incrementalCompilation` | boolean | `false` | When true, enables incremental compilation, only processing files that have changed |
| `incrementalCachePath` | string | - | Path to store the incremental compilation cache (if not provided, cache is kept in memory) |
| `parallelProcessing` | boolean | `false` | When true, enables parallel processing of types for improved performance on multi-core systems |
| `workerCount` | number | CPU cores - 1 | Number of worker threads to use for parallel processing (0 = auto) |
| `workerBatchSize` | number | `100` | Maximum number of types to process in a single worker batch |
| `specialFieldValidators` | object | `{}` | Define custom validation rules for fields with specific names or matching patterns |
| `contextualValidators` | object | `{}` | Type-specific validation rules that define different validations for the same field name in different contexts. Supports both exact type name matches and pattern-based matching |

## Examples

### Interface and Type Validation

```typescript
// user.ts
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  roles: string[];
}

// Generated schema (added automatically by the plugin):
import { z } from 'zod';

export const zUser = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(), // Special validator applied
  age: z.number().optional(),
  roles: z.array(z.string())
});
```

### Contextual Validation Example

```typescript
// types.ts
interface User {
  email: string;  // Will use z.string().email().endsWith('@company.com')
  role: string;   // Will use z.enum(['admin', 'user', 'guest'])
}

interface Customer {
  email: string;  // Will use z.string().email()
  status: string; // Will use z.enum(['active', 'inactive', 'pending'])
}

// Generated schemas (added automatically):
export const zUser = z.object({
  email: z.string().email().endsWith('@company.com'),
  role: z.enum(['admin', 'user', 'guest'])
});

export const zCustomer = z.object({
  email: z.string().email(),
  status: z.enum(['active', 'inactive', 'pending'])
});
```

### Mapped Types Example

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Using TypeScript's utility types
type PartialUser = Partial<User>;
type UserBasicInfo = Pick<User, 'id' | 'name'>;

// The plugin generates:
export const zPartialUser = zUser.partial();
export const zUserBasicInfo = zUser.pick({
  'id': true, 
  'name': true
});
```

### Generic Types Example

```typescript
interface Container<T> {
  value: T;
  metadata: {
    timestamp: number;
  };
}

// The plugin generates:
export const zContainer = <T extends z.ZodTypeAny>(valueSchema: T) => 
  z.object({
    value: valueSchema,
    metadata: z.object({
      timestamp: z.number()
    })
  });

// Usage:
const StringContainer = zContainer(z.string());
```

For more examples, see the examples directory in the repository:
- [Complete Example with Complex Types](examples/parallel-processing.ts)
- [Generic Types Example](examples/generic-types.ts)
- [Mapped Types Example](examples/mapped-types.ts)
- [Special Field Validators Example](examples/special-validators)
- [Contextual Validators Example](examples/contextual-validators)

## Performance

Type Compiler includes several optimizations to improve performance, especially for large codebases.

### Performance Benchmarks

Here are typical performance improvements you can expect:

| Project Size | Basic Compilation | With Global Cache | With Incremental | With Parallel (8 cores) |
|--------------|------------------|------------------|------------------|------------------------|
| Small (<100 types) | 1.0s | 0.9s (10% faster) | 0.5s (50% faster) | 0.8s (20% faster) |
| Medium (100-500 types) | 5.0s | 4.0s (20% faster) | 2.0s (60% faster) | 2.5s (50% faster) |
| Large (500-1000 types) | 15.0s | 11.0s (27% faster) | 5.0s (67% faster) | 4.5s (70% faster) |
| Very Large (1000+ types) | 45.0s | 32.0s (29% faster) | 15.0s (67% faster) | 12.0s (73% faster) |

_Note: Actual performance will vary based on type complexity, hardware, and specific project characteristics._

### Performance Optimization Features

#### Global Type Cache

Stores computed Zod schemas in memory to avoid redundant computation:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "useGlobalCache": true,
        "maxCacheSize": 10000
      }
    ]
  }
}
```

**When to use**: Enable for all projects; especially beneficial for projects with many common or reused types.

#### Incremental Compilation

Only processes files that have changed since the last compilation:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "incrementalCompilation": true,
        "incrementalCachePath": "./node_modules/.cache/type-compiler"
      }
    ]
  }
}
```

**When to use**: Enable for all projects during development; provides the most benefit for projects with many files where only a few change between compilations.

#### Parallel Processing

Utilizes worker threads to distribute processing across multiple CPU cores:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "parallelProcessing": true,
        "workerCount": 4
      }
    ]
  }
}
```

**When to use**: 
- Enable for medium to large projects (100+ types)
- Most effective on machines with 4+ CPU cores
- Consider disabling for small projects where the overhead may exceed the benefits

### Optimization Recommendations

1. **Start Simple**: Begin with just `useGlobalCache: true` for all projects
2. **Iterative Improvement**: Add `incrementalCompilation: true` if you find compilation times still slow
3. **Complex Projects**: Add `parallelProcessing: true` for large projects or complex type hierarchies
4. **Fine-tuning**: Adjust `workerCount` based on your specific hardware (general rule: CPU cores - 1)

## Troubleshooting

### Common Issues and Solutions

#### "Cannot find module 'zod'"

**Problem**: The compiler complains about missing the Zod module.

**Solution**: Ensure Zod is installed:
```bash
npm install zod
```

#### "The specified path does not exist: ... node_modules/type-compiler"

**Problem**: TypeScript can't find the plugin.

**Solution**: Verify your installation and make sure your path is correct in tsconfig.json:
```bash
npm install --save-dev type-compiler
```

#### Duplicate identifiers for generated schemas

**Problem**: You get errors about duplicate identifiers for your Zod schemas.

**Solution**: Make sure you're not manually defining schemas with the same names. If needed, customize the prefix:
```json
{
  "plugins": [
    {
      "name": "type-compiler",
      "zodSchemaPrefix": "customPrefix"
    }
  ]
}
```

#### Performance is slow with parallel processing

**Problem**: Enabling parallel processing doesn't improve performance or makes it worse.

**Solution**: Parallel processing has overhead. For small projects, disable it or adjust settings:
```json
{
  "plugins": [
    {
      "name": "type-compiler",
      "parallelProcessing": true,
      "workerCount": 2, // Try a smaller number
      "workerBatchSize": 200 // Try a larger batch size to reduce overhead
    }
  ]
}
```

#### Invalid regex patterns

**Problem**: Your pattern-based field validators aren't working as expected.

**Solution**: Validate your regex patterns and check for proper escaping in JSON:
```json
"^id\\d+$": {
  "pattern": true,
  "validator": "z.string().uuid()"
}
```

#### Type errors in generated schemas

**Problem**: The generated schemas have TypeScript errors.

**Solution**: Check for circular type references or complex nested types. You can exclude problematic types:
```json
{
  "plugins": [
    {
      "name": "type-compiler",
      "excludedTypes": ["ProblemType"]
    }
  ]
}
```

#### IDE features not working

**Problem**: Hover tooltips or code completion for validation rules aren't showing.

**Solution**: 
1. Make sure your IDE is using the workspace version of TypeScript
2. Restart your TypeScript server
3. Verify your tsconfig.json has the plugin correctly configured

```bash
# In VS Code, you can restart the TS server with:
# Press Ctrl+Shift+P, then type "TypeScript: Restart TS Server"
```

### Debugging Tips

For more advanced debugging:

1. **Enable verbose logging**:
```json
{
  "plugins": [
    {
      "name": "type-compiler",
      "verbose": true
    }
  ]
}
```

2. **Check compiler output**:
```bash
npx tsc --listEmittedFiles
```

3. **Inspect generated code**:
Look at the compiled JavaScript files to see if the schemas are being generated correctly.

4. **Isolate problematic types**:
Create a minimal reproduction case with just the types causing issues.

## Documentation

For detailed guides and examples, check out our documentation:

- [Special Field Validators](docs/special-field-validators.md) - Configure custom Zod validators based on field names
- [Contextual Validators](docs/contextual-validators.md) - Type-specific validation rules
- [Pattern Matching Visuals](docs/pattern-matching-visuals.md) - Visual diagrams of how pattern matching works
- [IDE Integration](docs/ide-integration.md) - How to use the IDE hints and autocompletion features
- [Documentation Index](docs/index.md) - Navigate all documentation resources

## Supported TypeScript Types

The plugin can convert the following TypeScript types to Zod schemas:

- Primitive types (string, number, boolean, null, undefined, bigint)
- Literal types (string literals, number literals, boolean literals)
- Arrays and tuples
- Objects and interfaces
- Union types
- Intersection types
- Optional properties
- Generic types and type parameters
- Record types
- Promise types
- Class methods and constructors
- Mapped types (Partial, Pick, Omit, Record, Readonly, etc.)
- Custom mapped types with property transformations

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## Testing & Stability

Type Compiler maintains a comprehensive test suite to ensure functionality, compatibility, and stability across different environments and use cases.

### Test Coverage

The project includes several layers of tests:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between different parts of the system
- **End-to-End Tests**: Validate the entire workflow from TypeScript types to generated schemas
- **Edge Case Tests**: Cover unusual or complex type scenarios

Key areas covered by the test suite include:

- Basic type conversions (primitives, objects, arrays)
- Complex TypeScript features (generics, mapped types, conditional types)
- Performance optimizations (caching, incremental compilation, parallel processing)
- Special field validators and pattern matching
- Contextual validators
- TypeScript Language Service plugin functionality

### Running Tests

To run the complete test suite:

```bash
npm test
```

To run specific test categories:

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests with coverage report
npm run test:coverage
```

### Edge Case Testing

The test suite includes specialized tests for challenging edge cases:

- **Circular References**: Types that reference themselves directly or indirectly
- **Deeply Nested Types**: Complex hierarchies of types that test recursive processing
- **Complex Generics**: Generic types with multiple type parameters and constraints
- **Mixed Types**: Combinations of different type features like mapped types with generics
- **Exotic TypeScript Features**: Things like template literal types, infer keyword usage
- **Large Scale Types**: Performance testing with very large interfaces or numerous types

### Integration Testing

Integration tests ensure that Type Compiler works correctly with:

- Different versions of TypeScript (from 4.0 to latest)
- Different versions of Zod
- Various build tools (webpack, Rollup, etc.)
- Real-world frameworks (React, Vue, etc.)
- Monorepos using different package managers

### Contributing to Tests

When contributing new features or bug fixes, please include appropriate tests that:

1. Verify the intended functionality
2. Guard against regressions
3. Document the expected behavior

Test files should follow the naming convention `*.test.ts` and be placed in the `src/__tests__` directory, mirroring the structure of the source files they test.

Example of a good test:

```typescript
import { typeToZodSchema } from '../type-processor';

describe('typeToZodSchema', () => {
  test('handles complex intersection types correctly', () => {
    // Setup the complex type
    const mockType = createMockIntersectionType([
      createMockObjectType({ name: 'string', age: 'number' }),
      createMockObjectType({ isActive: 'boolean' })
    ]);
    
    // Execute the function
    const result = typeToZodSchema(mockType, mockTypeChecker);
    
    // Verify the output matches expected Zod schema
    expect(result).toContain('z.object({ name: z.string(), age: z.number() })');
    expect(result).toContain('z.object({ isActive: z.boolean() })');
    expect(result).toContain('.and(');
  });
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 