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
  
  test('should apply pattern-based validators for fields ending with a pattern', () => {
    // Create a type with properties that end with 'Email'
    const mockType = createMockTypeWithProperties([
      { name: 'userEmail', type: 'string' },
      { name: 'contactEmail', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'username', type: 'string' } // Doesn't end with 'Email'
    ]);
    
    // Configure options with a pattern-based validator for fields ending with 'Email'
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        '^.*Email$': { pattern: true, validator: 'z.string().email()' }
      }
    };
    
    // Generate schema with these options
    const schema = typeToZodSchema(mockType, mockTypeChecker, undefined, options);
    
    // Fields ending with 'Email' should use the email validator
    expect(schema).toContain('userEmail: z.string().email()');
    expect(schema).toContain('contactEmail: z.string().email()');
    // Regular fields should use default validators
    expect(schema).toContain('email: z.any()'); // exact match 'email' doesn't match pattern '^.*Email$'
    expect(schema).toContain('username: z.any()');
  });
  
  test('should apply pattern-based validators for fields starting with a pattern', () => {
    // Create a type with properties that start with 'id'
    const mockType = createMockTypeWithProperties([
      { name: 'id', type: 'string' },
      { name: 'idNumber', type: 'string' },
      { name: 'userId', type: 'string' }, // Doesn't start with 'id'
      { name: 'name', type: 'string' }
    ]);
    
    // Configure options with a pattern-based validator for fields starting with 'id'
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        '^id': { pattern: true, validator: 'z.string().uuid()' }
      }
    };
    
    // Generate schema with these options
    const schema = typeToZodSchema(mockType, mockTypeChecker, undefined, options);
    
    // Fields starting with 'id' should use the UUID validator
    expect(schema).toContain('id: z.string().uuid()');
    expect(schema).toContain('idNumber: z.string().uuid()');
    // Other fields should use default validators
    expect(schema).toContain('userId: z.any()');
    expect(schema).toContain('name: z.any()');
  });
  
  test('should apply pattern-based validators with more complex patterns', () => {
    // Create a type with various properties
    const mockType = createMockTypeWithProperties([
      { name: 'latitude', type: 'number' },
      { name: 'longitude', type: 'number' },
      { name: 'lat', type: 'number' },
      { name: 'long', type: 'number' },
      { name: 'userLatitude', type: 'number' },
      { name: 'locationLongitude', type: 'number' }
    ]);
    
    // Configure options with complex pattern-based validators
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        // Match 'latitude' or anything ending with 'Latitude'
        '(^latitude$|Latitude$)': { 
          pattern: true, 
          validator: 'z.number().min(-90).max(90)' 
        },
        // Match 'longitude' or anything ending with 'Longitude'
        '(^longitude$|Longitude$)': { 
          pattern: true, 
          validator: 'z.number().min(-180).max(180)' 
        },
        // Match 'lat' exactly but not as part of other words
        '^lat$': { 
          pattern: true, 
          validator: 'z.number().min(-90).max(90)' 
        }
      }
    };
    
    // Generate schema with these options
    const schema = typeToZodSchema(mockType, mockTypeChecker, undefined, options);
    
    // Fields matching patterns should use the special validators
    expect(schema).toContain('latitude: z.number().min(-90).max(90)');
    expect(schema).toContain('userLatitude: z.number().min(-90).max(90)');
    expect(schema).toContain('longitude: z.number().min(-180).max(180)');
    expect(schema).toContain('locationLongitude: z.number().min(-180).max(180)');
    expect(schema).toContain('lat: z.number().min(-90).max(90)');
    // 'long' should use default validator as it doesn't match '^long$'
    expect(schema).toContain('long: z.any()');
  });
  
  test('should prioritize exact matches over pattern matches', () => {
    // Create a type with properties that could match multiple patterns
    const mockType = createMockTypeWithProperties([
      { name: 'email', type: 'string' },
      { name: 'contactEmail', type: 'string' }
    ]);
    
    // Configure options with both exact and pattern-based validators
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        // Exact match for 'email'
        'email': 'z.string().email().min(5)',
        // Pattern match for anything ending with 'Email'
        '^.*Email$': { pattern: true, validator: 'z.string().email()' }
      }
    };
    
    // Generate schema with these options
    const schema = typeToZodSchema(mockType, mockTypeChecker, undefined, options);
    
    // Exact match should be prioritized for 'email'
    expect(schema).toContain('email: z.string().email().min(5)');
    // Pattern match should be used for 'contactEmail'
    expect(schema).toContain('contactEmail: z.string().email()');
  });
  
  test('should handle invalid regex patterns gracefully', () => {
    // Create a mock console.warn to spy on warnings
    const originalWarn = console.warn;
    console.warn = jest.fn();
    
    // Create a type with properties
    const mockType = createMockTypeWithProperties([
      { name: 'email', type: 'string' }
    ]);
    
    // Configure options with an invalid regex pattern
    const options: TypeCompilerOptions = {
      specialFieldValidators: {
        '[': { pattern: true, validator: 'z.string().email()' } // Invalid regex
      }
    };
    
    // Generate schema with these options
    const schema = typeToZodSchema(mockType, mockTypeChecker, undefined, options);
    
    // Should fall back to default validator and log a warning
    expect(schema).toContain('email: z.any()');
    
    // Restore original console.warn
    console.warn = originalWarn;
  });
}); 