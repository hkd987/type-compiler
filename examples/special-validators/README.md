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
          "phoneNumber": "z.string().regex(/^\\+?[1-9]\\d{1,14}$/)"
          // ... other validators
        }
      }
    ]
  }
}
```

## Usage Examples

The example demonstrates:

1. **Basic validation** - Showing how the validators are applied to fields with matching names
2. **Error handling** - Showing validation errors when invalid data is provided
3. **Schema reuse** - Demonstrating how validators remain consistent across different types
4. **Complex validation chains** - Using more advanced validation logic

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