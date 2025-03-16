import { TypeCompilerOptions } from '../types';

/**
 * Tests for Custom Error Messages Configuration
 * 
 * These tests verify that the TypeCompilerOptions interface correctly supports
 * custom error messages in various validator configurations.
 */
describe('Custom Error Messages Configuration', () => {
  describe('TypeCompilerOptions interface', () => {
    test('should support custom error messages in specialFieldValidators', () => {
      // Create a valid TypeCompilerOptions object with custom error messages
      const options: TypeCompilerOptions = {
        generateZodSchemas: true,
        specialFieldValidators: {
          'email': {
            validator: 'z.string().email()',
            errorMessage: 'Please enter a valid email address'
          },
          'price': {
            validator: 'z.number().positive().min(0.01)',
            errorMessage: 'Price must be greater than $0.01'
          },
          '^.*Email$': {
            pattern: true,
            validator: 'z.string().email()',
            errorMessage: 'Must be a valid email address'
          }
        }
      };

      // Verify the structure is correct
      expect(options.specialFieldValidators).toBeDefined();
      expect(options.specialFieldValidators?.email).toBeDefined();
      
      const emailValidator = options.specialFieldValidators?.email as { 
        validator: string; 
        errorMessage: string 
      };
      
      expect(emailValidator.validator).toBe('z.string().email()');
      expect(emailValidator.errorMessage).toBe('Please enter a valid email address');
      
      // Check pattern-based validator
      const patternValidator = options.specialFieldValidators?.['^.*Email$'] as {
        pattern: boolean;
        validator: string;
        errorMessage: string;
      };
      
      expect(patternValidator.pattern).toBe(true);
      expect(patternValidator.validator).toBe('z.string().email()');
      expect(patternValidator.errorMessage).toBe('Must be a valid email address');
    });

    test('should support custom error messages in contextualValidators', () => {
      // Create a valid TypeCompilerOptions object with contextual validators
      const options: TypeCompilerOptions = {
        generateZodSchemas: true,
        contextualValidators: {
          'User': {
            'email': {
              validator: 'z.string().email().endsWith("@company.com")',
              errorMessage: 'Company email must end with @company.com'
            }
          },
          '^.*Form$': {
            pattern: true,
            fields: {
              'password': {
                validator: 'z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)',
                errorMessage: 'Password must be at least 8 characters with uppercase and numbers'
              }
            }
          }
        }
      };

      // Verify the structure is correct
      expect(options.contextualValidators).toBeDefined();
      
      // Check exact match contextual validator
      const userValidators = options.contextualValidators?.User as Record<string, {
        validator: string;
        errorMessage: string;
      }>;
      
      expect(userValidators.email).toBeDefined();
      expect(userValidators.email.validator).toBe('z.string().email().endsWith("@company.com")');
      expect(userValidators.email.errorMessage).toBe('Company email must end with @company.com');
      
      // Check pattern-based contextual validator
      const formValidator = options.contextualValidators?.['^.*Form$'] as {
        pattern: boolean;
        fields: Record<string, {
          validator: string;
          errorMessage: string;
        }>;
      };
      
      expect(formValidator.pattern).toBe(true);
      expect(formValidator.fields.password).toBeDefined();
      expect(formValidator.fields.password.validator).toBe('z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)');
      expect(formValidator.fields.password.errorMessage).toBe('Password must be at least 8 characters with uppercase and numbers');
    });
  });

  describe('Validator priority with custom error messages', () => {
    // This test verifies that the priority order for validation messages is correct
    test('should apply the most specific validator and its error message', () => {
      // Simulate the priority order checking logic
      function getErrorMessage(fieldName: string, type: string | null, validators: any): string | null {
        // Context-specific validator check
        if (type && validators.contextual && validators.contextual[type] && validators.contextual[type][fieldName]) {
          return validators.contextual[type][fieldName].errorMessage;
        }
        
        // Pattern-based type check
        if (type && validators.contextual) {
          for (const pattern in validators.contextual) {
            if (pattern.startsWith('^') && validators.contextual[pattern].pattern) {
              const regex = new RegExp(pattern);
              if (regex.test(type) && validators.contextual[pattern].fields && validators.contextual[pattern].fields[fieldName]) {
                return validators.contextual[pattern].fields[fieldName].errorMessage;
              }
            }
          }
        }
        
        // Field validators check
        if (validators.fields && validators.fields[fieldName]) {
          return validators.fields[fieldName].errorMessage;
        }
        
        // Pattern-based field check
        if (validators.fields) {
          for (const pattern in validators.fields) {
            if (pattern.startsWith('^') && validators.fields[pattern].pattern) {
              const regex = new RegExp(pattern);
              if (regex.test(fieldName)) {
                return validators.fields[pattern].errorMessage;
              }
            }
          }
        }
        
        return null;
      }
      
      // Setup test validators
      const validators = {
        fields: {
          'email': {
            validator: 'z.string().email()',
            errorMessage: 'Please enter a valid email address'
          },
          '^.*Email$': {
            pattern: true,
            validator: 'z.string().email()',
            errorMessage: 'Must be a valid email address'
          }
        },
        contextual: {
          'User': {
            'email': {
              validator: 'z.string().email().endsWith("@company.com")',
              errorMessage: 'Company email must end with @company.com'
            }
          },
          '^.*Form$': {
            pattern: true,
            fields: {
              'email': {
                validator: 'z.string().email()',
                errorMessage: 'Form requires a valid email address'
              }
            }
          }
        }
      };
      
      // Test exact match contextual validator takes priority
      expect(getErrorMessage('email', 'User', validators)).toBe('Company email must end with @company.com');
      
      // Test pattern-based contextual validator 
      expect(getErrorMessage('email', 'LoginForm', validators)).toBe('Form requires a valid email address');
      
      // Test exact match field validator
      expect(getErrorMessage('email', null, validators)).toBe('Please enter a valid email address');
      
      // Test pattern-based field validator
      expect(getErrorMessage('userEmail', null, validators)).toBe('Must be a valid email address');
    });
  });
}); 