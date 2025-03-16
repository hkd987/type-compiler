# Contextual Validators

Contextual validators provide a powerful way to apply different validation rules to fields with the same name based on the parent type (interface or type alias) that contains them. This allows for more precise control over validation in domain-specific contexts.

## Overview

While [special field validators](special-field-validators.md) apply consistent validation rules to fields with specific names across your entire codebase, contextual validators let you override these rules for specific types or groups of types.

This is particularly useful when:

1. Different domains require different validation rules for the same field name
2. You want to apply stricter validation in specific contexts
3. You need different validation behavior in different parts of your application

## Configuration

Contextual validators are configured in your `tsconfig.json` under the `contextualValidators` option:

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
            "role": "z.enum(['admin', 'user', 'guest'])"
          },
          "Customer": {
            "email": "z.string().email()",
            "status": "z.enum(['active', 'inactive', 'pending'])"
          }
        }
      }
    ]
  }
}
```

## Usage Patterns

### 1. Exact Type Name Matching

The most basic use case is to provide validation rules for fields in a specific type:

```json
"User": {
  "email": "z.string().email().endsWith('@company.com')",
  "role": "z.enum(['admin', 'user', 'guest'])"
}
```

This applies the specified validators to fields in the `User` interface or type alias.

### 2. Pattern-Based Type Matching

You can also apply validators to types whose names match a regular expression pattern:

```json
"^.*Product$": {
  "pattern": true,
  "fields": {
    "price": "z.number().positive().min(0.01)",
    "inventory": "z.number().int().min(0)"
  }
}
```

This applies the validators to fields in any type whose name ends with "Product" (e.g., `FeaturedProduct`, `DigitalProduct`).

## Priority Order

When determining which validator to apply to a field, the plugin follows this priority order:

1. Contextual validator with exact type name match
2. Contextual validator with pattern match
3. Special field validator with exact field name match
4. Special field validator with pattern match
5. Default TypeScript-to-Zod conversion

This allows you to have general rules with specific overrides.

## Examples

### Domain-Specific Email Validation

```typescript
// Types with contextual validators
interface User {
  email: string;       // Will use z.string().email().endsWith('@company.com')
  name: string;
}

interface Customer {
  email: string;       // Will use z.string().email()
  name: string;
}

// Configuration
const contextualValidators = {
  "User": {
    "email": "z.string().email().endsWith('@company.com')"
  },
  "Customer": {
    "email": "z.string().email()"
  }
};
```

### Product Pricing Rules

```typescript
// Types with contextual validators
interface PhysicalProduct {
  name: string;
  price: number;       // Will use z.number().positive().min(1.99)
  weight: number;
}

interface DigitalProduct {
  name: string;
  price: number;       // Will use z.number().positive().min(0.99)
  downloadUrl: string;
}

// Configuration
const contextualValidators = {
  "PhysicalProduct": {
    "price": "z.number().positive().min(1.99)"
  },
  "DigitalProduct": {
    "price": "z.number().positive().min(0.99)"
  }
};
```

### Pattern-Based Type Matching

```typescript
// Types with contextual validators
interface AdminUser {
  role: string;        // Will use z.enum(['admin', 'superadmin'])
  permissions: string[];
}

interface RegularUser {
  role: string;        // Will use z.enum(['user', 'premium'])
  preferences: Record<string, string>;
}

// Configuration
const contextualValidators = {
  "^Admin.*$": {
    "pattern": true,
    "fields": {
      "role": "z.enum(['admin', 'superadmin'])"
    }
  },
  "^Regular.*$": {
    "pattern": true,
    "fields": {
      "role": "z.enum(['user', 'premium'])"
    }
  }
};
```

## IDE Integration

The contextual validators feature is fully integrated with the TypeScript Language Service plugin, providing:

1. **Hover Information** - Shows which validator will be applied to a field based on its parent type
2. **Diagnostics** - Provides visual indicators for fields with contextual validation
3. **Context-Aware Tooltips** - Displays information about the source of the validator (contextual or general)

This makes it easy to understand which validation rules will be applied at runtime.

## Benefits

- **Domain-Specific Validation** - Apply different validation rules in different parts of your application
- **Precision** - Fine-grained control over validation behavior
- **Flexibility** - Combine exact and pattern-based matching for both types and fields
- **Consistency** - Maintain consistent validation within specific domains
- **DRY Principles** - Define validation rules once per domain, rather than repeating them

## Common Use Cases

1. **Email Formats** - Different email validation rules for different user types
2. **Numeric Ranges** - Different acceptable ranges for measurements in different contexts
3. **Status Values** - Different sets of allowed status values for different entity types
4. **ID Formats** - Different ID formats for different entity types
5. **URL Patterns** - Different URL validation for different link types

## Advanced Examples

### Combining with Special Field Validators

You can use contextual validators together with special field validators:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "specialFieldValidators": {
          "email": "z.string().email()",
          "url": "z.string().url()"
        },
        "contextualValidators": {
          "User": {
            "email": "z.string().email().endsWith('@company.com')"
          }
        }
      }
    ]
  }
}
```

In this example:
- The `email` field will generally be validated as any valid email
- But in the `User` type, it must specifically end with "@company.com"

### Nested Types and Anonymous Types

Contextual validators work with nested types and anonymous types:

```typescript
interface User {
  profile: {           // Anonymous type
    email: string;     // Still applies User's contextual validation
    name: string;
  };
}
```

For anonymous types (type literals), the parent type's contextual validators will be applied.

## Troubleshooting

### Validator Not Applied

If your contextual validator isn't being applied:

1. Check that the type name matches exactly (case-sensitive)
2. For pattern-based matching, verify your regex pattern
3. Ensure the field name matches exactly
4. Check the priority order (a more specific match may be taking precedence)

### Pattern Syntax

JavaScript regular expression syntax is used for pattern matching. Some common patterns:

- `^prefix` - Matches types starting with "prefix"
- `suffix$` - Matches types ending with "suffix"
- `^exact$` - Matches exactly "exact"
- `part1|part2` - Matches types containing either "part1" or "part2"

### Performance Considerations

Pattern-based matching requires evaluating regular expressions, which can affect performance if:

1. You have a very large number of patterns
2. Your patterns are extremely complex
3. You're applying them to a large number of types

For best performance, prefer exact matches when possible and use simple, efficient patterns. 