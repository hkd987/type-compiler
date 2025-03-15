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

## Pattern-Based Field Matching

The type-compiler now supports regex pattern matching for field names, allowing you to apply validators more flexibly. This is especially useful when you have naming conventions or want to validate fields with similar purposes.

### Configuration

To use pattern-based field matching, specify an object with `pattern: true` and your validator:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "specialFieldValidators": {
          "email": "z.string().email()",
          "^.*Email$": {
            "pattern": true,
            "validator": "z.string().email()"
          },
          "^id": {
            "pattern": true,
            "validator": "z.string().uuid()"
          }
        }
      }
    ]
  }
}
```

### How Pattern Matching Works

1. For each field, the plugin first checks for exact matches in your `specialFieldValidators` configuration.
2. If no exact match is found, it checks all pattern-based validators to find a match.
3. If multiple patterns match, the first one defined in the configuration is used.
4. Exact matches always take precedence over pattern matches.

### Real-World Pattern Examples

Here's a comprehensive list of useful pattern-based validators for common scenarios:

#### Email Addresses and Contact Information

```json
"^.*Email$": {
  "pattern": true,
  "validator": "z.string().email()"
},
"^email[A-Z]": {
  "pattern": true,
  "validator": "z.string().email()"
},
"^contact[A-Z]": {
  "pattern": true,
  "validator": "z.string()"
}
```

#### Identifiers and References

```json
".*(?:Id|Key|Code)$": {
  "pattern": true,
  "validator": "z.string().min(1)"
},
"^uuid$|^guid$": {
  "pattern": true,
  "validator": "z.string().uuid()"
}
```

#### Timestamps and Dates

```json
"^.*(?:At|Date|Time)$": {
  "pattern": true,
  "validator": "z.date().or(z.string().pipe(z.coerce.date()))"
},
"^created|^updated|^modified": {
  "pattern": true,
  "validator": "z.date()"
}
```

#### Monetary Values

```json
"(?:amount|cost|price|fee|total)(?:$|[A-Z])": {
  "pattern": true,
  "validator": "z.number().min(0).or(z.string().regex(/^\\d+(\\.\\d{1,2})?$/).transform(Number))"
},
"^currency$|^.*Currency$": {
  "pattern": true,
  "validator": "z.string().length(3).regex(/^[A-Z]{3}$/)"
}
```

#### Status Fields and Enums

```json
".*Status$": {
  "pattern": true,
  "validator": "z.enum(['active', 'inactive', 'pending', 'completed', 'failed', 'cancelled']).or(z.string())"
},
".*Type$": {
  "pattern": true,
  "validator": "z.string()"
}
```

#### Percentages and Rates

```json
".*(?:Percent|Rate|Ratio)$": {
  "pattern": true,
  "validator": "z.number().min(0).max(100)"
},
".*Decimal$": {
  "pattern": true,
  "validator": "z.number().min(0).max(1)"
}
```

#### Counting Fields

```json
".*Count$": {
  "pattern": true,
  "validator": "z.number().int().min(0)"
},
".*Limit$": {
  "pattern": true,
  "validator": "z.number().int().positive()"
}
```

#### Dimension Measurements

```json
"(?:width|height|depth|length|radius|size)(?:$|[A-Z])": {
  "pattern": true,
  "validator": "z.number().positive()"
},
".*Size$": {
  "pattern": true,
  "validator": "z.number().positive()"
}
```

#### Boolean Flags

```json
"^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]": {
  "pattern": true,
  "validator": "z.boolean()"
},
".*Enabled$|.*Active$|.*Visible$": {
  "pattern": true, 
  "validator": "z.boolean()"
}
```

#### Collections and Arrays

```json
"^(?:tags|categories|items|products|users)$": {
  "pattern": true,
  "validator": "z.array(z.any())"
},
".*List$|.*Array$|.*Collection$": {
  "pattern": true,
  "validator": "z.array(z.any())"
}
```

#### Colors and UI Properties

```json
".*[Cc]olor$": {
  "pattern": true,
  "validator": "z.string().regex(/^#([0-9A-F]{3}){1,2}$/i).or(z.string().regex(/^rgb\\(\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}\\)$/))"
},
".*Theme$": {
  "pattern": true,
  "validator": "z.string()"
}
```

### Real-World Use Cases

#### E-commerce Product Data

For an e-commerce system, pattern-based validators ensure consistent validation of product attributes:

```typescript
interface Product {
  productId: string;                // Matches identifier pattern
  name: string;
  basePrice: number;                // Matches monetary pattern
  discountAmount: number;           // Matches monetary pattern
  stockCount: number;               // Matches count pattern
  isAvailable: boolean;             // Matches boolean pattern
  primaryColor: string;             // Matches color pattern
  productStatus: string;            // Matches status pattern
  dimensions: {
    width: number;                  // Matches dimension pattern
    height: number;                 // Matches dimension pattern
    depth: number;                  // Matches dimension pattern
  };
  createdAt: Date;                  // Matches timestamp pattern
}
```

#### Financial Transactions

Financial systems benefit from consistent validation of monetary values and rates:

```typescript
interface Transaction {
  transactionId: string;            // Matches identifier pattern
  amount: number;                   // Matches monetary pattern
  fee: number;                      // Matches monetary pattern
  interestRate: number;             // Matches percentage pattern
  exchangeRate: number;             // Matches rate pattern
  transactionDate: Date;            // Matches timestamp pattern
  transactionStatus: string;        // Matches status pattern
}
```

#### Analytics Data

Analytics systems use pattern matching to validate metrics and counts:

```typescript
interface AnalyticsData {
  visitorCount: number;             // Matches count pattern
  bounceRate: number;               // Matches percentage pattern
  conversionRate: number;           // Matches percentage pattern
  isRealTime: boolean;              // Matches boolean pattern
  recordedAt: Date;                 // Matches timestamp pattern
}
```

### Best Practices for Pattern Matching

1. **Start with Specific Patterns**: Begin with more specific patterns and move to more general ones to avoid unexpected matches.

2. **Test Your Patterns**: Verify that your patterns match exactly the fields you expect.

3. **Use Anchors**: Use `^` and `$` anchors to ensure you're matching complete field names, not just substrings.

4. **Document Patterns**: Comment your regex patterns to explain what they're matching.

5. **Use Consistent Naming Conventions**: Adopt consistent naming conventions in your codebase to make patterns more effective.

6. **Provide Fallbacks**: For enums and specific formats, consider using `.or(z.string())` to provide a fallback when strict validation isn't required.

7. **Combine with Type Information**: Consider the expected TypeScript type when designing pattern validators.

## Example Project

Check out the `examples/special-validators` directory for a complete example project demonstrating how to use special field validators effectively. 