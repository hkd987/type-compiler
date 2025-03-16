import * as ts from 'typescript/lib/tsserverlibrary';
import { TypeCompilerOptions } from './types';

/**
 * Check if a field name matches any pattern in the specialFieldValidators
 */
function getMatchingValidator(
  fieldName: string,
  specialFieldValidators: Record<string, string | 
    { pattern: boolean; validator: string; errorMessage?: string } | 
    { validator: string; errorMessage?: string }
  >,
  parentTypeName?: string,
  contextualValidators?: Record<string, 
    Record<string, string | { validator: string; errorMessage?: string }> | 
    { pattern: boolean; fields: Record<string, string | { validator: string; errorMessage?: string }> }
  >
): { validator: string | null; source: string; pattern?: string; errorMessage?: string } {
  // First check contextual validators if parent type name is provided
  if (parentTypeName && contextualValidators) {
    // Check for exact parent type match
    if (parentTypeName in contextualValidators) {
      const contextValidator = contextualValidators[parentTypeName];
      
      // Handle different validator formats
      if (typeof contextValidator === 'object' && !('pattern' in contextValidator)) {
        // It's a direct field mapping
        const fieldsMap = contextValidator as Record<string, string | { validator: string; errorMessage?: string }>;
        if (fieldName in fieldsMap) {
          const validator = fieldsMap[fieldName];
          if (typeof validator === 'string') {
            return { validator, source: `contextual (${parentTypeName})` };
          } else {
            return { 
              validator: validator.validator, 
              source: `contextual (${parentTypeName})`,
              errorMessage: validator.errorMessage
            };
          }
        }
      }
    }
    
    // Check for pattern-based parent type match
    for (const pattern in contextualValidators) {
      const contextValidator = contextualValidators[pattern];
      
      // Skip non-pattern validators
      if (typeof contextValidator !== 'object' || !('pattern' in contextValidator) || !contextValidator.pattern) {
        continue;
      }
      
      // Safely assert the type for the pattern-based validator
      const patternValidator = contextValidator as { pattern: boolean; fields: Record<string, string | { validator: string; errorMessage?: string }> };
      
      try {
        const regex = new RegExp(pattern);
        if (regex.test(parentTypeName) && patternValidator.fields) {
          // Check if the field exists in this pattern-based validator
          if (fieldName in patternValidator.fields) {
            const validator = patternValidator.fields[fieldName];
            if (typeof validator === 'string') {
              return { 
                validator, 
                source: `contextual pattern (${pattern})`, 
                pattern 
              };
            } else {
              return { 
                validator: validator.validator, 
                source: `contextual pattern (${pattern})`, 
                pattern,
                errorMessage: validator.errorMessage
              };
            }
          }
        }
      } catch (e) {
        // Invalid regex pattern
        console.warn(`Invalid regex pattern in contextualValidators: ${pattern}`);
      }
    }
  }
  
  // Then check special field validators (direct match)
  if (fieldName in specialFieldValidators) {
    const validator = specialFieldValidators[fieldName];
    
    if (typeof validator === 'string') {
      return { validator, source: 'field name' };
    } else if (validator && typeof validator === 'object' && 'validator' in validator) {
      return { 
        validator: validator.validator, 
        source: 'field name',
        errorMessage: validator.errorMessage
      };
    }
  }

  // Finally check special field validators with pattern matching
  for (const pattern in specialFieldValidators) {
    const validatorConfig = specialFieldValidators[pattern];
    
    if (validatorConfig && typeof validatorConfig === 'object' && 'pattern' in validatorConfig && validatorConfig.pattern) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(fieldName)) {
          return { 
            validator: validatorConfig.validator, 
            source: `pattern (${pattern})`,
            pattern,
            errorMessage: validatorConfig.errorMessage
          };
        }
      } catch (e) {
        // Invalid regex pattern
        console.warn(`Invalid regex pattern in specialFieldValidators: ${pattern}`);
      }
    }
  }
  
  // No match found
  return { validator: null, source: 'none' };
}

/**
 * Get a human-readable description of a validator
 */
function getValidatorDescription(validator: string): string {
  if (validator.includes('.email()')) return 'email address';
  if (validator.includes('.url()')) return 'URL';
  if (validator.includes('.uuid()')) return 'UUID';
  if (validator.includes('.date()')) return 'date';
  if (validator.includes('.min(') && validator.includes('.max(')) return 'number within range';
  if (validator.includes('.regex(')) return 'matches regex pattern';
  if (validator.includes('.min(')) return 'minimum value/length';
  if (validator.includes('.max(')) return 'maximum value/length';
  if (validator.includes('.ip()')) return 'IP address';
  if (validator.includes('.enum(')) return 'one of a set of values';
  
  return 'custom validation';
}

/**
 * Check if a node is a property declaration in an interface or type
 */
function isPropertyDeclaration(node: ts.Node): node is ts.PropertySignature {
  return node.kind === ts.SyntaxKind.PropertySignature;
}

/**
 * Create the TypeScript Language Service plugin
 */
function init(modules: { typescript: typeof ts }) {
  const typescript = modules.typescript;
  
  function create(info: ts.server.PluginCreateInfo) {
    // Get plugin configuration
    const config = info.config as TypeCompilerOptions;
    const specialFieldValidators = config.specialFieldValidators || {};
    
    // Create a proxy for the language service
    const proxy: ts.LanguageService = Object.create(null);
    const ls = info.languageService;
    
    /**
     * Add validator information to hover tooltips
     */
    proxy.getQuickInfoAtPosition = (fileName: string, position: number) => {
      const original = ls.getQuickInfoAtPosition(fileName, position);
      if (!original) return original;
      
      // Get source file and node at position
      const program = ls.getProgram();
      if (!program) return original;
      
      const sourceFile = program.getSourceFile(fileName);
      if (!sourceFile) return original;
      
      // Find the node at the current position
      const node = findNodeAtPosition(sourceFile, position);
      if (!node) return original;
      
      // Check if this is a property declaration in an interface or type
      if (isPropertyDeclaration(node) && node.name) {
        const fieldName = node.name.getText();
        
        // Find parent type name
        let parentTypeName: string | undefined;
        let parent: ts.Node = node.parent;
        
        while (parent) {
          if (ts.isInterfaceDeclaration(parent) && parent.name) {
            parentTypeName = parent.name.getText();
            break;
          } else if (ts.isTypeAliasDeclaration(parent) && parent.name) {
            parentTypeName = parent.name.getText();
            break;
          } else if (ts.isTypeLiteralNode(parent)) {
            parentTypeName = 'AnonymousType';
            break;
          }
          
          parent = parent.parent;
        }
        
        // Get validator information
        const validatorInfo = getMatchingValidator(
          fieldName, 
          specialFieldValidators, 
          parentTypeName,
          config.contextualValidators
        );
        
        if (validatorInfo.validator) {
          const description = getValidatorDescription(validatorInfo.validator);
          let validationText = `Will be validated as ${description}`;
          
          // Add context info
          if (validatorInfo.source.startsWith('contextual')) {
            validationText = `Matches ${validatorInfo.source} - ${validationText}`;
          } else if (validatorInfo.source.startsWith('field pattern')) {
            validationText = `Matches ${validatorInfo.source} - ${validationText}`;
          }
          
          // Add validation info to the hover text
          const newDisplayParts = [...(original.displayParts || [])];
          newDisplayParts.push(
            { text: '\n\n', kind: 'lineBreak' },
            { text: '(type-compiler)', kind: 'label' },
            { text: ' ', kind: 'space' },
            { text: validationText, kind: 'text' },
            { text: '\n', kind: 'lineBreak' },
            { text: validatorInfo.validator, kind: 'text' }
          );
          
          return {
            ...original,
            displayParts: newDisplayParts,
            documentation: original.documentation || []
          };
        }
      }
      
      return original;
    };
    
    /**
     * Helper function to find the node at a specific position
     */
    function findNodeAtPosition(sourceFile: ts.SourceFile, position: number): ts.Node | undefined {
      function find(node: ts.Node): ts.Node | undefined {
        if (position >= node.getStart() && position < node.getEnd()) {
          return typescript.forEachChild(node, find) || node;
        }
        return undefined;
      }
      
      return find(sourceFile);
    }
    
    /**
     * Add completion entries for field names that would trigger validation
     */
    proxy.getCompletionsAtPosition = (fileName: string, position: number, options) => {
      const original = ls.getCompletionsAtPosition(fileName, position, options);
      if (!original) return original;
      
      // Get source file
      const program = ls.getProgram();
      if (!program) return original;
      
      const sourceFile = program.getSourceFile(fileName);
      if (!sourceFile) return original;
      
      // Check if we're in an interface or type context
      const node = findNodeAtPosition(sourceFile, position);
      if (!node) return original;
      
      const parent = node.parent;
      const isInInterfaceOrType = 
        parent && (
          parent.kind === ts.SyntaxKind.InterfaceDeclaration || 
          parent.kind === ts.SyntaxKind.TypeLiteral
        );
      
      if (isInInterfaceOrType) {
        // Add suggestions for common field names with special validators
        const completions = [...original.entries];
        
        // Get the current field name prefix being typed
        const currentPrefix = node.getText() || '';
        
        // Extract validation patterns (exact matches and patterns)
        Object.entries(specialFieldValidators).forEach(([pattern, validatorConfig]) => {
          // Handle exact matches 
          if (typeof validatorConfig === 'string' && !pattern.startsWith('^') && !pattern.includes('(')) {
            const description = getValidatorDescription(validatorConfig);
            
            // Only add completion if it matches the current prefix (if any)
            if (!currentPrefix || pattern.startsWith(currentPrefix)) {
              completions.push({
                name: pattern,
                kind: typescript.ScriptElementKind.memberVariableElement,
                kindModifiers: typescript.ScriptElementKindModifier.none,
                sortText: '0-' + pattern, // Sort at the top
                insertText: pattern,
                isSnippet: true,
                labelDetails: {
                  description: `Field with ${description} validation`
                }
              });
            }
          } 
          // Handle pattern-based validators - properly type check
          else if (typeof validatorConfig === 'object' && 'pattern' in validatorConfig && validatorConfig.pattern) {
            try {
              // Generate example field names based on patterns
              const patternSuggestions = generateFieldSuggestionsFromPattern(
                pattern, 
                validatorConfig.validator, 
                currentPrefix
              );
              
              // Add each generated suggestion to completions
              patternSuggestions.forEach(suggestion => {
                const description = getValidatorDescription(validatorConfig.validator);
                
                completions.push({
                  name: suggestion.name,
                  kind: typescript.ScriptElementKind.memberVariableElement,
                  kindModifiers: typescript.ScriptElementKindModifier.none,
                  sortText: '1-' + suggestion.name, // Sort after exact matches
                  insertText: suggestion.name,
                  isSnippet: true,
                  labelDetails: {
                    description: `Matches pattern ${pattern} - ${description}`
                  }
                });
              });
            } catch (error) {
              // Invalid regex pattern, skip
              console.warn(`Invalid regex pattern in specialFieldValidators: ${pattern}`);
            }
          }
        });
        
        return {
          ...original,
          entries: completions
        };
      }
      
      return original;
    };
    
    /**
     * Generate field name suggestions from a regex pattern
     */
    function generateFieldSuggestionsFromPattern(
      pattern: string,
      validator: string,
      currentPrefix: string = ''
    ): Array<{ name: string; pattern: string }> {
      const suggestions: Array<{ name: string; pattern: string }> = [];
      
      // Common field name templates based on validation types
      const validatorType = getValidatorDescription(validator);
      
      // Create example field names based on the pattern and validator type
      if (pattern.startsWith('^') && pattern.endsWith('$')) {
        // Exact pattern (^something$)
        const exactName = pattern.slice(1, -1);
        if (!currentPrefix || exactName.startsWith(currentPrefix)) {
          suggestions.push({ name: exactName, pattern });
        }
      } else if (pattern.startsWith('^')) {
        // Starts with pattern (^prefix)
        const prefix = pattern.slice(1);
        
        // Generate common field names based on validator type
        const examples = generateExamplesForValidatorType(prefix, validatorType);
        examples.forEach(example => {
          if (!currentPrefix || example.startsWith(currentPrefix)) {
            suggestions.push({ name: example, pattern });
          }
        });
      } else if (pattern.endsWith('$')) {
        // Ends with pattern (suffix$)
        const suffix = pattern.slice(0, -1);
        
        // Generate common field names based on validator type
        const examples = generateExamplesForValidatorType('', validatorType, suffix);
        examples.forEach(example => {
          if (!currentPrefix || example.startsWith(currentPrefix)) {
            suggestions.push({ name: example, pattern });
          }
        });
      } else if (pattern.includes('.*')) {
        // Contains wildcard pattern (pre.*post)
        const [prefix, suffix] = pattern.split('.*');
        
        // Generate common field names based on validator type
        const examples = generateExamplesForValidatorType(prefix, validatorType, suffix);
        examples.forEach(example => {
          if (!currentPrefix || example.startsWith(currentPrefix)) {
            suggestions.push({ name: example, pattern });
          }
        });
      }
      
      return suggestions;
    }
    
    /**
     * Generate example field names based on validator type
     */
    function generateExamplesForValidatorType(
      prefix: string = '', 
      validatorType: string, 
      suffix: string = ''
    ): string[] {
      const examples: string[] = [];
      
      switch (validatorType) {
        case 'email address':
          examples.push(
            `${prefix}email${suffix}`,
            `${prefix}userEmail${suffix}`,
            `${prefix}contactEmail${suffix}`,
            `${prefix}primaryEmail${suffix}`
          );
          break;
        
        case 'URL':
          examples.push(
            `${prefix}url${suffix}`,
            `${prefix}website${suffix}`,
            `${prefix}profileUrl${suffix}`,
            `${prefix}homepageUrl${suffix}`
          );
          break;
        
        case 'UUID':
          examples.push(
            `${prefix}id${suffix}`,
            `${prefix}uuid${suffix}`,
            `${prefix}userId${suffix}`,
            `${prefix}recordId${suffix}`
          );
          break;
        
        case 'date':
          examples.push(
            `${prefix}date${suffix}`,
            `${prefix}birthDate${suffix}`,
            `${prefix}createdAt${suffix}`,
            `${prefix}lastModified${suffix}`
          );
          break;
        
        case 'number within range':
          examples.push(
            `${prefix}age${suffix}`,
            `${prefix}score${suffix}`,
            `${prefix}rating${suffix}`,
            `${prefix}percentage${suffix}`
          );
          break;
        
        case 'matches regex pattern':
          examples.push(
            `${prefix}phoneNumber${suffix}`,
            `${prefix}postalCode${suffix}`,
            `${prefix}customFormat${suffix}`
          );
          break;
        
        case 'IP address':
          examples.push(
            `${prefix}ip${suffix}`,
            `${prefix}ipAddress${suffix}`,
            `${prefix}serverIp${suffix}`
          );
          break;
        
        default:
          examples.push(
            `${prefix}value${suffix}`,
            `${prefix}customField${suffix}`
          );
      }
      
      return examples;
    }
    
    /**
     * Add diagnostics for fields that will have special validation
     */
    proxy.getSemanticDiagnostics = (fileName: string) => {
      const original = ls.getSemanticDiagnostics(fileName);
      const diagnostics = [...original];
      
      const program = ls.getProgram();
      if (!program) return original;
      
      const sourceFile = program.getSourceFile(fileName);
      if (!sourceFile) return original;
      
      // Find all interface and type declarations
      typescript.forEachChild(sourceFile, node => {
        let parentTypeName: string | undefined;
        
        if (ts.isInterfaceDeclaration(node) && node.name) {
          parentTypeName = node.name.getText();
        } else if (ts.isTypeAliasDeclaration(node) && node.name) {
          parentTypeName = node.name.getText();
        } else if (ts.isTypeLiteralNode(node)) {
          parentTypeName = 'AnonymousType';
        }
        
        if (parentTypeName) {
          // For each property in the interface/type
          typescript.forEachChild(node, property => {
            if (isPropertyDeclaration(property) && property.name) {
              const fieldName = property.name.getText();
              const validatorInfo = getMatchingValidator(
                fieldName, 
                specialFieldValidators,
                parentTypeName,
                config.contextualValidators
              );
              
              if (validatorInfo.validator) {
                const description = getValidatorDescription(validatorInfo.validator);
                let messageText = `Field "${fieldName}" will be validated as ${description}`;
                
                // Add context info
                if (validatorInfo.source.startsWith('contextual')) {
                  messageText = `${messageText} (from ${validatorInfo.source})`;
                } else if (validatorInfo.source.startsWith('field pattern')) {
                  messageText = `${messageText} (matches ${validatorInfo.pattern})`;
                }
                
                // Add an informational diagnostic
                diagnostics.push({
                  category: typescript.DiagnosticCategory.Message,
                  code: 9000, // Custom code for our plugin
                  source: 'type-compiler',
                  messageText,
                  file: sourceFile,
                  start: property.name.getStart(),
                  length: property.name.getWidth()
                });
              }
            }
          });
        }
      });
      
      return diagnostics;
    };
    
    // Proxy all other methods
    for (const k of Object.keys(ls) as Array<keyof ts.LanguageService>) {
      if (!(k in proxy)) {
        (proxy as any)[k] = function() {
          return (ls as any)[k].apply(ls, arguments);
        };
      }
    }
    
    return proxy;
  }
  
  return { create };
}

export = init; 