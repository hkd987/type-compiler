/**
 * Benchmark demonstration for parallel processing in type-compiler
 * 
 * This file helps you understand the performance improvements possible with
 * parallel processing by simulating different type conversion scenarios.
 * 
 * To run this example:
 * 1. Compile with: tsc --project tsconfig.json examples/parallel-benchmark.ts
 * 2. Run with: node examples/parallel-benchmark.js
 */

// ------------------------------------------------------------------------
// Configuration (modify these to test different scenarios)
// ------------------------------------------------------------------------
const CONFIG = {
  // Total number of types to process
  typeCount: 1000,
  
  // Complexity factor (higher means more complex types)
  complexity: 3,
  
  // Number of worker threads to simulate
  workerThreads: Math.max(1, require('os').cpus().length - 1),
  
  // Batch size for parallel processing
  batchSize: 50,
  
  // Whether to output detailed logs
  verbose: false
};

// ------------------------------------------------------------------------
// Type definitions for the benchmark
// ------------------------------------------------------------------------

// Simple function to generate a mock type definition with varying complexity
function generateMockType(id: number, complexity: number): TypeDefinition {
  const properties: TypeProperty[] = [];
  const nestedTypes: TypeDefinition[] = [];
  
  // Add basic properties
  properties.push({ name: 'id', type: 'string' });
  properties.push({ name: 'name', type: 'string' });
  properties.push({ name: 'createdAt', type: 'Date' });
  
  // Add additional properties based on complexity
  for (let i = 0; i < complexity * 3; i++) {
    properties.push({
      name: `property${i}`,
      type: ['string', 'number', 'boolean', 'Date'][i % 4]
    });
  }
  
  // Add nested types based on complexity
  for (let i = 0; i < complexity; i++) {
    // Prevent infinite recursion by limiting depth
    if (complexity > 1) {
      const nestedType = generateMockType(id * 100 + i, complexity - 1);
      nestedTypes.push(nestedType);
      
      // Reference the nested type
      properties.push({
        name: `nested${i}`,
        type: nestedType.name
      });
    }
  }
  
  // Add array types
  properties.push({
    name: 'tags',
    type: 'string[]'
  });
  
  // Add optional properties
  properties.push({
    name: 'description',
    type: 'string',
    optional: true
  });
  
  return {
    id,
    name: `Type${id}`,
    properties,
    nestedTypes
  };
}

// Type definitions for the benchmark
interface TypeProperty {
  name: string;
  type: string;
  optional?: boolean;
}

interface TypeDefinition {
  id: number;
  name: string;
  properties: TypeProperty[];
  nestedTypes: TypeDefinition[];
}

// ------------------------------------------------------------------------
// Simulated processing functions
// ------------------------------------------------------------------------

// Simulate sequential processing of types
function processTypesSequentially(types: TypeDefinition[]): string[] {
  console.log(`Processing ${types.length} types sequentially...`);
  const startTime = Date.now();
  
  const results: string[] = [];
  for (const type of types) {
    // Simulate processing time based on complexity
    const processingTime = simulateProcessingTime(type);
    const schema = simulateTypeToZodSchema(type);
    results.push(schema);
    
    if (CONFIG.verbose) {
      console.log(`Processed ${type.name} in ${processingTime}ms`);
    }
  }
  
  const endTime = Date.now();
  console.log(`Sequential processing completed in ${endTime - startTime}ms`);
  return results;
}

// Simulate parallel processing of types
function processTypesInParallel(types: TypeDefinition[]): string[] {
  console.log(`Processing ${types.length} types in parallel with ${CONFIG.workerThreads} workers...`);
  const startTime = Date.now();
  
  // Split types into batches
  const batches: TypeDefinition[][] = [];
  for (let i = 0; i < types.length; i += CONFIG.batchSize) {
    batches.push(types.slice(i, i + CONFIG.batchSize));
  }
  
  console.log(`Split into ${batches.length} batches of up to ${CONFIG.batchSize} types each`);
  
  // Simulate processing batches across worker threads
  const results: string[] = [];
  let completedBatches = 0;
  
  // Process batches in parallel (simulated)
  const processBatchesInParallel = () => {
    // Distribute batches across worker threads
    const workerBatches: TypeDefinition[][] = [];
    for (let i = 0; i < CONFIG.workerThreads; i++) {
      workerBatches.push([]);
    }
    
    // Assign batches to workers in a round-robin fashion
    for (let i = 0; i < batches.length; i++) {
      workerBatches[i % CONFIG.workerThreads].push(...batches[i]);
    }
    
    // Process each worker's batches
    for (let workerId = 0; workerId < CONFIG.workerThreads; workerId++) {
      const workerTypes = workerBatches[workerId];
      
      if (workerTypes.length === 0) continue;
      
      if (CONFIG.verbose) {
        console.log(`Worker ${workerId} processing ${workerTypes.length} types...`);
      }
      
      // Simulate worker processing its batch
      for (const type of workerTypes) {
        const processingTime = simulateProcessingTime(type);
        const schema = simulateTypeToZodSchema(type);
        results.push(schema);
        
        if (CONFIG.verbose) {
          console.log(`Worker ${workerId} processed ${type.name} in ${processingTime}ms`);
        }
      }
      
      completedBatches++;
      
      if (CONFIG.verbose) {
        console.log(`Worker ${workerId} completed batch`);
      }
    }
  };
  
  // Simulate parallel execution
  processBatchesInParallel();
  
  const endTime = Date.now();
  console.log(`Parallel processing completed in ${endTime - startTime}ms`);
  return results;
}

// Helper to simulate processing time for a type (based on its complexity)
function simulateProcessingTime(type: TypeDefinition): number {
  // Base processing time
  let time = 5;
  
  // Add time for each property
  time += type.properties.length * 2;
  
  // Add time for nested types
  for (const nestedType of type.nestedTypes) {
    time += simulateProcessingTime(nestedType) / 2; // Reduced impact for nested types
  }
  
  // Add some random variation (±20%)
  const variation = 0.8 + Math.random() * 0.4;
  time *= variation;
  
  // Simulate the processing delay
  const start = Date.now();
  while (Date.now() - start < time) {
    // Busy wait to simulate CPU-intensive work
    // In a real scenario, this would be actual type processing
  }
  
  return time;
}

// Simulate converting a type to a Zod schema
function simulateTypeToZodSchema(type: TypeDefinition): string {
  let schema = `export const z${type.name} = z.object({\n`;
  
  for (const prop of type.properties) {
    let propSchema = `  ${prop.name}: `;
    
    // Handle different property types
    if (prop.type.endsWith('[]')) {
      const baseType = prop.type.slice(0, -2);
      propSchema += `z.array(z.${baseType.toLowerCase() || 'any'}())`;
    } else if (prop.type.includes('|')) {
      // Union type
      const types = prop.type.split('|').map(t => t.trim());
      propSchema += `z.union([${types.map(t => `z.${t.toLowerCase() || 'any'}()`).join(', ')}])`;
    } else if (type.nestedTypes.some(nt => nt.name === prop.type)) {
      // Reference to a nested type
      propSchema += `z${prop.type}`;
    } else {
      // Basic type
      propSchema += `z.${prop.type.toLowerCase() || 'any'}()`;
    }
    
    // Handle optional properties
    if (prop.optional) {
      propSchema += '.optional()';
    }
    
    schema += `${propSchema},\n`;
  }
  
  schema += '});\n';
  
  // Include schemas for nested types
  for (const nestedType of type.nestedTypes) {
    schema = simulateTypeToZodSchema(nestedType) + '\n' + schema;
  }
  
  return schema;
}

// ------------------------------------------------------------------------
// Benchmark execution
// ------------------------------------------------------------------------

function runBenchmark() {
  console.log('===========================================================');
  console.log('Parallel Processing Benchmark');
  console.log('===========================================================');
  console.log('');
  console.log(`Configuration:`);
  console.log(`- Types to process: ${CONFIG.typeCount}`);
  console.log(`- Complexity factor: ${CONFIG.complexity}`);
  console.log(`- Worker threads: ${CONFIG.workerThreads}`);
  console.log(`- Batch size: ${CONFIG.batchSize}`);
  console.log('');
  
  // Generate test types
  console.log('Generating test types...');
  const types: TypeDefinition[] = [];
  for (let i = 1; i <= CONFIG.typeCount; i++) {
    types.push(generateMockType(i, CONFIG.complexity));
  }
  console.log(`Generated ${types.length} types with complexity factor ${CONFIG.complexity}`);
  console.log('');
  
  // Run sequential benchmark
  console.log('SEQUENTIAL PROCESSING');
  console.log('---------------------');
  const sequentialStart = Date.now();
  const sequentialResults = processTypesSequentially(types);
  const sequentialTime = Date.now() - sequentialStart;
  console.log(`Sequential processing total time: ${sequentialTime}ms`);
  console.log(`Types processed per second: ${Math.floor(types.length / (sequentialTime / 1000))}`);
  console.log('');
  
  // Run parallel benchmark
  console.log('PARALLEL PROCESSING');
  console.log('-------------------');
  const parallelStart = Date.now();
  const parallelResults = processTypesInParallel(types);
  const parallelTime = Date.now() - parallelStart;
  console.log(`Parallel processing total time: ${parallelTime}ms`);
  console.log(`Types processed per second: ${Math.floor(types.length / (parallelTime / 1000))}`);
  console.log('');
  
  // Compare results
  console.log('PERFORMANCE COMPARISON');
  console.log('---------------------');
  const speedup = sequentialTime / parallelTime;
  const efficiency = speedup / CONFIG.workerThreads;
  console.log(`Speedup: ${speedup.toFixed(2)}x faster with parallel processing`);
  console.log(`Efficiency: ${(efficiency * 100).toFixed(2)}% (ideal is 100%)`);
  console.log(`Time saved: ${sequentialTime - parallelTime}ms (${((1 - parallelTime / sequentialTime) * 100).toFixed(2)}%)`);
  
  // Verify results
  const resultsMatch = sequentialResults.length === parallelResults.length;
  console.log(`Results validation: ${resultsMatch ? '✅ Same number of schemas generated' : '❌ Different number of schemas'}`);
  
  console.log('');
  console.log('RECOMMENDATIONS');
  console.log('---------------');
  if (speedup < 1.2) {
    console.log('❗ The performance benefit of parallel processing is minimal for your current configuration.');
    console.log('   Consider using sequential processing instead, as the overhead may not be worth it.');
    console.log('   Try increasing the complexity or number of types to see better benefits.');
  } else if (speedup > 1.2 && speedup < CONFIG.workerThreads * 0.5) {
    console.log('✅ Parallel processing provides a notable speedup, but not optimal efficiency.');
    console.log('   Consider adjusting batch size or reducing worker count for better resource utilization.');
  } else {
    console.log('✅ Parallel processing provides significant performance benefits for your configuration!');
    console.log('   The current settings are well-optimized for your workload.');
  }
  
  console.log('');
  console.log('===========================================================');
}

// Run the benchmark
runBenchmark(); 