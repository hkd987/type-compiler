# Special Field Validators Example

This example demonstrates how to use the special field validators feature of the type-compiler to apply consistent validation rules to specific field names across your application.

## Overview

The project contains:

- TypeScript interfaces and types with common field names (email, dates, etc.)
- Configuration for special field validators in tsconfig.json
- Example validation code showing how it works

## How to Run

1. Navigate to this directory:
   ```
   cd examples/special-validators
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

The special field validators are configured in the `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "generateZodSchemas": true,
        "specialFieldValidators": {
          "email": "z.string().email()",
          "birthDate": "z.string().pipe(z.coerce.date())",
          "url": "z.string().url()",
          "phoneNumber": "z.string().regex(/^\\+?[1-9]\\d{1,14}$/)",
          // ... other exact match validators
          
          // Pattern-based validators
          "^.*Email$": {
            "pattern": true,
            "validator": "z.string().email()"
          },
          "^id[A-Z]": {
            "pattern": true,
            "validator": "z.string().uuid()"
          }
          // ... other pattern-based validators
        }
      }
    ]
  }
}
```

## Pattern-Based Field Matching

This example also demonstrates the pattern-based field matching feature. This feature allows you to use regex patterns to match field names, providing more flexibility in defining validation rules:

### How It Works

1. You define a special validator with a regex pattern in your `tsconfig.json`
2. For each field in your types, the compiler:
   - First checks for exact matches
   - Then checks for pattern matches
   - Exact matches always take priority

### Examples in This Project

- `^.*Email$` - Matches any field ending with "Email" (e.g., `primaryEmail`, `backupEmail`)
- `^id[A-Z]` - Matches fields starting with "id" followed by an uppercase letter (e.g., `idParent`, `idChild`)
- `^price[A-Z]` - Matches fields starting with "price" followed by an uppercase letter (e.g., `priceBase`, `priceWithTax`)
- `(^img|^image)[A-Z]` - Matches fields starting with either "img" or "image" followed by an uppercase letter
- `^(lat|Long)[A-Z]` - Matches fields starting with either "lat" or "Long" followed by an uppercase letter

### Benefits

- **Consistency** - Apply the same validation to fields with similar naming patterns
- **Flexibility** - Match fields based on naming conventions rather than exact matches
- **Maintainability** - Define validation rules once for multiple related fields

## Usage Examples

The example demonstrates:

1. **Basic validation** - Showing how the validators are applied to fields with matching names
2. **Pattern-based validation** - Showing how regex patterns match field names
3. **Error handling** - Showing validation errors when invalid data is provided
4. **Schema reuse** - Demonstrating how validators remain consistent across different types
5. **Complex validation chains** - Using more advanced validation logic

## Key Files

- `src/types.ts` - Contains the TypeScript interfaces and types
- `src/validate.ts` - Contains example validation code
- `src/index.ts` - Main entry point that runs the validation examples

## Key Concepts

- **Consistency** - The same validation rules are applied to fields with the same name, even across different types
- **Type safety** - The generated Zod schemas maintain TypeScript type compatibility
- **Runtime validation** - The validators provide runtime type checking and data validation

## Learn More

For more details about the special field validators feature, see the [documentation](../../docs/special-field-validators.md). 