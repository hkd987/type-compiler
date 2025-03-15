# Working with Generic Types

The type-compiler plugin now fully supports TypeScript generic types, allowing you to generate Zod validation schemas that preserve the flexible and reusable nature of generics.

## How Generic Types Are Handled

When the compiler encounters a generic type (interface or type alias with type parameters), it:

1. Generates a function that returns a Zod schema instead of a static schema
2. Preserves the structure of the generic type, using `z.any()` as placeholders for the type parameters
3. Allows you to extend this schema with specific types when you need concrete instances

## Example: Basic Generic Types

```typescript
// Your TypeScript code
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

// Generated Zod schemas (automatically added by the compiler)
import { z } from 'zod';

// Generic function that returns a schema - call it to get the base schema
export const zContainer = () => z.object({
  value: z.any(), // Placeholder for type T
  metadata: z.object({
    timestamp: z.number(),
    source: z.string()
  })
});

export const zResult = () => z.object({
  data: z.any().optional(), // Placeholder for type T
  error: z.any().optional(), // Placeholder for type E (defaults to Error)
  success: z.boolean()
});
```

## Creating Concrete Type Instances

To use these generic schemas with specific types:

```typescript
// Defining specific types
interface User {
  id: number;
  name: string;
  email: string;
}

// The compiler generates:
export const zUser = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string()
});

// You can now create concrete instances of the generic types:
const UserContainer = zContainer().extend({
  value: zUser // Replace T with User type
});

// Validate a User container
const userContainer = UserContainer.parse({
  value: {
    id: 1,
    name: "John Doe",
    email: "john@example.com"
  },
  metadata: {
    timestamp: Date.now(),
    source: "database"
  }
});
```

## Working with Nested Generic Types

The compiler handles nested generics as well:

```typescript
// Nested generics in TypeScript
interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
}

type ApiResponse<T> = {
  data: T;
  statusCode: number;
  error?: string;
};

type PaginatedResponse<T> = ApiResponse<Paginated<T>>;

// Using these with concrete types:
const UserList = zPaginated().extend({
  items: z.array(zUser)
});

const UserListResponse = zApiResponse().extend({
  data: UserList
});

// Validate a response from API
const response = UserListResponse.parse(apiData);
```

## Generic Classes and Methods

When using `validateClassMethods: true`, the compiler also generates validators for generic classes:

```typescript
// Generic repository class
class Repository<T> {
  constructor(private items: T[] = []) {}
  
  findAll(): Promise<T[]> {
    return Promise.resolve(this.items);
  }
  
  findById(id: number): Promise<T | undefined> {
    return Promise.resolve(this.items.find((item: any) => item.id === id));
  }
}

// The compiler generates method parameter and return type validators:
export const zRepository_findById_Params = z.tuple([
  z.number()
]);

// The return type is generic, so it uses z.any()
export const zRepository_findById_Return = z.any().optional();

// To use with a specific type:
const validateUserRepositoryReturn = (data: any) => {
  return zUser.optional().parse(data);
};
```

## Tips for Working with Generic Types

1. **Use `.extend()`**: For generating concrete types from generic schemas
2. **Preserve Complex Type Arguments**: For complex nested generics, build them up step by step
3. **Explicit Type Annotation**: Consider adding explicit type annotations to help the compiler
4. **Test Validation Logic**: Always test your validation logic to ensure it works correctly

## Limitations

- Type parameters within complex nested generics may sometimes resort to `z.any()`
- Circular references in generic types might cause issues
- Generic constraints are not fully enforced in the runtime validation

## Example Usage Flow

1. Define your generic types and interfaces in TypeScript
2. Configure the type-compiler plugin in your `tsconfig.json`
3. Compile your TypeScript code to generate the Zod schemas
4. Import and use the generated schemas in your code
5. Create concrete type instances using `.extend()` when needed
6. Validate data at runtime with the generated schemas

This gives you the best of both worlds: TypeScript's static type checking during development and Zod's runtime validation during execution. 