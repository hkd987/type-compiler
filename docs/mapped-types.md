# Working with Mapped Types

The type-compiler plugin now supports TypeScript's mapped types, allowing you to generate Zod validation schemas for utility types like `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, and custom mapped types.

## How Mapped Types Are Handled

When the compiler encounters a mapped type, it:

1. Detects the type of mapping being applied (using TypeScript's type system)
2. Identifies built-in utility types and applies the equivalent Zod transformations
3. For custom mapped types, analyzes the property transformations and generates appropriate Zod schema modifications
4. Preserves the original type's structure while applying the mapped transformations

## Built-in Utility Types

TypeScript offers several built-in utility types that are implemented as mapped types. The compiler automatically converts these to their Zod equivalents:

| TypeScript Utility Type | Zod Equivalent |
|-------------------------|----------------|
| `Partial<T>` | `z.object({...}).partial()` |
| `Required<T>` | `z.object({...})` |
| `Pick<T, K>` | `z.object({...}).pick({...})` |
| `Omit<T, K>` | `z.object({...}).omit({...})` |
| `Record<K, T>` | `z.record(...)` |
| `Readonly<T>` | `z.object({...})` |

## Example: Built-in Utility Types

```typescript
// Your TypeScript code
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

type PartialUser = Partial<User>;
type PublicUser = Omit<User, 'password'>;
type UserSummary = Pick<User, 'id' | 'name'>;
type UserDictionary = Record<string, User>;

// Generated Zod schemas (automatically added by the compiler)
import { z } from 'zod';

export const zUser = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  password: z.string(),
  createdAt: z.date()
});

export const zPartialUser = zUser.partial();

export const zPublicUser = zUser.omit({
  'password': true
});

export const zUserSummary = zUser.pick({
  'id': true,
  'name': true
});

export const zUserDictionary = z.record(z.string(), zUser);
```

## Custom Mapped Types

The compiler also handles custom mapped types by analyzing the property transformations:

```typescript
// Your TypeScript code
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

// Custom mapped types
type NullableProduct = { [K in keyof Product]: Product[K] | null };
type OptionalProduct = { [K in keyof Product]?: Product[K] };
type StringifiedProduct = { [K in keyof Product]: string };

// Generated Zod schemas
import { z } from 'zod';

export const zProduct = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  stock: z.number()
});

export const zNullableProduct = z.object({
  id: z.number().nullable(),
  name: z.string().nullable(),
  price: z.number().nullable(),
  stock: z.number().nullable()
});

export const zOptionalProduct = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  price: z.number().optional(),
  stock: z.number().optional()
});

export const zStringifiedProduct = z.object({
  id: z.string(),
  name: z.string(),
  price: z.string(),
  stock: z.string()
});
```

## Advanced Mapped Types with Conditionals

The compiler can also handle conditional types within mapped types:

```typescript
// TypeScript code with conditional mapped type
interface User {
  id: number;
  name: string;
  createdAt: Date;
}

type DateToString<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K]
};

type UserWithStringDates = DateToString<User>;

// Generated Zod schema
export const zUserWithStringDates = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string()
});
```

## Combining With Generic Types

Mapped types often work with generic types, and the compiler handles these combinations:

```typescript
// TypeScript definition
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
};

interface NestedData {
  user: {
    profile: {
      name: string;
      age: number;
    };
    settings: {
      theme: string;
      notifications: boolean;
    };
  };
}

type PartialNestedData = DeepPartial<NestedData>;

// The compiler handles this by generating appropriate schemas
// that preserve the nested structure while making properties optional
```

## Using Generated Schemas

You can use the generated schemas for validation just like any other Zod schemas:

```typescript
import { zPartialUser, zPublicUser } from './types';

// Validate partial data
const partialData = {
  name: "John Doe",
  email: "john@example.com"
};
const validPartialUser = zPartialUser.parse(partialData);

// Validate public user data (without password)
const userData = getDataFromAPI();
const safeUserData = zPublicUser.parse(userData);
```

## Limitations

- Complex conditional types within mapped types might not be fully resolved
- Deeply nested mapped types with multiple layers of conditionals may fallback to `z.any()`
- Some advanced mapped type features (template literal types in keys, etc.) might have limited support

## Best Practices

1. **Keep mappings simple** - The compiler works best with straightforward property transformations
2. **Verify generated schemas** - For complex mapped types, check that the generated Zod schemas match your expectations
3. **Consider extraction** - For very complex mappings, consider extracting the logic into simpler components
4. **Common utility types** - Prefer the built-in utility types where possible as they map directly to Zod equivalents

These enhancements significantly increase the flexibility of the TypeScript compiler plugin, allowing it to handle a wider range of TypeScript's type system features. 