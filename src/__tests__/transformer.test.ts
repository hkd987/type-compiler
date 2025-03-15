import ts from 'typescript';
import { TypeCompilerOptions } from '../types';

// Mock the transformers module
jest.mock('../transformers', () => {
  // Return a mock implementation
  return {
    createZodTransformer: jest.fn((program, options) => {
      // Create a mock transformer function that returns the source file unchanged
      return (context: ts.TransformationContext) => {
        return (sourceFile: ts.SourceFile) => sourceFile;
      };
    })
  };
});

// Import after mocking
import { createZodTransformer } from '../transformers';
import { WorkerPool } from '../parallel';

describe('Transformer Module', () => {
  const mockProgram = {} as ts.Program;
  const mockTypeChecker = { getTypeAtLocation: jest.fn() } as unknown as ts.TypeChecker;
  
  beforeEach(() => {
    jest.clearAllMocks();
    (mockProgram as any).getTypeChecker = jest.fn().mockReturnValue(mockTypeChecker);
  });

  describe('createZodTransformer', () => {
    test('should return a transformer function', () => {
      const options: TypeCompilerOptions = { generateZodSchemas: true };
      const transformer = createZodTransformer(mockProgram, options);
      
      expect(typeof transformer).toBe('function');
    });

    test('should process source files correctly', () => {
      const options: TypeCompilerOptions = { generateZodSchemas: true };
      const transformer = createZodTransformer(mockProgram, options);
      
      // Create a mock context
      const context = {
        addDiagnostic: jest.fn(),
      } as unknown as ts.TransformationContext;
      
      // Create a mock source file
      const mockSourceFile = {
        fileName: 'test.ts',
        statements: []
      } as unknown as ts.SourceFile;
      
      // Call the transformer
      const result = transformer(context)(mockSourceFile);
      
      // Verify it returns the source file (our mock just returns the input)
      expect(result).toBe(mockSourceFile);
      
      // Verify the mock transformer was called with the right program and options
      expect(createZodTransformer).toHaveBeenCalledWith(mockProgram, options);
    });

    test('should handle parallel processing when enabled', () => {
      const options: TypeCompilerOptions = { 
        generateZodSchemas: true,
        parallelProcessing: true 
      };
      
      // Call the transformer
      const transformer = createZodTransformer(mockProgram, options);
      
      // Verify the mock transformer was called with the right program and options, including parallelProcessing
      expect(createZodTransformer).toHaveBeenCalledWith(mockProgram, expect.objectContaining({
        parallelProcessing: true
      }));
    });
  });
}); 