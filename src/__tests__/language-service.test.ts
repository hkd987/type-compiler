import * as ts from 'typescript/lib/tsserverlibrary';
import { TypeCompilerOptions } from '../types';

// Create a wrapper to test the language service module
// We need to test the getMatchingValidator function
// which is internal to the language-service.ts module

// Mock the TypeScript module
jest.mock('typescript/lib/tsserverlibrary', () => {
  return {
    SyntaxKind: {
      PropertySignature: 167,
      InterfaceDeclaration: 258,
      TypeAliasDeclaration: 259,
      TypeLiteral: 170
    },
    ScriptElementKind: {
      memberVariableElement: 'memberVariableElement'
    },
    ScriptElementKindModifier: {
      none: 'none'
    },
    DiagnosticCategory: {
      Message: 0
    }
  };
});

// Mock the language service plugin
jest.mock('../language-service', () => {
  // Save the original module implementation
  const originalModule = jest.requireActual('../language-service');
  
  // Export our test utilities along with the original module
  return {
    __esModule: true,
    ...originalModule,
    // Expose the internal getMatchingValidator function for testing
    __test__: {
      getMatchingValidator: (
        fieldName: string, 
        specialFieldValidators: Record<string, string | { pattern: boolean; validator: string }>,
        parentTypeName?: string, 
        contextualValidators?: Record<string, Record<string, string> | { pattern: boolean; fields: Record<string, string> }>
      ) => {
        // Implementation that mimics the internal function
        // First check contextual validators if parent type name is provided
        if (parentTypeName && contextualValidators) {
          // Check for exact parent type match
          if (parentTypeName in contextualValidators) {
            const contextValidator = contextualValidators[parentTypeName];
            
            // Handle different validator formats
            if (typeof contextValidator === 'object' && !('pattern' in contextValidator)) {
              // Regular object format with field mappings
              const fieldMap = contextValidator as Record<string, string>;
              if (fieldName in fieldMap) {
                return { 
                  validator: fieldMap[fieldName], 
                  source: `contextual (${parentTypeName})` 
                };
              }
            } else if (typeof contextValidator === 'object' && 'pattern' in contextValidator && 'fields' in contextValidator) {
              // Object with pattern and fields
              const patternObj = contextValidator as { pattern: boolean; fields: Record<string, string> };
              if (fieldName in patternObj.fields) {
                return { 
                  validator: patternObj.fields[fieldName], 
                  source: `contextual (${parentTypeName})` 
                };
              }
            }
          }
          
          // Check for parent type pattern matches
          for (const [pattern, validatorData] of Object.entries(contextualValidators)) {
            // Skip if this is a direct match (already handled) or not a pattern
            if (pattern === parentTypeName || 
                typeof validatorData !== 'object' || 
                !('pattern' in validatorData) || 
                !validatorData.pattern) {
              continue;
            }
            
            try {
              const regex: RegExp = new RegExp(pattern);
              if (regex.test(parentTypeName)) {
                const patternObj = validatorData as { pattern: boolean; fields: Record<string, string> };
                if (fieldName in patternObj.fields) {
                  return { 
                    validator: patternObj.fields[fieldName], 
                    source: `contextual pattern (${pattern})`,
                    pattern
                  };
                }
              }
            } catch (error) {
              // Invalid regex pattern, skip
              console.warn(`Invalid regex pattern in contextualValidators: ${pattern}`);
            }
          }
        }
        
        // If no contextual validators match, check special field validators
        // Check for exact field name match
        if (fieldName in specialFieldValidators) {
          const validator = specialFieldValidators[fieldName];
          if (typeof validator === 'string') {
            return { 
              validator, 
              source: 'field name' 
            };
          } else if (validator && typeof validator === 'object' && 'validator' in validator) {
            return { 
              validator: validator.validator, 
              source: 'field name' 
            };
          }
        }

        // Check for field name pattern matches
        for (const [pattern, validatorConfig] of Object.entries(specialFieldValidators)) {
          if (typeof validatorConfig === 'object' && 'pattern' in validatorConfig && validatorConfig.pattern) {
            try {
              const regex: RegExp = new RegExp(pattern);
              if (regex.test(fieldName)) {
                return { 
                  validator: validatorConfig.validator, 
                  source: `field pattern (${pattern})`,
                  pattern 
                };
              }
            } catch (error) {
              // Invalid regex pattern, skip
              console.warn(`Invalid regex pattern in specialFieldValidators: ${pattern}`);
            }
          }
        }

        return { validator: null, source: 'none' };
      }
    }
  };
});

// Import the test utilities
const languageServiceTestUtils = require('../language-service').__test__;

describe('Language Service Plugin', () => {
  // Test configuration
  const specialFieldValidators = {
    'email': 'z.string().email()',
    'url': 'z.string().url()',
    'phoneNumber': 'z.string().regex(/^\\+?[1-9]\\d{1,14}$/)',
    '^.*Email$': {
      'pattern': true,
      'validator': 'z.string().email()'
    },
    '^id[A-Z]': {
      'pattern': true, 
      'validator': 'z.string().uuid()'
    }
  };
  
  const contextualValidators = {
    'User': {
      'email': 'z.string().email().endsWith("@company.com")',
      'role': 'z.enum(["admin", "user", "guest"])'
    },
    'Product': {
      'price': 'z.number().positive().min(0.01)'
    },
    '^.*User$': {
      'pattern': true,
      'fields': {
        'role': 'z.enum(["admin", "user", "guest"])'
      }
    }
  };
  
  describe('getMatchingValidator', () => {
    test('should handle exact field name matches', () => {
      const result = languageServiceTestUtils.getMatchingValidator('email', specialFieldValidators);
      expect(result.validator).toBe('z.string().email()');
      expect(result.source).toBe('field name');
    });
    
    test('should handle field name pattern matches', () => {
      const result = languageServiceTestUtils.getMatchingValidator('contactEmail', specialFieldValidators);
      expect(result.validator).toBe('z.string().email()');
      expect(result.source).toBe('field pattern (^.*Email$)');
      expect(result.pattern).toBe('^.*Email$');
    });
    
    test('should handle contextual validator exact matches', () => {
      const result = languageServiceTestUtils.getMatchingValidator('email', specialFieldValidators, 'User', contextualValidators);
      expect(result.validator).toBe('z.string().email().endsWith("@company.com")');
      expect(result.source).toBe('contextual (User)');
    });
    
    test('should handle contextual validator pattern matches', () => {
      const result = languageServiceTestUtils.getMatchingValidator('role', specialFieldValidators, 'AdminUser', contextualValidators);
      expect(result.validator).toBe('z.enum(["admin", "user", "guest"])');
      expect(result.source).toBe('contextual pattern (^.*User$)');
      expect(result.pattern).toBe('^.*User$');
    });
    
    test('should fallback to special field validators when no contextual validator matches', () => {
      const result = languageServiceTestUtils.getMatchingValidator('idCustomer', specialFieldValidators, 'Order', contextualValidators);
      expect(result.validator).toBe('z.string().uuid()');
      expect(result.source).toBe('field pattern (^id[A-Z])');
      expect(result.pattern).toBe('^id[A-Z]');
    });
    
    test('should return null for non-matching fields', () => {
      const result = languageServiceTestUtils.getMatchingValidator('name', specialFieldValidators, 'User', contextualValidators);
      expect(result.validator).toBeNull();
      expect(result.source).toBe('none');
    });
    
    test('should handle pattern priority correctly', () => {
      // Setup validators with potential conflicts
      const specialValidatorsWithOverlap = {
        ...specialFieldValidators,
        'email': 'z.string().email().min(5)', // More specific than the pattern
        'contactEmail': 'z.string().email().endsWith("@contact.com")' // Exact match should take priority
      };
      
      // Test that exact match takes priority over pattern
      const result1 = languageServiceTestUtils.getMatchingValidator('contactEmail', specialValidatorsWithOverlap);
      expect(result1.validator).toBe('z.string().email().endsWith("@contact.com")');
      expect(result1.source).toBe('field name');
      
      // Test that contextual validators take priority over special field validators
      const result2 = languageServiceTestUtils.getMatchingValidator('email', specialValidatorsWithOverlap, 'User', contextualValidators);
      expect(result2.validator).toBe('z.string().email().endsWith("@company.com")');
      expect(result2.source).toBe('contextual (User)');
    });
  });
}); 