import { TypeCompilerOptions, defaultCompilerOptions, WorkerTaskData, WorkerResultData, QueueTask } from '../types';

describe('Types Module', () => {
  test('defaultCompilerOptions should have expected properties', () => {
    // Check that default options are defined
    expect(defaultCompilerOptions).toBeDefined();
    
    // Check specific default options
    expect(defaultCompilerOptions.generateZodSchemas).toBe(false);
    expect(defaultCompilerOptions.strictTypeChecking).toBe(false);
    expect(defaultCompilerOptions.zodSchemaPrefix).toBe('z');
    expect(defaultCompilerOptions.validateClassMethods).toBe(false);
    expect(defaultCompilerOptions.onlyExported).toBe(false);
    
    // Check arrays are initialized empty
    expect(defaultCompilerOptions.includedTypes).toEqual([]);
    expect(defaultCompilerOptions.excludedTypes).toEqual([]);
    expect(defaultCompilerOptions.excludePatterns).toEqual([]);
    
    // Check cache-related settings
    expect(defaultCompilerOptions.useGlobalCache).toBe(true);
    expect(defaultCompilerOptions.maxCacheSize).toBe(10000);
    expect(defaultCompilerOptions.incrementalCompilation).toBe(false);
    
    // Check parallel processing settings
    expect(defaultCompilerOptions.parallelProcessing).toBe(false);
    expect(defaultCompilerOptions.workerBatchSize).toBe(100);
    
    // Check worker count (this is dynamic based on CPU count)
    expect(defaultCompilerOptions.workerCount).toBeGreaterThanOrEqual(1);
  });
  
  test('interface types should be properly defined', () => {
    // Create sample options
    const mockOptions: TypeCompilerOptions = {
      generateZodSchemas: true,
      zodSchemaPrefix: 'z'
    };
    
    // Create a sample WorkerTaskData
    const workerTaskData: WorkerTaskData = {
      taskId: '123',
      typeData: {
        name: 'TestType',
        kind: 'interface',
        flags: 1,
        properties: ['id', 'name']
      },
      options: mockOptions
    };
    
    // Verify the structure
    expect(workerTaskData.taskId).toBe('123');
    expect(workerTaskData.typeData.name).toBe('TestType');
    expect(workerTaskData.typeData.kind).toBe('interface');
    expect(workerTaskData.options).toBe(mockOptions);
    
    // Create a sample WorkerResultData
    const workerResultData: WorkerResultData = {
      success: true,
      result: 'z.object({id: z.number(), name: z.string()})',
      taskId: '123'
    };
    
    // Verify the structure
    expect(workerResultData.success).toBe(true);
    expect(workerResultData.result).toBeDefined();
    expect(workerResultData.taskId).toBe('123');
    
    // Create an error result
    const errorResultData: WorkerResultData = {
      success: false,
      error: 'Failed to process type',
      taskId: '123'
    };
    
    // Verify the structure
    expect(errorResultData.success).toBe(false);
    expect(errorResultData.error).toBeDefined();
    expect(errorResultData.taskId).toBe('123');
  });
}); 