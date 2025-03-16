import * as ts from 'typescript/lib/tsserverlibrary';
import { TypeCompilerOptions } from './types';

/**
 * Check if a field name matches any pattern in the specialFieldValidators
 */
function getMatchingValidator(
  fieldName: string,
  specialFieldValidators: Record<string, string | { pattern: boolean; validator: string }>
): string | null {
  // First check for exact matches
  if (specialFieldValidators[fieldName]) {
    const validator = specialFieldValidators[fieldName];
    if (typeof validator === 'string') {
      return validator;
    } else if (validator.validator) {
      return validator.validator;
    }
  }

  // Then check for pattern matches
  for (const [pattern, validatorConfig] of Object.entries(specialFieldValidators)) {
    if (typeof validatorConfig === 'object' && validatorConfig.pattern) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(fieldName)) {
          return validatorConfig.validator;
        }
      } catch (error) {
        // Invalid regex pattern, skip
        console.warn(`Invalid regex pattern in specialFieldValidators: ${pattern}`);
      }
    }
  }

  return null;
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
        const validator = getMatchingValidator(fieldName, specialFieldValidators);
        
        if (validator) {
          const description = getValidatorDescription(validator);
          
          // Add validation info to the hover text
          const newDisplayParts = [...(original.displayParts || [])];
          newDisplayParts.push(
            { text: '\n\n', kind: 'lineBreak' },
            { text: '(type-compiler)', kind: 'label' },
            { text: ' ', kind: 'space' },
            { text: `Will be validated as ${description}`, kind: 'text' },
            { text: '\n', kind: 'lineBreak' },
            { text: validator, kind: 'text' }
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
        
        // Extract validation patterns (just exact matches for now)
        Object.keys(specialFieldValidators).forEach(fieldName => {
          if (typeof fieldName === 'string' && !fieldName.startsWith('^') && !fieldName.includes('(')) {
            const validator = specialFieldValidators[fieldName];
            const validatorStr = typeof validator === 'string' ? validator : validator.validator;
            const description = getValidatorDescription(validatorStr);
            
            completions.push({
              name: fieldName,
              kind: typescript.ScriptElementKind.memberVariableElement,
              kindModifiers: typescript.ScriptElementKindModifier.none,
              sortText: '0-' + fieldName, // Sort at the top
              insertText: fieldName,
              isSnippet: true,
              labelDetails: {
                description: `Field with ${description} validation`
              }
            });
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
        if (
          node.kind === ts.SyntaxKind.InterfaceDeclaration || 
          node.kind === ts.SyntaxKind.TypeAliasDeclaration
        ) {
          // For each property in the interface/type
          typescript.forEachChild(node, property => {
            if (isPropertyDeclaration(property) && property.name) {
              const fieldName = property.name.getText();
              const validator = getMatchingValidator(fieldName, specialFieldValidators);
              
              if (validator) {
                const description = getValidatorDescription(validator);
                
                // Add an informational diagnostic
                diagnostics.push({
                  category: typescript.DiagnosticCategory.Message,
                  code: 9000, // Custom code for our plugin
                  source: 'type-compiler',
                  messageText: `Field "${fieldName}" will be validated as ${description}`,
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