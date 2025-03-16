# Contextual Validators Example

This example demonstrates how to use the contextual validators feature of the type-compiler to apply different validation rules to fields with the same name based on their parent type.

## Overview

The project contains:

- TypeScript interfaces for different entity types (users, products, etc.)
- Configuration for contextual validators in tsconfig.json
- Example validation code showing how it works

## How to Run

1. Navigate to this directory:
   ```
   cd examples/contextual-validators
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the project:
   ```
   npm run build
   ```

4. Run the example:
   ```
   npm start
   ```

## Configuration

The contextual validators are configured in the `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "generateZodSchemas": true,
        "contextualValidators": {
          "User": {
            "email": "z.string().email().endsWith('@company.com')",
            "role": "z.enum(['admin', 'user', 'guest'])",
            "status": "z.enum(['active', 'inactive'])"
          },
          "Customer": {
            "email": "z.string().email()",
            "type": "z.enum(['individual', 'business'])",
            "status": "z.enum(['active', 'inactive', 'pending', 'suspended'])"
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

## How It Works

Contextual validators allow you to define different validation rules for fields with the same name based on the parent type that contains them. This is useful when:

1. Different domains require different validation rules for the same field name
2. You want to apply stricter validation in specific contexts
3. You need different validation behavior in different parts of your application

### Types of Contextual Validation

1. **Exact Type Name Matching** - Apply validators to fields in a specific type:
   ```json
   "User": {
     "email": "z.string().email().endsWith('@company.com')"
   }
   ```

2. **Pattern-Based Type Matching** - Apply validators to types whose names match a regex pattern:
   ```json
   "^.*Product$": {
     "pattern": true,
     "fields": {
       "price": "z.number().positive().min(0.01)"
     }
   }
   ```

### Priority Order

Validation rules are applied in the following order:
1. Contextual validator with exact type name match
2. Contextual validator with pattern match
3. Special field validator with exact field name match
4. Special field validator with pattern match
5. Default TypeScript-to-Zod conversion

## Example Types

The example includes the following types:

### `User` Type

```typescript
interface User {
  email: string;       // Must end with @company.com
  role: string;        // Must be 'admin', 'user', or 'guest'
  status: string;      // Must be 'active' or 'inactive'
  name: string;        // No special validation
}
```

### `Customer` Type

```typescript
interface Customer {
  email: string;       // Any valid email
  type: string;        // Must be 'individual' or 'business'
  status: string;      // Can be 'active', 'inactive', 'pending', or 'suspended'
  name: string;        // No special validation
}
```

### Product Types

```typescript
interface PhysicalProduct {
  name: string;
  price: number;       // Must be positive and >= 0.01
  inventory: number;   // Must be an integer >= 0
  weight: number;      // No special validation
}

interface DigitalProduct {
  name: string;
  price: number;       // Must be positive and >= 0.01
  inventory: number;   // Must be an integer >= 0
  downloadUrl: string; // No special validation
}
```

## Usage Examples

The example demonstrates:

1. **Different Email Validation** - Same field name with different validation rules
2. **Status Field Variations** - Different allowed values for status fields
3. **Pattern-Based Type Matching** - Applying the same validation to similar types
4. **Validation Error Handling** - How to handle validation errors
5. **Priority Logic** - How contextual validators take precedence over other validators

## Key Concepts

- **Domain-Specific Validation** - Apply different validation rules in different parts of your application
- **Type Safety** - The generated Zod schemas maintain TypeScript type compatibility
- **Flexibility** - Combine exact and pattern-based matching for both types and fields

## Learn More

For more details about the contextual validators feature, see the [documentation](../../docs/contextual-validators.md). 