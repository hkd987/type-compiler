# IDE Pattern-Based Validation Suggestions Example

This example demonstrates how the TypeScript Language Service plugin provides intelligent suggestions for field names based on pattern-based validators.

## Key Features Demonstrated

1. **Field Name Suggestions** - The IDE suggests field names that match your pattern-based validation rules
2. **Hover Information** - Hovering over field names shows the validation that will be applied
3. **Pattern Matching Indicators** - Fields that match patterns show which pattern they match
4. **Smart Completion** - As you type, get context-sensitive suggestions based on the current prefix

## How to Use This Example

1. Open `index.ts` in an IDE that supports TypeScript Language Service plugins (VS Code, WebStorm, etc.)
2. Make sure your IDE is using the workspace version of TypeScript
3. Place your cursor inside one of the interface definitions
4. Start typing a field name or press Ctrl+Space to see suggestions
5. Hover over the suggested field names to see validation info

## Configuration

The `tsconfig.json` file demonstrates a configuration with various pattern-based field validators:

- Exact matches: `email`, `url`, `phoneNumber`
- Pattern-based: Fields ending with `Email`, fields starting with `id`, etc.
- Complex patterns: Coordinate validation for fields matching latitude/longitude

## Example Patterns

Try typing these prefixes inside an interface definition to see suggestions:

- Type `em` → See suggestion for `email` (exact match)
- Type `user` → See suggestion for `userId` (pattern match `^.*Id$`)
- Type `primary` → See suggestion for `primaryEmail` (pattern match `^.*Email$`)
- Type `lat` → See suggestion for `latitude` (pattern match `(latitude|Latitude)$`)

## Benefits

- **Discoverability** - Easily discover field names that trigger validation
- **Consistency** - Encourages consistent naming patterns across your codebase
- **Documentation** - Shows validation rules during development
- **Efficiency** - Reduces the need to check configuration for validation rules

## Advanced Usage

The TypeScript Language Service plugin intelligently handles different pattern types:

- `^prefix` - Field names starting with a specific prefix
- `suffix$` - Field names ending with a specific suffix
- `^prefix.*suffix$` - Field names with specific prefix and suffix
- `(pattern1|pattern2)` - Alternative patterns

Try creating your own interfaces in this example to experiment with the suggestions! 