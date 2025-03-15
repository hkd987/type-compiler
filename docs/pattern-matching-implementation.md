# Implementing Pattern-Based Field Matching

This guide provides a visual walkthrough of how to implement pattern-based field matching in your project, with code samples and step-by-step instructions.

## Configuration Structure

Below is the structure of the `specialFieldValidators` configuration in your `tsconfig.json`:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  "specialFieldValidators": {                                │
│    ┌─────────────────────┐      ┌─────────────────────┐    │
│    │ Exact Match Keys    │      │ Pattern Match Keys  │    │
│    └─────────┬───────────┘      └──────────┬──────────┘    │
│              │                             │                │
│      ┌───────▼───────┐            ┌────────▼─────────┐     │
│      │               │            │                  │     │
│      │ "email":      │            │ "^.*Email$": {   │     │
│      │   "z.string() │            │   "pattern": true,     │
│      │    .email()"  │            │   "validator":   │     │
│      │               │            │     "z.string()  │     │
│      │               │            │      .email()"   │     │
│      │               │            │ }                │     │
│      └───────────────┘            └──────────────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Add Configuration to tsconfig.json

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "generateZodSchemas": true,
        "specialFieldValidators": {
          // Exact matches
          "email": "z.string().email()",
          "phoneNumber": "z.string().regex(/^\\+?[0-9]{10,15}$/)",
          
          // Pattern matches
          "^.*Email$": {
            "pattern": true,
            "validator": "z.string().email()"
          },
          "^id[A-Z]": {
            "pattern": true,
            "validator": "z.string().uuid()"
          }
        }
      }
    ]
  }
}
```

### 2. Create TypeScript Interfaces/Types

```typescript
// This interface has fields that will match both exact and pattern-based validators
interface User {
  id: string;                 // No special validation
  email: string;              // Exact match: "email"
  workEmail: string;          // Pattern match: "^.*Email$"
  idUser: string;             // Pattern match: "^id[A-Z]"
  phoneNumber: string;        // Exact match: "phoneNumber"
  createdAt: Date;            // No special validation
}
```

### 3. Compilation Process Visualization

When you compile your TypeScript code with the type-compiler plugin:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   tsconfig.json                                             │
│   ┌──────────────────┐                                      │
│   │ specialField     │                                      │
│   │ Validators       │                                      │
│   └────────┬─────────┘                                      │
│            │                                                │
│            ▼                                                │
│   ┌──────────────────┐        ┌──────────────────┐         │
│   │ TypeScript       │        │ Type-Compiler    │         │
│   │ Compiler         │━━━━━━━▶│ Plugin           │         │
│   └──────────────────┘        └────────┬─────────┘         │
│                                        │                    │
│                                        ▼                    │
│                               ┌──────────────────┐         │
│                               │ AST Processing   │         │
│                               └────────┬─────────┘         │
│                                        │                    │
│                                        ▼                    │
│                               ┌──────────────────┐         │
│                               │ Pattern Matching │         │
│                               └────────┬─────────┘         │
│                                        │                    │
│                                        ▼                    │
│                               ┌──────────────────┐         │
│                               │ Generated        │         │
│                               │ Zod Schemas      │         │
│                               └──────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Generated Schema

The type-compiler generates a schema like this:

```typescript
export const zUser = z.object({
  id: z.string(),  // Default string validation
  email: z.string().email(),  // From exact match
  workEmail: z.string().email(),  // From pattern match
  idUser: z.string().uuid(),  // From pattern match
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/),  // From exact match
  createdAt: z.date()  // Default date validation
});
```

## Visual Comparison: Before and After

### Before: Manual Validation

```typescript
// Before: Manual validation for each field
const validateUser = (data: unknown): User => {
  return {
    id: validateId(data.id),
    email: validateEmail(data.email),
    workEmail: validateEmail(data.workEmail),  // Duplicate logic
    idUser: validateUuid(data.idUser),
    phoneNumber: validatePhone(data.phoneNumber),
    createdAt: validateDate(data.createdAt)
  };
};
```

### After: Automatic Pattern-Based Validation

```typescript
// After: Automatic validation using generated schemas
const validateUser = (data: unknown): User => {
  return zUser.parse(data);  // All validation handled automatically
};
```

## Code Implementation Examples

### Example: Implementing Common Field Patterns

```typescript
// In your tsconfig.json:
{
  "compilerOptions": {
    "plugins": [{
      "name": "type-compiler",
      "generateZodSchemas": true,
      "specialFieldValidators": {
        // ID Patterns
        "^.*[iI]d$": {
          "pattern": true,
          "validator": "z.string().min(1)"
        },
        
        // Date/Time Patterns
        "^.*(?:Date|Time|At)$": {
          "pattern": true,
          "validator": "z.date().or(z.string().pipe(z.coerce.date()))"
        },
        
        // Boolean Flag Patterns
        "^(?:is|has|can)[A-Z]": {
          "pattern": true,
          "validator": "z.boolean()"
        }
      }
    }]
  }
}
```

### Example: Pattern Matching Inside the Type-Compiler

Below is a simplified version of what happens inside the type-compiler when processing a field:

```typescript
// Pseudo-code of how the field matching works
function applySpecialFieldValidation(
  propertyName: string,
  defaultValidator: string, 
  options?: TypeCompilerOptions
): string {
  // Skip if no special validators are configured
  if (!options?.specialFieldValidators) {
    return defaultValidator;
  }
  
  const validators = options.specialFieldValidators;
  
  // First check for exact match
  if (validators[propertyName] && typeof validators[propertyName] === 'string') {
    logger.debug(`Found exact validator match for field: ${propertyName}`);
    return validators[propertyName] as string;
  }
  
  // Then check for pattern matches
  for (const [pattern, config] of Object.entries(validators)) {
    // Skip if this is not a pattern config
    if (typeof config !== 'object' || !config.pattern) {
      continue;
    }
    
    try {
      // Create a RegExp from the pattern
      const regex = new RegExp(pattern);
      
      // Test if the property name matches the pattern
      if (regex.test(propertyName)) {
        logger.debug(`Found pattern validator match for field: ${propertyName} using pattern: ${pattern}`);
        return config.validator;
      }
    } catch (error) {
      logger.error(`Invalid regex pattern: ${pattern}`, { error });
    }
  }
  
  // If no matches, use the default validator
  return defaultValidator;
}
```

## Regular Expression Testing Visualization

Testing how regex patterns match field names:

```
┌─────────────────────────────────────────────────────────────┐
│ Pattern: "^.*Email$"                                        │
│                                                             │
│ ┌───────────────┐   ┌────────────────┐   ┌────────────────┐ │
│ │ Test: "email" │──▶│  Does it match? │──▶│ Result: false  │ │
│ └───────────────┘   └────────────────┘   └────────────────┘ │
│                                                             │
│ ┌────────────────┐   ┌────────────────┐   ┌───────────────┐ │
│ │ Test: "userEmail" │▶│ Does it match? │──▶│ Result: true  │ │
│ └────────────────┘   └────────────────┘   └───────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Pattern: "^is[A-Z]"                                         │
│                                                             │
│ ┌────────────────┐   ┌────────────────┐   ┌───────────────┐ │
│ │ Test: "isAdmin" │──▶│ Does it match? │──▶│ Result: true  │ │
│ └────────────────┘   └────────────────┘   └───────────────┘ │
│                                                             │
│ ┌────────────────┐   ┌────────────────┐   ┌────────────────┐│
│ │ Test: "adminIs" │──▶│ Does it match? │──▶│ Result: false  ││
│ └────────────────┘   └────────────────┘   └────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Common Patterns Reference

Here's a table of common patterns to implement in your project:

| Pattern | Description | Example | Recommended Validator |
|---------|-------------|---------|----------------------|
| `^.*Email$` | Fields ending with "Email" | `userEmail` | `z.string().email()` |
| `^id[A-Z]` | ID fields | `idUser` | `z.string().uuid()` |
| `^is[A-Z]` | Boolean flags | `isActive` | `z.boolean()` |
| `^has[A-Z]` | Existence flags | `hasPermission` | `z.boolean()` |
| `.*(?:At\|Date)$` | Date/time fields | `createdAt` | `z.date()` |
| `^price[A-Z]` | Price fields | `priceBase` | `z.number().min(0)` |
| `.*Count$` | Count fields | `itemCount` | `z.number().int().min(0)` |
| `.*(?:width\|height)$` | Dimension fields | `imageWidth` | `z.number().positive()` |

## Advanced Pattern Examples

Here are some more advanced pattern examples for specific validation scenarios:

### Complex Object Validation

```typescript
// tsconfig.json pattern
"^nested[A-Z].*": {
  "pattern": true,
  "validator": "z.record(z.string(), z.any())"
}

// In your TypeScript interface
interface Config {
  nestedSettings: Record<string, any>;  // Will match the pattern
  nestedUserPreferences: Record<string, any>;  // Will match the pattern
}
```

### Array Validation

```typescript
// tsconfig.json pattern
"^(?:list|array)[A-Z].*": {
  "pattern": true,
  "validator": "z.array(z.any())"
}

// More specific array types
"^emails$": {
  "pattern": true,
  "validator": "z.array(z.string().email())"
}

// In your TypeScript interface
interface Newsletter {
  listSubscribers: string[];  // Will match the array pattern
  emails: string[];          // Will match the specific emails pattern
}
```

## Implementation Checklist

Use this checklist to implement pattern-based field matching in your project:

```
┌─────────────────────────────────────────────────────────────┐
│ Implementation Checklist                                    │
│                                                             │
│ □ Analyze your codebase for common field naming patterns    │
│                                                             │
│ □ Define validation requirements for each pattern           │
│                                                             │
│ □ Add configuration to tsconfig.json                        │
│                                                             │
│ □ Test with a small subset of interfaces                    │
│                                                             │
│ □ Verify generated schemas match expectations               │
│                                                             │
│ □ Expand to cover more patterns                             │
│                                                             │
│ □ Document patterns for your team                           │
│                                                             │
│ □ Apply consistent naming conventions                       │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

```
┌─────────────────────────────────────────────────────────────┐
│ Best Practices for Pattern-Based Field Matching             │
│                                                             │
│ ✓ Start with specific patterns and test thoroughly          │
│                                                             │
│ ✓ Use readable, maintainable regex patterns                 │
│                                                             │
│ ✓ Document your patterns for other developers               │
│                                                             │
│ ✓ Order patterns from most specific to most general         │
│                                                             │
│ ✓ Avoid overlapping patterns that could cause confusion     │
│                                                             │
│ ✓ Regularly review and update patterns as needs change      │
│                                                             │
│ ✓ Consider domain-specific validation requirements          │
└─────────────────────────────────────────────────────────────┘
```

## Debugging Pattern Matches

If you need to debug your pattern matching, you can enable the `debug` option in your TypeScript configuration:

```json
{
  "compilerOptions": {
    "plugins": [{
      "name": "type-compiler",
      "generateZodSchemas": true,
      "debug": true,
      "specialFieldValidators": {
        // Your validators here
      }
    }]
  }
}
```

This will produce output similar to:

```
┌─────────────────────────────────────────────────────────────┐
│ [DEBUG] type-compiler: Processing field 'userEmail'         │
│                                                             │
│ [DEBUG] type-compiler: Checking exact match: No match       │
│                                                             │
│ [DEBUG] type-compiler: Checking pattern '^.*Email$': Match! │
│                                                             │
│ [DEBUG] type-compiler: Using validator: z.string().email()  │
└─────────────────────────────────────────────────────────────┘
```

## Integration with VS Code

For a better development experience with pattern-based field matching, consider using the TypeScript plugin with VS Code:

```
┌─────────────────────────────────────────────────────────────┐
│ VS Code Integration                                         │
│                                                             │
│ ┌───────────────┐         ┌──────────────────────┐         │
│ │ TypeScript    │◀────────│ type-compiler plugin │         │
│ │ Language      │         └──────────────────────┘         │
│ │ Server        │                                          │
│ └───────┬───────┘                                          │
│         │                                                  │
│         ▼                                                  │
│ ┌───────────────┐         ┌──────────────────────┐         │
│ │ VS Code       │         │ Hover Documentation  │         │
│ │ Editor        │━━━━━━━━▶│ Shows Applied        │         │
│ │               │         │ Validator            │         │
│ └───────────────┘         └──────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

With proper configuration, VS Code can show you which validators will be applied to each field.

## Advanced Considerations

### Combining Patterns with Type Information

```typescript
// Combining pattern matching with conditional type validation
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface ProductVariant {
  variantId: string;  // Matches ID pattern
  name: string;
  priceModifier: number;  // Matches price pattern
}

// The same pattern will generate appropriate validators for both types
```

### Overriding Patterns with Exact Matches

```json
{
  "specialFieldValidators": {
    // Exact match takes precedence
    "email": "z.string().email({message: 'Custom error message'})",
    
    // Pattern match for other email fields
    "^.*Email$": {
      "pattern": true,
      "validator": "z.string().email()"
    }
  }
}
```

In this case, fields exactly named "email" will use the custom validator with the error message, while other fields ending with "Email" will use the standard email validator.

## Final Thoughts

Pattern-based field matching is a powerful technique for ensuring consistent validation across your codebase. By implementing it properly with these visual guides, you can reduce duplication, improve code quality, and make your validation logic more maintainable. 