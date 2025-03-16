# Custom Error Messages

## Overview

Custom error messages enhance the user experience of your applications by providing clear, context-specific feedback when validation fails. Instead of generic error messages like "Invalid email format", you can provide more helpful messages like "Company email must end with @company.com".

This feature allows you to define custom error messages at different levels:

1. **Field-level validation**: Custom messages for specific field names
2. **Contextual validation**: Different messages based on the parent type
3. **Pattern-based validation**: Messages for fields matching specific patterns

## Configuration

Custom error messages are configured in your `tsconfig.json` file, as part of the type-compiler plugin options.

### Basic Structure

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "specialFieldValidators": {
          "email": {
            "validatorType": "email address",
            "errorMessage": "Please enter a valid email address"
          }
        },
        "contextualValidators": {
          "User": {
            "email": {
              "validatorType": "email address",
              "validValue": "@company.com",
              "errorMessage": "Company email must end with @company.com"
            }
          }
        }
      }
    ]
  }
}
```

## Field-Level Error Messages

Field-level error messages are defined in the `specialFieldValidators` section:

```json
"specialFieldValidators": {
  "email": {
    "validatorType": "email address",
    "errorMessage": "Please enter a valid email address"
  },
  "price": {
    "validatorType": "number within range",
    "min": 0.01,
    "errorMessage": "Price must be greater than $0.01"
  },
  "inventory": {
    "validatorType": "integer",
    "min": 0,
    "errorMessage": "Inventory must be a non-negative whole number"
  }
}
```

## Contextual Error Messages

Contextual error messages allow you to provide different validation messages for the same field name depending on the parent type:

```json
"contextualValidators": {
  "User": {
    "email": {
      "validatorType": "email address",
      "validValue": "@company.com",
      "errorMessage": "Company email must end with @company.com"
    },
    "age": {
      "validatorType": "number within range",
      "min": 18,
      "max": 120,
      "errorMessage": "User age must be between 18 and 120"
    }
  },
  "Customer": {
    "email": {
      "validatorType": "email address",
      "errorMessage": "Please provide a valid customer email"
    },
    "age": {
      "validatorType": "number within range",
      "min": 13,
      "errorMessage": "Customer must be at least 13 years old"
    }
  }
}
```

## Pattern-Based Error Messages

Pattern-based validators allow you to define error messages for fields matching specific patterns:

```json
"contextualValidators": {
  "/^.*Form$/": {
    "email": {
      "validatorType": "email address",
      "errorMessage": "Form requires a valid email address"
    },
    "password": {
      "validatorType": "matches regex pattern",
      "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
      "errorMessage": "Password must contain at least 8 characters, including uppercase, lowercase, and numbers"
    }
  }
}
```

## Runtime Usage

At runtime, the generated Zod schemas will include the custom error messages:

```typescript
import { z } from "zod";
import { User, zUser } from "./types";

const validateUser = (data: unknown): User => {
  try {
    return zUser.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Custom error messages are included in the issues
      console.error("Validation errors:", error.issues);
    }
    throw error;
  }
};

// Example with invalid data
try {
  const user = validateUser({
    name: "John Doe",
    email: "john@personal.com", // Not a company email
    age: 25
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    // Will show: "Company email must end with @company.com"
    console.error(error.issues[0].message);
  }
}
```

## Best Practices

1. **Be specific**: Error messages should clearly explain what's wrong and how to fix it
2. **Be consistent**: Use a similar tone and style for all error messages
3. **Prioritize user experience**: Focus on helping the user correct their input
4. **Consider localization**: Design your system to support multiple languages if needed
5. **Avoid technical jargon**: Use language that end-users will understand

## Priority Order

When multiple validation rules apply to a field, the following priority order is used:

1. Contextual validators with exact type name match
2. Contextual validators with pattern-based type match
3. Special field validators (general field name match)
4. Default Zod validation messages

This ensures that the most specific validation rule and error message are applied.

## IDE Integration

The custom error messages are displayed in your IDE through the TypeScript Language Service plugin. When hovering over fields with custom validation, you'll see both the validation rule and the custom error message that will be displayed if validation fails. 