# Custom Error Messages Example

This example demonstrates how to use custom error messages with the type-compiler plugin to improve validation feedback in your TypeScript applications.

## Overview

Custom error messages allow you to provide clear, context-specific feedback when validation fails. Instead of generic error messages like "Invalid email format", you can show helpful messages like "Company email must end with @company.com".

This example shows:

1. How to configure custom error messages in `tsconfig.json`
2. Different levels of validation messages (field-level, contextual, pattern-based)
3. How to use the generated validators with custom error messages at runtime

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the example:

```bash
npm run build
```

3. Run the example:

```bash
npm start
```

## Configuration

The `tsconfig.json` file configures the type-compiler plugin with custom error messages:

```json
{
  "plugins": [
    {
      "name": "type-compiler",
      "specialFieldValidators": {
        "email": {
          "validator": "z.string().email()",
          "errorMessage": "Please enter a valid email address"
        },
        "price": {
          "validator": "z.number().positive().min(0.01)",
          "errorMessage": "Price must be greater than $0.01"
        }
      },
      "contextualValidators": {
        "User": {
          "email": {
            "validator": "z.string().email().endsWith('@company.com')",
            "errorMessage": "Company email must end with @company.com"
          }
        }
      }
    }
  ]
}
```

## Example Types

This example includes several types with custom validation rules:

- `User`: Validates emails, roles, and age with custom messages
- `Product`: Validates price and inventory with custom messages

## How It Works

1. The type-compiler plugin generates Zod schemas from your TypeScript interfaces
2. It incorporates custom error messages using Zod's `.describe()` method
3. A custom Zod error map converts these descriptions to error messages
4. When validation fails, you get helpful error messages instead of generic ones

## Key Features

- **Field-level custom messages**: Different messages for each field type
- **Contextual messages**: Different messages based on the parent type
- **Pattern-based messages**: Apply to fields matching specific patterns
- **Built-in validation**: Works with all standard Zod validators

## Learn More

See the [Custom Error Messages Documentation](/docs/custom-error-messages.md) for complete details on configuring and using custom error messages in your projects. 