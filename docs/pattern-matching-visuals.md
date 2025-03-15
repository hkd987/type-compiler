# Pattern-Based Field Matching: Visual Guide

This visual guide explains how pattern-based field matching works in the type-compiler plugin, using diagrams and examples to illustrate the process.

## How Pattern Matching Works

```
┌─────────────────────┐
│ TypeScript Interface│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│    Property Name    │────▶│  Extract Field Name │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│   Validation Rules  │     │   Is Exact Match?   │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           │                      ┌────┴────┐
           │                      │         │
           │                     Yes        No
           │                      │         │
           │                      │         ▼
           │                      │  ┌─────────────────────┐
           │                      │  │  Try Pattern Match  │
           │                      │  └──────────┬──────────┘
           │                      │             │
           │                      │        ┌────┴────┐
           │                      │        │         │
           │                      │       Yes        No
           │                      │        │         │
           │                      ▼        ▼         ▼
           │             ┌─────────────┐   │   ┌─────────────┐
           └────────────▶│ Use Exact   │   │   │ Use Default │
                        │ Validator   │◀──┘   │ Validator   │
                        └─────────────┘       └─────────────┘
```

## Matching Priority

When multiple patterns could match a field name, the system follows a specific priority:

1. **Exact Match**: If the field name exactly matches a key in `specialFieldValidators`
2. **Pattern Match**: If no exact match, try each pattern in the order defined
3. **Default**: If no matches found, use the default validator based on the field's type

```
┌──────────────────┐
│ Field: "email"   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Check Exact Match: "email"       │──Yes──► Use "z.string().email()"
└──────────────┬───────────────────┘
               │
               │ No
               ▼
┌──────────────────────────────────┐
│ Try Pattern: "^.*Email$"         │──No───┐
└──────────────┬───────────────────┘        │
               │                            │
               │ No                         │
               ▼                            │
┌──────────────────────────────────┐        │
│ Try Pattern: "^email[A-Z]"       │──No───┘
└──────────────┬───────────────────┘        │
               │                            │
               │ No                         │
               ▼                            ▼
┌──────────────────────────────────┐  ┌──────────────────┐
│ ...other patterns...             │  │ Use Default:     │
└──────────────────────────────────┘  │ z.any()          │
                                      └──────────────────┘
```

## Visual Examples

### Example 1: Email Field Patterns

| Field Name      | Pattern          | Matches | Validator Used          |
|-----------------|------------------|---------|-------------------------|
| `email`         | `"email"`        | ✅ Yes  | `z.string().email()`    |
| `userEmail`     | `"^.*Email$"`    | ✅ Yes  | `z.string().email()`    |
| `contactEmail`  | `"^.*Email$"`    | ✅ Yes  | `z.string().email()`    |
| `emailAddress`  | `"^.*Email$"`    | ❌ No   | Default (`z.any()`)     |
| `emailSent`     | `"^email[A-Z]"`  | ✅ Yes  | `z.string().email()`    |

### Example 2: Monetary Value Patterns

| Field Name      | Pattern                               | Matches | Validator Used                   |
|-----------------|---------------------------------------|---------|----------------------------------|
| `price`         | `"(?:amount\|cost\|price)(?:$\|[A-Z])"` | ✅ Yes  | `z.number().min(0)`             |
| `basePrice`     | `"(?:amount\|cost\|price)(?:$\|[A-Z])"` | ✅ Yes  | `z.number().min(0)`             |
| `totalAmount`   | `"(?:amount\|cost\|price)(?:$\|[A-Z])"` | ✅ Yes  | `z.number().min(0)`             |
| `pricey`        | `"(?:amount\|cost\|price)(?:$\|[A-Z])"` | ❌ No   | Default (`z.any()`)             |
| `shippingCost`  | `"(?:amount\|cost\|price)(?:$\|[A-Z])"` | ✅ Yes  | `z.number().min(0)`             |

## Field Name Analysis

Below is a visual representation of how regex patterns match field names:

### Pattern: `^.*Email$`

```
userEmail
└───┬───┘└─┬─┘
    │      │
    │      └── Matches "Email$" (ends with "Email")
    │
    └────────── Matches "^.*" (any characters at start)

contactEmail
└─────┬─────┘└─┬─┘
      │        │
      │        └── Matches "Email$" (ends with "Email")
      │
      └──────────── Matches "^.*" (any characters at start)

email
└─┬──┘
  │
  └── Does NOT match "^.*Email$" (doesn't end with "Email")
```

### Pattern: `^is[A-Z]|^has[A-Z]`

```
isActive
└┬┘└──┬──┘
 │    │
 │    └── Matches "[A-Z]" (uppercase letter after "is")
 │
 └────── Matches "^is" (starts with "is")

hasPermission
└┬┘└───┬────┘
 │     │
 │     └─── Matches "[A-Z]" (uppercase letter after "has")
 │
 └─────── Matches "^has" (starts with "has")

active
└──┬──┘
   │
   └── Does NOT match pattern (doesn't start with "is" or "has")
```

## Real-World Example Visualization

Consider an e-commerce product interface with various fields:

```typescript
interface Product {
  productId: string;
  name: string;
  basePrice: number;
  stockCount: number;
  isAvailable: boolean;
  createdAt: Date;
}
```

The pattern matching process would analyze each field:

```
Field: productId
┌─────────────────────────────┐
│ Check exact match: No       │
├─────────────────────────────┤
│ Try pattern: .*(?:Id)$      │─── Matches! ───┐
└─────────────────────────────┘                │
                                               ▼
                                    ┌─────────────────────────┐
                                    │ Use z.string().min(1)   │
                                    └─────────────────────────┘

Field: basePrice
┌─────────────────────────────┐
│ Check exact match: No       │
├─────────────────────────────┤
│ Try pattern: (?:price)[A-Z] │─── Matches! ───┐
└─────────────────────────────┘                │
                                               ▼
                                    ┌─────────────────────────┐
                                    │ Use z.number().min(0)   │
                                    └─────────────────────────┘

Field: stockCount
┌─────────────────────────────┐
│ Check exact match: No       │
├─────────────────────────────┤
│ Try pattern: .*Count$       │─── Matches! ───┐
└─────────────────────────────┘                │
                                               ▼
                                    ┌─────────────────────────────┐
                                    │ Use z.number().int().min(0) │
                                    └─────────────────────────────┘

Field: isAvailable
┌─────────────────────────────┐
│ Check exact match: No       │
├─────────────────────────────┤
│ Try pattern: ^is[A-Z]       │─── Matches! ───┐
└─────────────────────────────┘                │
                                               ▼
                                    ┌─────────────────────────┐
                                    │ Use z.boolean()         │
                                    └─────────────────────────┘

Field: createdAt
┌─────────────────────────────┐
│ Check exact match: No       │
├─────────────────────────────┤
│ Try pattern: ^.*(?:At)$     │─── Matches! ───┐
└─────────────────────────────┘                │
                                               ▼
                                    ┌─────────────────────────────────────────┐
                                    │ Use z.date().or(z.string().pipe(...))   │
                                    └─────────────────────────────────────────┘
```

## The Generated Schema

After pattern matching, the resulting Zod schema would look like:

```typescript
const zProduct = z.object({
  productId: z.string().min(1),
  name: z.string(),  // Default validator (no pattern match)
  basePrice: z.number().min(0),
  stockCount: z.number().int().min(0),
  isAvailable: z.boolean(),
  createdAt: z.date().or(z.string().pipe(z.coerce.date()))
});
```

## Pattern Matching in Your Project

To implement this in your project, follow these steps:

```
┌───────────────────────────┐
│ 1. Define naming patterns │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│ 2. Configure patterns     │
│    in tsconfig.json       │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│ 3. Apply consistent       │
│    naming in your code    │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│ 4. Run the compiler       │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│ 5. Use generated schemas  │
│    for validation         │
└───────────────────────────┘
```

## Benefits Visualization

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Without Pattern Matching         With Pattern Matching    │
│  ----------------------         ----------------------     │
│                                                            │
│  interface User {                interface User {          │
│    email: string;      =>         email: string;           │
│    userEmail: string;  =>         userEmail: string;       │
│    workEmail: string;  =>         workEmail: string;       │
│  }                               }                         │
│                                                            │
│  // Manual validation           // Automatic validation    │
│  z.object({                     // All email fields use    │
│    email: z.string().email(),   // the same validator      │
│    userEmail: z.string().email(), // automatically!        │
│    workEmail: z.string().email()                           │
│  })                                                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

By adopting pattern-based field matching, your validation logic becomes more consistent, maintainable, and scales automatically as your codebase grows. 