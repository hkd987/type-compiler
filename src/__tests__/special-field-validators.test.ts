import ts from 'typescript';
import { typeToZodSchema } from '../type-processor';
import { TypeCompilerOptions } from '../types';

// Mock TypeScript's typeChecker
const mockTypeChecker = {
  typeToString: jest.fn().mockReturnValue('TestType'),
  getTypeOfSymbolAtLocation: jest.fn().mockReturnValue({}),
} as unknown as ts.TypeChecker;

// Helper function to create a mock type with properties
function createMockTypeWithProperties(properties: { name: string; type?: any }[]): ts.Type {
  return {
    getProperties: () => properties.map(prop => ({
      getName: () => prop.name,
      valueDeclaration: {} as ts.Declaration
    })),
    flags: ts.TypeFlags.Object
  } as unknown as ts.Type;
}

describe('Special Field Validators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should apply special validators for email fields', () => {
    // Create a type with an email property
    const mockType = createMockTypeWithProperties([
      { name: 'id', type: 'number' },
      { name: 'email', type: 'string' },
      { name: 'name', type: 'string' }
    ]);
    
    // Configure options with a special validator for email fields
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        'email': 'z.string().email()'
      }
    };
    
    // Generate schema with these options
    const schema = typeToZodSchema(mockType, mockTypeChecker, undefined, options);
    
    // Check that the email field uses the special validator
    expect(schema).toContain('email: z.string().email()');
    // Other fields should use default validators
    expect(schema).toContain('id: z.any()');
    expect(schema).toContain('name: z.any()');
  });
  
  test('should apply multiple special validators', () => {
    // Create a type with multiple properties
    const mockType = createMockTypeWithProperties([
      { name: 'id', type: 'number' },
      { name: 'email', type: 'string' },
      { name: 'birthDate', type: 'Date' },
      { name: 'zipCode', type: 'string' },
      { name: 'isActive', type: 'boolean' }
    ]);
    
    // Configure options with multiple special validators
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        'email': 'z.string().email()',
        'birthDate': 'z.date()',
        'zipCode': 'z.string().regex(/^\\d{5}(-\\d{4})?$/)',
        'isActive': 'z.boolean()'
      }
    };
    
    // Generate schema with these options
    const schema = typeToZodSchema(mockType, mockTypeChecker, undefined, options);
    
    // Check that all special validators are applied
    expect(schema).toContain('email: z.string().email()');
    expect(schema).toContain('birthDate: z.date()');
    expect(schema).toContain('zipCode: z.string().regex(/^\\d{5}(-\\d{4})?$/)');
    expect(schema).toContain('isActive: z.boolean()');
    // Regular field should use default validator
    expect(schema).toContain('id: z.any()');
  });
  
  test('should handle case when no special validators are defined', () => {
    // Create a type with standard properties
    const mockType = createMockTypeWithProperties([
      { name: 'id', type: 'number' },
      { name: 'email', type: 'string' }
    ]);
    
    // Options without special validators
    const options: TypeCompilerOptions = {};
    
    // Generate schema with these options
    const schema = typeToZodSchema(mockType, mockTypeChecker, undefined, options);
    
    // All fields should use default validators
    expect(schema).toContain('id: z.any()');
    expect(schema).toContain('email: z.any()');
  });
  
  test('should not apply special validators for non-matching field names', () => {
    // Create a type with various properties
    const mockType = createMockTypeWithProperties([
      { name: 'id', type: 'number' },
      { name: 'userEmail', type: 'string' }, // Not exactly 'email'
      { name: 'contactInfo', type: 'object' }
    ]);
    
    // Configure options with a special validator for email fields
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        'email': 'z.string().email()'
      }
    };
    
    // Generate schema with these options
    const schema = typeToZodSchema(mockType, mockTypeChecker, undefined, options);
    
    // No field should use the email validator since there's no exact match
    expect(schema).not.toContain('z.string().email()');
    expect(schema).toContain('userEmail: z.any()');
  });
}); 