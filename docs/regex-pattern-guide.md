# Visual Guide to Regex Patterns for Field Validation

Regular expressions (regex) can be intimidating, but they're a powerful tool for pattern matching. This guide helps you understand the regex patterns used in special field validators.

## Understanding Regex Basics

### Building Blocks of Regex

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│   Regex Pattern: ^.*Email$                                    │
│                  │ │ │     │                                  │
│                  │ │ │     └─ $ End of string                 │
│                  │ │ └─────── "Email" Literal text            │
│                  │ └───────── .* Any characters (0 or more)   │
│                  └─────────── ^ Start of string               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Common Regex Symbols

| Symbol | Meaning | Example |
|--------|---------|---------|
| `^` | Start of string | `^user` matches strings starting with "user" |
| `$` | End of string | `user$` matches strings ending with "user" |
| `.` | Any single character | `a.c` matches "abc", "adc", etc. |
| `*` | 0 or more of preceding | `a*` matches "", "a", "aa", etc. |
| `+` | 1 or more of preceding | `a+` matches "a", "aa", etc. but not "" |
| `?` | 0 or 1 of preceding | `colou?r` matches "color" or "colour" |
| `[abc]` | Character class - any of a, b, or c | `[aeiou]` matches any vowel |
| `[A-Z]` | Character range - any from A to Z | `[A-Z]` matches uppercase letters |
| `[^abc]` | Negated character class | `[^0-9]` matches any non-digit |
| `\d` | Digit | `\d+` matches one or more digits |
| `\w` | Word character (alphanumeric + _) | `\w+` matches words |
| `\s` | Whitespace | `\s+` matches spaces, tabs, etc. |
| `|` | Alternation (OR) | `cat|dog` matches "cat" or "dog" |
| `(...)` | Grouping | `(abc)+` matches "abc", "abcabc", etc. |
| `(?:...)` | Non-capturing group | Used for grouping without capturing |

## Common Field Validator Patterns Explained

### Email Fields: `^.*Email$`

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│ Pattern: ^.*Email$                                            │
│                                                               │
│ Meaning: Match any string that ends with "Email"              │
│                                                               │
│ Visual breakdown:                                             │
│                                                               │
│ userEmail                                                     │
│ └───┬───┘└─┬─┘                                                │
│     │      │                                                  │
│     │      └──── Matches "Email" at the end                   │
│     │                                                         │
│     └──────────── Any characters before "Email"               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

#### Matches:
- `userEmail`
- `primaryEmail`
- `workEmail`
- `Email`

#### Doesn't Match:
- `emailAddress` (doesn't end with "Email")
- `user_email` (doesn't end with "Email")
- `EmailUser` (doesn't end with "Email")

### ID Fields: `^id[A-Z].*`

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│ Pattern: ^id[A-Z].*                                           │
│          │ │ │   │                                            │
│          │ │ │   └─ .* Any characters (0 or more)             │
│          │ │ └───── [A-Z] One uppercase letter                │
│          │ └─────── "id" Literal text                         │
│          └───────── ^ Start of string                         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

#### Matches:
- `idUser`
- `idProduct`
- `idAPI`
- `idZone`

#### Doesn't Match:
- `userId` (doesn't start with "id")
- `identity` (no uppercase after "id")
- `ID` (doesn't start with lowercase "id")

### Boolean Flags: `^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]`

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│ Pattern: ^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]            │
│                                                               │
│ Meaning: Match strings that:                                  │
│   - Start with "is" followed by an uppercase letter, OR       │
│   - Start with "has" followed by an uppercase letter, OR      │
│   - Start with "can" followed by an uppercase letter, OR      │
│   - Start with "should" followed by an uppercase letter       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

Visual breakdown:
```
isActive       hasPermission     canEdit        shouldUpdate
└┬┘└──┬──┘     └┬┘└───┬────┘     └┬┘└─┬──┘      └──┬──┘└──┬──┘
 │    │         │     │           │   │            │       │
 │    │         │     │           │   │            │       │
 │    └── [A-Z] │     └── [A-Z]   │   └── [A-Z]    │       └── [A-Z]
 │              │                 │                │
 └── "is"       └── "has"         └── "can"        └── "should"
```

#### Matches:
- `isActive`
- `hasPermission`
- `canEdit`
- `shouldUpdate`

#### Doesn't Match:
- `active` (doesn't start with a prefix)
- `isactive` (no uppercase after "is")
- `HasPermission` (doesn't start with lowercase "has")

### Date Fields: `^.*(?:At|Date|Time)$`

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│ Pattern: ^.*(?:At|Date|Time)$                                 │
│          │ │ │            │ │                                 │
│          │ │ │            │ └─ $ End of string                │
│          │ │ │            └─── "At" OR "Date" OR "Time"       │
│          │ │ └────────────── (?:) Non-capturing group         │
│          │ └─────────────── .* Any characters (0 or more)     │
│          └───────────────── ^ Start of string                 │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

#### Matches:
- `createdAt`
- `updatedAt`
- `birthDate`
- `startTime`

#### Doesn't Match:
- `dateOfBirth` (doesn't end with exact "At", "Date", or "Time")
- `timestamp` (doesn't end with exact "At", "Date", or "Time")
- `at_created` (doesn't end with "At")

### Monetary Values: `(?:amount|cost|price|fee|total)(?:$|[A-Z])`

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│ Pattern: (?:amount|cost|price|fee|total)(?:$|[A-Z])           │
│                                                               │
│ This pattern has two parts:                                   │
│                                                               │
│ 1. (?:amount|cost|price|fee|total)                            │
│    Match any of these words: amount, cost, price, fee, total  │
│                                                               │
│ 2. (?:$|[A-Z])                                                │
│    Either be at the end of the string ($) OR                  │
│    Be followed by an uppercase letter [A-Z]                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

#### Matches:
- `price` (exact word at end)
- `totalAmount` (total + uppercase A)
- `priceBase` (price + uppercase B)
- `fee` (exact word at end)

#### Doesn't Match:
- `pricing` (not an exact match for price + doesn't have capital letter after)
- `totalUsers` (total is not an entire word match)
- `pricedata` (no uppercase after price)

## Visualizing Complex Patterns

### Dimension Fields: `(?:width|height|depth|length|radius|size)(?:$|[A-Z])`

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│ Pattern parts:                                                │
│                                                               │
│ ┌───────────────────────────────────┐                         │
│ │ (?:width|height|depth|length|     │─┐                       │
│ │    radius|size)                   │ │                       │
│ └───────────────────────────────────┘ │                       │
│             One of these words         │                       │
│                                        │                       │
│ ┌───────────────────────────────────┐ │                       │
│ │ (?:$|[A-Z])                       │◀┘                       │
│ └───────────────────────────────────┘                         │
│       End of string OR uppercase letter                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

Examples:
- `width`
- `imageHeight`
- `boxDepth`
- `size`
- `sizeCategory`

### Collection Fields: `^(?:tags|categories|items|products|users)$`

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│ Pattern: ^(?:tags|categories|items|products|users)$           │
│          │ │                                  │ │             │
│          │ │                                  │ └─ $ End      │
│          │ └──────────────────────────────────── Exact word   │
│          └────────────────────────────────────── ^ Start      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

This pattern matches ONLY these exact words:
- `tags`
- `categories`
- `items`
- `products`
- `users`

It doesn't match anything else, as it requires an exact match of the whole string.

## Building Your Own Patterns

### Pattern Building Process

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  1. Identify common field naming patterns                     │
│     ┌─────────────────────┐                                   │
│     │ userEmail           │                                   │
│     │ adminEmail          │ All end with "Email"              │
│     │ contactEmail        │                                   │
│     └─────────────────────┘                                   │
│                │                                              │
│                ▼                                              │
│  2. Create a pattern that captures the commonality            │
│     Pattern: ^.*Email$                                        │
│              │ │ │    │                                       │
│              │ │ │    └── End of string                       │
│              │ │ └────── Literal "Email"                      │
│              │ └──────── Any characters                       │
│              └────────── Start of string                      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Step-by-Step Pattern Creation

Let's say you want to match fields related to percentages. You notice they often end with "Percent", "Rate", or "Ratio".

```
1. Identify the pattern:
   - conversionRate
   - bounceRate
   - completionRatio
   - errorPercent

2. Identify the common endings:
   - "Percent"
   - "Rate"
   - "Ratio"

3. Create a pattern that matches these endings:
   .*(?:Percent|Rate|Ratio)$
   │  │             │      │
   │  │             │      └── End of string
   │  │             └────────── "Percent" OR "Rate" OR "Ratio"
   │  └────────────────────── Non-capturing group
   └───────────────────────── Any characters before
```

## Pattern Testing Visualization

When testing if a field name matches a pattern, here's what happens:

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  Pattern: ^.*Email$                                           │
│                                                               │
│  Test String: "userEmail"                                     │
│               └───┬───┘└─┬─┘                                  │
│                   │      │                                    │
│  Match Process:   │      │                                    │
│  1. '^'  Start of string ┘      │                            │
│  2. '.*' Any characters ────────┘                            │
│  3. 'Email' Literal text ───────────────────┐                │
│  4. '$'  End of string ───────────────────────────┐          │
│                                                    │          │
│  Result: MATCH! ─────────────────────────────────┘           │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  Pattern: ^.*Email$                                           │
│                                                               │
│  Test String: "emailAddress"                                  │
│               └──┬──┘└───┬───┘                                │
│                  │       │                                    │
│  Match Process:  │       │                                    │
│  1. '^'  Start of string ┘       │                           │
│  2. '.*' Any characters ─────────┘                           │
│  3. 'Email' Literal text ───┐                                │
│     ❌ String doesn't contain 'Email' at the end!            │
│                               │                              │
│  Result: NO MATCH! ───────────┘                             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Common Regex Patterns Cheat Sheet

### Prefix Patterns

| Pattern | Description | Example Matches |
|---------|-------------|-----------------|
| `^is[A-Z]` | Starts with "is" + uppercase | isActive, isEnabled |
| `^has[A-Z]` | Starts with "has" + uppercase | hasChildren, hasAccess |
| `^can[A-Z]` | Starts with "can" + uppercase | canEdit, canDelete |
| `^get[A-Z]` | Starts with "get" + uppercase | getName, getValues |
| `^set[A-Z]` | Starts with "set" + uppercase | setName, setValue |

### Suffix Patterns

| Pattern | Description | Example Matches |
|---------|-------------|-----------------|
| `.*Id$` | Ends with "Id" | userId, productId |
| `.*Name$` | Ends with "Name" | userName, firstName |
| `.*Count$` | Ends with "Count" | userCount, itemCount |
| `.*Date$` | Ends with "Date" | birthDate, startDate |
| `.*At$` | Ends with "At" | createdAt, updatedAt |

### Contains Patterns

| Pattern | Description | Example Matches |
|---------|-------------|-----------------|
| `.*[pP]assword.*` | Contains "password" or "Password" | password, userPassword |
| `.*[eE]mail.*` | Contains "email" or "Email" | email, userEmail, emailAddress |
| `.*[pP]hone.*` | Contains "phone" or "Phone" | phone, phoneNumber |
| `.*[aA]ddress.*` | Contains "address" or "Address" | address, emailAddress |

### Complex Patterns

| Pattern | Description | Example Matches |
|---------|-------------|-----------------|
| `^(?:is\|has\|can)[A-Z]` | Boolean prefixes | isActive, hasPermission, canEdit |
| `(?:width\|height\|depth)(?:$\|[A-Z])` | Dimension fields | width, imageHeight, boxDepth |
| `(?:created\|updated\|modified)(?:At\|Date\|Time)` | Timestamp fields | createdAt, updatedDate, modifiedTime |

## Debugging Regex Patterns

When a pattern isn't matching as expected, break it down:

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  Pattern not matching? Troubleshoot step by step:             │
│                                                               │
│  1. Test the simplest version of your pattern                 │
│     (e.g., test 'Email$' before '^.*Email$')                 │
│                                                               │
│  2. Add complexity gradually                                  │
│     - Add anchors (^ or $)                                    │
│     - Add quantifiers (*, +, ?)                               │
│     - Add character classes [...]                            │
│                                                               │
│  3. Check for common mistakes:                                │
│     - Case sensitivity: 'email' ≠ 'Email'                     │
│     - Special characters that need escaping: ., *, +, etc.    │
│     - Misplaced anchors (^ and $)                             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Conclusion

Regular expressions can be powerful tools for pattern matching in field validation. By understanding the building blocks and visualizing how patterns match against strings, you can create effective validation rules that apply consistently across your codebase.

Remember that the order of patterns matters in the `specialFieldValidators` configuration, as the first matching pattern will be used. Start with more specific patterns and move to more general ones to ensure the right validators are applied.

With these visual guides and explanations, you should be better equipped to create and understand regex patterns for field validation in your TypeScript projects. 