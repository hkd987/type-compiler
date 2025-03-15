# Special Field Validators

The type-compiler plugin allows you to specify custom Zod validators for specific field names across your codebase. This is useful for ensuring consistent validation rules for common field types like emails, dates, and more.

## Configuration

Configure special field validators in your `tsconfig.json`:

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
        }
      }
    ]
  }
}
```

## How It Works

When the type-compiler generates Zod schemas for your TypeScript types, it checks each property name against your configured `specialFieldValidators`. If a match is found, it uses your custom validator instead of the default one.

### Example

Given this TypeScript interface:

```typescript
interface User {
  id: number;
  email: string;
  birthDate: string;
  url: string;
  phoneNumber: string;
  name: string; // Regular field with no special validator
}
```

With the configuration above, the generated Zod schema would be:

```typescript
export const zUser = z.object({
  id: z.number(),
  email: z.string().email(),
  birthDate: z.string().pipe(z.coerce.date()),
  url: z.string().url(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  name: z.string()
});
```

## Common Validators

Here are some useful special field validators for common scenarios:

### Email Addresses

```json
"email": "z.string().email()"
```

### Dates

```json
"birthDate": "z.string().pipe(z.coerce.date())",
"createdAt": "z.date()",
"updatedAt": "z.date()"
```

### URLs and URIs

```json
"url": "z.string().url()",
"website": "z.string().url()",
"imageUrl": "z.string().url()"
```

### Phone Numbers

```json
"phoneNumber": "z.string().regex(/^\\+?[1-9]\\d{1,14}$/)",
"phone": "z.string().regex(/^\\+?[1-9]\\d{1,14}$/)"
```

### Credit Cards

```json
"creditCard": "z.string().regex(/^\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}$/)"
```

### Geographic Coordinates

```json
"latitude": "z.number().min(-90).max(90)",
"longitude": "z.number().min(-180).max(180)"
```

### UUIDs

```json
"uuid": "z.string().uuid()",
"id": "z.string().uuid()"
```

### IP Addresses

```json
"ipAddress": "z.string().ip()",
"ipv4": "z.string().ip({ version: 'v4' })",
"ipv6": "z.string().ip({ version: 'v6' })"
```

## Advanced Usage

### Pattern Matching

You can use the same validator for multiple similar field names:

```json
{
  "specialFieldValidators": {
    "email": "z.string().email()",
    "userEmail": "z.string().email()",
    "contactEmail": "z.string().email()"
  }
}
```

### Complex Validators

You can use more complex validation chains:

```json
{
  "specialFieldValidators": {
    "password": "z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/)"
  }
}
```

### Transformations

You can apply transformations as part of the validation:

```json
{
  "specialFieldValidators": {
    "username": "z.string().toLowerCase().trim().min(3)"
  }
}
```

### Optional Fields

Special validators work with optional fields too. The optionality is preserved:

```json
{
  "specialFieldValidators": {
    "website": "z.string().url().optional()"
  }
}
```

## Best Practices

1. **Consistency**: Define validators once in your config to ensure consistent validation rules across your application.

2. **Documentation**: Keep your special field validators documented for team reference.

3. **Testing**: Test your validators with both valid and invalid data to ensure they behave as expected.

4. **Maintainability**: Group related validators together and use consistent naming patterns.

5. **Performance**: Avoid overly complex regex patterns that might impact performance.

## Limitations

- Validators are applied based on exact field name matches.
- Field validators don't consider the actual TypeScript type of the field.
- Circular references in validators won't work.

## Example Project

Check out the `examples/special-validators` directory for a complete example project demonstrating how to use special field validators effectively. 