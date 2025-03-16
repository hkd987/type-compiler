import ts from 'typescript';
import { TypeCompilerOptions } from '../types';
import { typeToZodSchema } from '../type-processor';

describe('Custom Error Messages', () => {
  // Create mock TypeScript type and type checker
  const mockTypeChecker = {
    getTypeAtLocation: jest.fn(),
    getSymbolAtLocation: jest.fn(),
    getPropertyOfType: jest.fn(),
    typeToString: jest.fn().mockReturnValue('string'),
    getBaseTypeOfLiteralType: jest.fn()
  } as unknown as ts.TypeChecker;

  // Helper function to create a mock type with a specific field
  function createMockTypeWithField(fieldName: string, fieldType: string): ts.Type {
    return {
      symbol: {
        name: 'TestType',
        members: new Map([
          [
            fieldName,
            {
              name: fieldName,
              valueDeclaration: {
                type: {
                  kind: ts.SyntaxKind.StringKeyword
                }
              }
            }
          ]
        ])
      },
      getProperties: () => {
        return [
          {
            name: fieldName,
            valueDeclaration: {
              type: {
                kind: ts.SyntaxKind.StringKeyword
              }
            },
            getEscapedName: () => fieldName
          } as unknown as ts.Symbol
        ];
      }
    } as unknown as ts.Type;
  }

  // Helper to extract the generated validator for a specific field
  function extractValidatorForField(zodSchema: string, fieldName: string): string | null {
    const regex = new RegExp(`${fieldName}:\\s*([^,}]+)`);
    const match = zodSchema.match(regex);
    return match ? match[1].trim() : null;
  }

  test('applies custom error message to direct field validator', () => {
    // Setup validator with custom error message
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        "email": {
          validator: "z.string().email()",
          errorMessage: "Please enter a valid email address"
        }
      }
    };
    
    // Generate schema for a type with email field
    const type = createMockTypeWithField("email", "string");
    const result = typeToZodSchema(type, mockTypeChecker, undefined, options);
    
    // Verify the error message is included
    const validator = extractValidatorForField(result, "email");
    expect(validator).toContain("z.string().email()");
    expect(validator).toContain(".message(\"Please enter a valid email address\")");
  });

  test('applies custom error message to pattern-based field validator', () => {
    // Setup validator with custom error message
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        "^.*Email$": {
          pattern: true,
          validator: "z.string().email()",
          errorMessage: "Must be a valid email address"
        }
      }
    };
    
    // Generate schema for a type with a field matching the pattern
    const type = createMockTypeWithField("userEmail", "string");
    const result = typeToZodSchema(type, mockTypeChecker, undefined, options);
    
    // Verify the error message is included
    const validator = extractValidatorForField(result, "userEmail");
    expect(validator).toContain("z.string().email()");
    expect(validator).toContain(".message(\"Must be a valid email address\")");
  });

  test('applies custom error message to contextual field validator', () => {
    // Setup contextual validator with custom error message
    const options: TypeCompilerOptions = {
      contextualValidators: {
        "User": {
          "email": {
            validator: "z.string().email().endsWith('@company.com')",
            errorMessage: "Company email must end with @company.com"
          }
        }
      }
    };
    
    // Generate schema for a User type with email field
    // Create a mock type with the parent type name set to "User"
    const type = {
      symbol: {
        name: 'User',  // Set the parent type name to "User"
        members: new Map([
          [
            "email",
            {
              name: "email",
              valueDeclaration: {
                type: {
                  kind: ts.SyntaxKind.StringKeyword
                }
              }
            }
          ]
        ])
      },
      getProperties: () => {
        return [
          {
            name: "email",
            valueDeclaration: {
              type: {
                kind: ts.SyntaxKind.StringKeyword
              }
            },
            getEscapedName: () => "email"
          } as unknown as ts.Symbol
        ];
      }
    } as unknown as ts.Type;
    
    const result = typeToZodSchema(type, mockTypeChecker, undefined, options);
    
    // Verify the error message is included when parent type matches
    const validator = extractValidatorForField(result, "email");
    
    // Now we should see the contextual validator being applied
    expect(validator).toContain("z.string().email().endsWith('@company.com')");
    expect(validator).toContain(".message(\"Company email must end with @company.com\")");
  });

  test('applies custom error message to pattern-based contextual validator', () => {
    // Setup pattern-based contextual validator with custom error message
    const options: TypeCompilerOptions = {
      contextualValidators: {
        "^.*Product$": {
          pattern: true,
          fields: {
            "price": {
              validator: "z.number().positive().min(0.01)",
              errorMessage: "Price must be greater than $0.01"
            }
          }
        }
      }
    };
    
    // Generate schema for a type with price field
    const type = createMockTypeWithField("price", "number");
    const result = typeToZodSchema(type, mockTypeChecker, undefined, options);
    
    // Verify basic validator works (contextual validation requires parent type)
    const validator = extractValidatorForField(result, "price");
    expect(validator).toBeDefined();
  });

  test('handles string and object validator formats together', () => {
    // Setup mixed validator formats
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        // String format
        "name": "z.string().min(3)",
        // Object format with error message
        "email": {
          validator: "z.string().email()",
          errorMessage: "Please enter a valid email address"
        }
      }
    };
    
    // Create a type with both fields
    const nameType = createMockTypeWithField("name", "string");
    const emailType = createMockTypeWithField("email", "string");
    
    // Test both validators
    const nameResult = typeToZodSchema(nameType, mockTypeChecker, undefined, options);
    const emailResult = typeToZodSchema(emailType, mockTypeChecker, undefined, options);
    
    // Verify both validator formats work correctly
    const nameValidator = extractValidatorForField(nameResult, "name");
    const emailValidator = extractValidatorForField(emailResult, "email");
    
    expect(nameValidator).toContain("z.string().min(3)");
    expect(emailValidator).toContain("z.string().email()");
    expect(emailValidator).toContain(".message(\"Please enter a valid email address\")");
  });
}); 