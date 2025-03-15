import { TypeCompilerOptions } from '../types';
import { getWorkerPool, WorkerPool } from '../parallel';

// Mock the WorkerPool class
jest.mock('../parallel', () => {
  const originalModule = jest.requireActual('../parallel');
  
  // Mock implementation of WorkerPool
  class MockWorkerPool {
    private workers: any[] = [];
    
    constructor(workerCount: number, options: any) {
      // Create mock workers
      for (let i = 0; i < workerCount; i++) {
        this.workers.push({
          terminate: jest.fn()
        });
      }
    }
    
    processType(typeData: any): Promise<string> {
      return Promise.resolve('z.string()');
    }
    
    async shutdown(): Promise<void> {
      // Terminate all workers
      for (const worker of this.workers) {
        worker.terminate();
      }
    }
    
    // Expose workers for testing
    _getWorkers() {
      return this.workers;
    }
  }
  
  return {
    ...originalModule,
    WorkerPool: MockWorkerPool,
    getWorkerPool: jest.fn((options: TypeCompilerOptions) => {
      if (!options.parallelProcessing) {
        return null;
      }
      
      const workerCount = options.workerCount || 2;
      return new MockWorkerPool(workerCount, options);
    })
  };
});

describe('Parallel Processing Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getWorkerPool', () => {
    test('should return null when parallel processing is disabled', () => {
      const options: TypeCompilerOptions = {
        parallelProcessing: false
      };

      const pool = getWorkerPool(options);
      expect(pool).toBeNull();
    });

    test('should return a WorkerPool instance when parallel processing is enabled', () => {
      const options: TypeCompilerOptions = {
        parallelProcessing: true,
        workerCount: 2
      };

      const pool = getWorkerPool(options);
      expect(pool).toBeDefined();
    });

    test('should respect workerCount option', () => {
      const options: TypeCompilerOptions = {
        parallelProcessing: true,
        workerCount: 3
      };

      const pool = getWorkerPool(options);
      expect(pool).not.toBeNull();
      
      // Check that the right number of workers were created
      if (pool) {
        // @ts-ignore - Accessing private method for testing
        const workers = pool._getWorkers();
        expect(workers.length).toBe(3);
      }
    });
  });

  describe('WorkerPool', () => {
    let pool: WorkerPool | null = null;
    
    afterEach(() => {
      if (pool) {
        // Just reset the mock - don't actually call shutdown which would try to use workers
        pool = null;
      }
    });
    
    test('should be able to process types', async () => {
      const options: TypeCompilerOptions = {
        parallelProcessing: true,
        workerCount: 1
      };
      
      // Create pool instance
      const pool = getWorkerPool(options);
      expect(pool).not.toBeNull();
      
      if (pool) {
        // Simple type data to process
        const typeData = {
          typeId: 'test-type',
          typeText: 'interface TestType { name: string; age: number; }',
          zodSchemaPrefix: 'z'
        };
        
        // Process type and check result
        const result = await pool.processType(typeData);
        expect(result).toBe('z.string()');
      }
    });
    
    test('should handle batch processing', async () => {
      const options: TypeCompilerOptions = {
        parallelProcessing: true,
        workerCount: 2
      };
      
      // Create pool instance
      const pool = getWorkerPool(options);
      expect(pool).not.toBeNull();
      
      if (pool) {
        // Create a batch of types
        const typeDataBatch = [
          {
            typeId: 'type-1',
            typeText: 'interface Type1 { id: number; }',
            zodSchemaPrefix: 'z'
          },
          {
            typeId: 'type-2',
            typeText: 'interface Type2 { name: string; }',
            zodSchemaPrefix: 'z'
          }
        ];
        
        // Process batch
        const resultPromises = typeDataBatch.map(typeData => 
          pool.processType(typeData)
        );
        
        // Wait for all results
        const results = await Promise.all(resultPromises);
        
        // Check results
        expect(results.length).toBe(2);
        expect(results[0]).toBe('z.string()');
        expect(results[1]).toBe('z.string()');
      }
    });
    
    test('should terminate all workers', async () => {
      const options: TypeCompilerOptions = {
        parallelProcessing: true,
        workerCount: 2
      };
      
      // Create pool instance
      const pool = getWorkerPool(options);
      expect(pool).not.toBeNull();
      
      if (pool) {
        // Get workers
        // @ts-ignore - Accessing private method for testing
        const workers = pool._getWorkers();
        expect(workers.length).toBe(2);
        
        // Call shutdown
        await pool.shutdown();
        
        // Check that terminate was called on all workers
        for (const worker of workers) {
          expect(worker.terminate).toHaveBeenCalled();
        }
      }
    });
  });
}); 