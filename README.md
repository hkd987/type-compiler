# Type Compiler

A TypeScript compiler plugin that automatically generates Zod schemas from TypeScript types for runtime validation. The plugin integrates directly with the TypeScript compiler (tsc) to provide runtime type checking through Zod.

## Installation

```bash
npm install --save-dev type-compiler zod
```

## Usage

1. First, configure your `tsconfig.json` to use the plugin:

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

2. If you're using TypeScript CLI, you'll need to specify the plugin via the command line:

```bash
tsc --plugin type-compiler
```

3. For webpack users, configure your `ts-loader` or `awesome-typescript-loader`:

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
                generateZodSchemas: true,
                zodSchemaPrefix: "z",
                strictTypeChecking: true,
                validateClassMethods: true
              }
            ]
          }
        }
      }
    ]
  }
};
```

## Parallel Processing Examples

### Basic Parallel Processing

For large codebases with many complex types, you can enable parallel processing to improve performance:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "generateZodSchemas": true,
        "parallelProcessing": true
      }
    ]
  }
}
```

This will automatically use a number of worker threads equal to the number of CPU cores minus one.

### Customizing Worker Configuration

You can customize the parallel processing behavior:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "generateZodSchemas": true,
        "parallelProcessing": true,
        "workerCount": 4,       // Use exactly 4 worker threads
        "workerBatchSize": 50   // Process 50 types per batch
      }
    ]
  }
}
```

### When to Use Parallel Processing

Parallel processing is most beneficial when:

- Your codebase has hundreds or thousands of types
- You have complex types with deep nesting or many properties
- You're running on a machine with multiple CPU cores
- Compilation time is becoming a bottleneck

For smaller projects, the overhead of creating and managing worker threads may outweigh the benefits. We recommend benchmarking with and without parallel processing to determine the optimal configuration for your project.

### Benchmarking and Monitoring

To benchmark the performance impact of parallel processing:

```bash
# Compile without parallel processing
time npm run build

# Enable parallel processing in tsconfig.json
# Then compile again
time npm run build
```

You can also monitor the CPU usage during compilation:

```bash
# On Linux/macOS
npm run build & top

# On Windows
npm run build & start Task Manager
```

For more detailed CPU profiling:

```bash
# Using Node.js built-in profiler
node --prof node_modules/.bin/tsc

# Convert the log to readable format
node --prof-process isolate-*.log > profile.txt
```

### Examples

We provide multiple examples to help you understand and get the most out of type-compiler:

1. **[Complete Example with Complex Types](examples/parallel-processing.ts)** - Demonstrates how parallel processing works with complex nested domain models (Products, Orders, Customers)

2. **[Benchmark Tool](examples/parallel-benchmark.ts)** - A utility to measure and compare the performance of parallel vs sequential processing for your specific workload

3. **[Monitoring & Debugging](examples/monitoring.ts)** - Tools and techniques for monitoring worker performance and optimizing parallel processing

4. **[Generic Types Example](examples/generic-types.ts)** - Demonstrates how type-compiler handles complex generic types

5. **[Mapped Types Example](examples/mapped-types.ts)** - Shows how type-compiler processes TypeScript's mapped types

To run any example:
```bash
# Compile the example
npx tsc examples/example-name.ts

# Run the compiled JavaScript
node examples/example-name.js
```

### Performance Impact Example

For a large codebase with many complex types, you might see performance improvements like:

```
// Without parallel processing:
Compilation time: 25.3 seconds

// With parallel processing (8-core machine):
Compilation time: 8.7 seconds (65% faster)
```

Actual performance gains will vary based on your codebase, machine, and configuration.

## Example

### Interface and Type Validation

Given a TypeScript interface or type definition:

```typescript
// user.ts
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  roles: string[];
}

// The plugin will automatically generate and add the following to your file:
import { z } from 'zod';

// ... your original code ...

export const zUser = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  age: z.number().optional(),
  roles: z.array(z.string())
});
```

You can then use the generated schema for runtime validation:

```typescript
// Using the generated Zod schema
import { zUser } from './user';

const userData = getDataFromAPI();

// Runtime validation
const validatedUser = zUser.parse(userData);
```

### Mapped Types Support

The plugin supports TypeScript's mapped types and utility types, translating them to their Zod equivalents:

```typescript
// types.ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Using TypeScript's utility types
type PartialUser = Partial<User>;
type UserBasicInfo = Pick<User, 'id' | 'name' | 'email'>;
type PublicUser = Omit<User, 'password'>;
type ReadonlyUser = Readonly<User>;

// Custom mapped types
type OptionalUser = { [K in keyof User]?: User[K] };
type NullableUser = { [K in keyof User]: User[K] | null };

// The plugin will generate appropriate Zod schemas
import { z } from 'zod';

// ... your original code ...

export const zUser = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  password: z.string(),
  createdAt: z.date(),
});

// For utility types, it uses Zod's built-in transformations
export const zPartialUser = zUser.partial();
export const zUserBasicInfo = zUser.pick({
  'id': true, 
  'name': true, 
  'email': true
});
export const zPublicUser = zUser.omit({
  'password': true
});
export const zReadonlyUser = zUser; // Runtime validation is the same

// For custom mapped types, it analyzes the structure
export const zOptionalUser = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  createdAt: z.date().optional(),
});

export const zNullableUser = z.object({
  id: z.number().nullable(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  password: z.string().nullable(),
  createdAt: z.date().nullable(),
});
```

You can use these schemas just like regular Zod schemas:

```typescript
// Import and use the generated schemas
import { zUserBasicInfo, zPublicUser } from './types';

const userData = getDataFromAPI();
const validUserInfo = zUserBasicInfo.parse(userData);
const safeUserData = zPublicUser.parse(userData);
```

### Generic Type Support

The plugin can handle generic types and create appropriate validators:

```typescript
// generic.ts
interface Container<T> {
  value: T;
  metadata: {
    timestamp: number;
    source: string;
  };
}

type Result<T, E = Error> = {
  data?: T;
  error?: E;
  success: boolean;
};

// The plugin will generate:
import { z } from 'zod';

// ... your original code ...

// Generic functions that return the appropriate Zod schema
export const zContainer = () => z.object({
  value: z.any(), // Will be replaced with the appropriate type when instantiated
  metadata: z.object({
    timestamp: z.number(),
    source: z.string()
  })
});

export const zResult = () => z.object({
  data: z.any().optional(),
  error: z.any().optional(),
  success: z.boolean()
});
```

You can use these with specific types:

```typescript
// Using the generic schemas with specific types
import { z } from 'zod';
import { zContainer, zResult } from './generic';

// Create a specific type instance
const StringContainer = zContainer().extend({
  value: z.string()
});

// Use it for validation
const container = StringContainer.parse({
  value: "Hello world",
  metadata: {
    timestamp: Date.now(),
    source: "user-input"
  }
});

// Create a Result with specific error and data types
const ApiResult = zResult().extend({
  data: z.object({ id: z.number() }).optional(),
  error: z.object({ message: z.string() }).optional()
});
```

### Class Method Validation

The plugin can also generate validation schemas for class constructors and methods:

```typescript
// service.ts
class UserService {
  constructor(private apiKey: string, private timeout: number = 3000) {}
  
  async getUser(id: number): Promise<User> {
    // Implementation...
    return user;
  }
  
  updateUser(id: number, userData: Partial<User>): boolean {
    // Implementation...
    return true;
  }
}

// The plugin will generate the following validators:
import { z } from 'zod';

// ... your original code ...

// Constructor parameter validation
export const zUserServiceConstructor = z.tuple([
  z.string(),
  z.number().optional()
]);

// Method parameter validation
export const zUserService_getUser_Params = z.tuple([
  z.number()
]);

// Method return type validation
export const zUserService_getUser_Return = zUser;

export const zUserService_updateUser_Params = z.tuple([
  z.number(),
  zUser.partial()
]);

export const zUserService_updateUser_Return = z.boolean();
```

You can use these validators to ensure type safety at runtime:

```typescript
import { 
  zUserServiceConstructor,
  zUserService_getUser_Params,
  zUserService_getUser_Return
} from './service';

// Validate constructor arguments
const [apiKey, timeout] = zUserServiceConstructor.parse(['my-api-key', 5000]);
const service = new UserService(apiKey, timeout);

// Validate method parameters
const [userId] = zUserService_getUser_Params.parse([123]);
const user = await service.getUser(userId);

// Validate method return value
const validatedUser = zUserService_getUser_Return.parse(user);
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

## Features

- **Automatic Zod Schema Generation**: Converts TypeScript interfaces and type aliases to Zod schemas
- **Class Method Validation**: Generates validators for class constructors and methods
- **Generic Type Support**: Handles generic types and provides ways to create specific instances
- **Mapped Type Support**: Converts TypeScript mapped and utility types to Zod equivalents
- **Type Preservation**: Maintains the exact type structure in the generated schemas
- **Enhanced Type Checking**: Optional strict checking for potentially unsafe types during compilation
- **Integration with TypeScript's Native Compiler**: Works directly within the compilation pipeline
- **Performance Optimizations**: 
  - Global Type Cache for fast lookups
  - Incremental Compilation to skip unchanged files
  - Parallel Processing using worker threads for multi-core utilization
- **Special Field Validators**: Apply consistent validation rules to fields with specific names
- **Pattern-Based Field Matching**: Use regex patterns to apply validators to fields with similar naming patterns
- **Parallel Processing**: Generate schemas for multiple types simultaneously for improved performance.
- **TypeScript Plugin Integration**: Seamlessly integrates into the TypeScript compilation process.
- **IDE Integration**: Provides hover information, code completion, and visual indicators for fields with special validation

## Documentation

For detailed guides and examples, check out our documentation:

- [Special Field Validators](docs/special-field-validators.md) - Configure custom Zod validators based on field names
- [Pattern Matching Visuals](docs/pattern-matching-visuals.md) - Visual diagrams of how pattern matching works
- [Pattern Matching Implementation](docs/pattern-matching-implementation.md) - Technical details on how pattern matching is implemented
- [Regex Pattern Guide](docs/regex-pattern-guide.md) - Guide to creating effective regex patterns
- [Pattern Matching Examples](docs/pattern-matching-examples.md) - Real-world examples of pattern-based validation
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

Regular expressions follow JavaScript syntax. Exact matches are always prioritized over pattern matches.

This feature makes it easy to apply consistent validation across your codebase without manually specifying every field validator.

For a comprehensive visual guide to pattern-based field matching, see our [Pattern Matching Documentation](docs/index.md) which includes detailed diagrams, implementation guides, and real-world examples.

## Example Output

When the plugin detects potential type issues:

```
[type-compiler] Found 'any' type at src/components/User.ts:15:23 - variable: any
```

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 

## Performance Optimizations

Type Compiler includes several optimizations to improve performance, especially for large codebases:

### Global Type Cache

The global type cache stores computed Zod schemas in memory, allowing them to be reused across different files. This prevents redundant computation when the same types are referenced in multiple files.

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

### Incremental Compilation

With incremental compilation enabled, Type Compiler only processes files that have changed since the last compilation. This can significantly speed up subsequent builds, especially in large codebases.

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

### Parallel Processing

The parallel processing feature utilizes worker threads to distribute type processing across multiple CPU cores. This can significantly improve performance on multi-core systems, especially for codebases with many complex types.

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "parallelProcessing": true,
        "workerCount": 4, // use 4 worker threads (0 = auto-detect)
        "workerBatchSize": 100 // process up to 100 types per worker batch
      }
    ]
  }
}
```

When parallel processing is enabled:

1. The plugin creates a pool of worker threads based on the `workerCount` option
2. Types are batched and distributed across the worker threads for processing
3. Results are collected and integrated back into the main thread
4. Workers are automatically cleaned up when compilation completes

This approach is particularly effective when:
- Your codebase has many complex types
- You're running on a system with multiple CPU cores
- You have large interfaces or deeply nested types

**Note:** For small projects, the overhead of creating worker threads may outweigh the benefits. It's recommended to benchmark with and without parallel processing to determine the optimal configuration for your specific use case. 

### Special Field Validators

The Type Compiler allows you to define custom Zod validators for specific field names, ensuring consistent validation rules across your codebase.

You can configure special field validators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "specialFieldValidators": {
          "email": "z.string().email()",
          "birthDate": "z.date()",
          "url": "z.string().url()",
          "phoneNumber": "z.string().regex(/^\\+?[0-9]{10,15}$/)"
        }
      }
    ]
  }
}
```

When generating Zod schemas, these special validators will be applied to fields with matching names, regardless of which interface or type they belong to.

#### Pattern-Based Field Matching

You can also use regex patterns to match field names, allowing for more flexible validation rules. To use pattern matching, specify an object with `pattern: true` and your validator:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "specialFieldValidators": {
          "email": "z.string().email()",
          "^.*Email$": {
            "pattern": true,
            "validator": "z.string().email()"
          },
          "^id": {
            "pattern": true,
            "validator": "z.string().uuid()"
          },
          "(^latitude$|Latitude$)": {
            "pattern": true,
            "validator": "z.number().min(-90).max(90)"
          }
        }
      }
    ]
  }
}
```

In this example:
- Fields named exactly `email` use the email validator
- Fields ending with `Email` (like `userEmail`, `contactEmail`) use the email validator
- Fields starting with `id` (like `id`, `idNumber`) use the UUID validator
- Fields named `latitude` or ending with `Latitude` use the latitude range validator

### Contextual Validators

Contextual validators provide even greater flexibility by applying validation rules based on the parent type that contains the field. This allows you to define different validation for fields with the same name depending on where they appear.

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
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

In this example:
- In the `User` interface, the `email` field must end with "@company.com"
- In the `Customer` interface, the `email` field can be any valid email
- In any interface ending with "Product" (like `FeaturedProduct` or `DigitalProduct`), the `price` field must be a positive number and `inventory` must be a non-negative integer

Contextual validators take precedence over special field validators when both would apply. This allows for both domain-specific and general validation rules throughout your codebase.

## IDE Integration

Type Compiler includes a TypeScript Language Service plugin that provides IDE hints and autocompletion for pattern-based field matching. This enhances the developer experience by:

1. **Hover Information** - Hovering over field names shows which validation rules will be applied
2. **Code Completion** - Suggests field names that have special validators configured
3. **Visual Indicators** - Fields with special validation are marked with informational diagnostics
4. **Pattern-Based Suggestions** - Intelligently suggests field names based on regex patterns in your configuration

### How to Use IDE Integration

The Language Service plugin is automatically activated when you include the type-compiler plugin in your tsconfig.json. No additional configuration is needed.

When writing TypeScript interfaces or types:

```typescript
interface User {
  email: string;       // Hover shows: Will be validated as email address
  contactEmail: string; // Hover shows: Matches pattern ^.*Email$ - will be validated as email address
  id: string;          // Hover shows: Matches pattern ^id - will be validated as UUID
  age: number;         // No special validation
}
```

As you type, the IDE will suggest field names that match your validation patterns, such as `userEmail`, `primaryEmail`, or `userId`, making it easier to discover and use consistent field naming patterns across your codebase.

### Benefits

- **Discoverability** - Easily discover which field names have special validation
- **Consistency** - Helps maintain consistent naming patterns with validation rules
- **Documentation** - Provides inline documentation of validation behavior
- **Fewer Surprises** - Makes runtime validation behavior visible at development time
- **Smart Suggestions** - Get context-aware field name suggestions based on validation patterns

### Supported Editors

This feature works in any editor that supports TypeScript Language Service plugins, including:

- Visual Studio Code
- WebStorm / IntelliJ IDEA
- Vim/NeoVim (with appropriate plugins)
- Sublime Text (with TypeScript plugin)
- Atom (with TypeScript plugin)