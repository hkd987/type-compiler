# IDE Integration for Pattern-Based Field Matching

Type Compiler includes a TypeScript Language Service plugin that provides IDE hints and autocompletion for pattern-based field validation. This enhances the developer experience by making validation rules visible during development.

## Features

### 1. Hover Information

When you hover over a field name in an interface or type definition, the IDE will show:

- Whether the field has a special validator
- What kind of validation will be applied (email, URL, UUID, etc.)
- The actual Zod validation code that will be used

![Hover Example](images/hover-example.png)

### 2. Code Completion

When defining fields in interfaces or types, the IDE will suggest field names that have special validators configured:

- Shows common field names from your `specialFieldValidators` configuration
- Indicates what kind of validation will be applied
- Prioritizes these suggestions at the top of the completion list

![Completion Example](images/completion-example.png)

### 3. Visual Indicators

Fields that will have special validation applied are marked with informational diagnostics:

- Visual indicators in the editor gutter
- No errors or warnings, just informational hints
- Can be toggled on/off in IDE settings

![Diagnostic Example](images/diagnostic-example.png)

## Setup

The Language Service plugin is automatically activated when you include the type-compiler plugin in your `tsconfig.json`. No additional configuration is needed.

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "type-compiler",
        "generateZodSchemas": true,
        "specialFieldValidators": {
          "email": "z.string().email()",
          "^.*Email$": {
            "pattern": true,
            "validator": "z.string().email()"
          }
        }
      }
    ]
  }
}
```

## Editor-Specific Setup

### Visual Studio Code

1. Make sure you're using the workspace version of TypeScript:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Type "TypeScript: Select TypeScript Version"
   - Select "Use Workspace Version"

2. You may need to restart VS Code after changing your tsconfig.json

### WebStorm / IntelliJ IDEA

1. Go to Settings > Languages & Frameworks > TypeScript
2. Ensure "Use TypeScript from node_modules directory" is selected
3. After changing tsconfig.json, you may need to restart the TypeScript service:
   - Right-click on the TypeScript icon in the status bar
   - Select "Restart TypeScript Service"

### Vim/NeoVim with CoC

1. Make sure the coc-tsserver extension is installed
2. No additional configuration needed if your tsconfig.json is properly set up

## Troubleshooting

If the IDE hints are not appearing:

1. **Check TypeScript Version**: Make sure you're using TypeScript 4.0 or later
2. **Verify Plugin Activation**: Check if other features of the type-compiler are working
3. **Editor Settings**: Some editors have settings to control diagnostic visibility
4. **Restart IDE**: Sometimes a full restart is needed after configuration changes
5. **Check Console**: Look for errors in the TypeScript Language Service output

## Examples

### Exact Field Name Matching

When you have exact field name matches in your configuration:

```typescript
// tsconfig.json has: "email": "z.string().email()"
interface User {
  email: string; // Shows validation info on hover
}
```

### Pattern-Based Field Matching

When you have pattern-based validators:

```typescript
// tsconfig.json has: "^.*Email$": { "pattern": true, "validator": "z.string().email()" }
interface Contact {
  primaryEmail: string;   // Shows validation info on hover
  secondaryEmail: string; // Shows validation info on hover
  phone: string;          // No special validation
}
```

### Multiple Patterns

When a field name matches multiple patterns, the first match in the configuration is used:

```typescript
// With overlapping patterns, first match wins
interface SensitiveData {
  userIdCode: string;  // If both "^user" and ".*Code$" patterns exist, first one wins
}
```

## Best Practices

1. **Consistent Naming**: Use consistent field naming patterns across your codebase
2. **Documentation**: Add comments explaining validation logic for complex fields
3. **Pattern Specificity**: Make patterns specific enough to avoid unintended matches
4. **Pattern Priority**: Order patterns in your config from most specific to least specific
5. **Team Communication**: Ensure your team understands the naming conventions and validation patterns

## Future Enhancements

We're planning to enhance the IDE integration with:

1. **Quick Fixes**: Add suggestions to rename fields to match validation patterns
2. **Code Actions**: Add the ability to generate validation code from the IDE
3. **Visualization**: Provide visual cues for pattern matching with highlighting
4. **Configuration UI**: Provide a UI for configuring and testing validation patterns

## Feedback

We welcome feedback on the IDE integration features! Please file issues on our GitHub repository with suggestions for improvement. 