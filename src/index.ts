import ts from 'typescript';
import path from 'path';
import type { TypeCompilerOptions } from './types';
import { createZodTransformer, createTypeCompilerPlugin } from './transformers';
import { logger, Logger, LogLevel, getLogger } from './logger';

/**
 * Create a TypeScript compiler plugin
 */
export function typeCompilerPlugin(program: ts.Program, options: TypeCompilerOptions = {}) {
  // Configure the logger from the options
  logger.configureFromOptions(options);
  
  // Log plugin initialization
  logger.info('Initializing type-compiler plugin', {
    generateZodSchemas: options.generateZodSchemas,
    parallelProcessing: options.parallelProcessing
  });
  
  const transformerFactory = createZodTransformer(program, options);
  
  // Log completion
  logger.debug('Transformer factory created');
  
  return {
    before: [
      (program: ts.Program) => {
        logger.debug('Running transformer');
        return transformerFactory(program);
      }
    ],
  };
}

/**
 * Create a TypeScript compiler plugin with Zod schema generation
 */
export function zodSchemaPlugin(program: ts.Program, options: TypeCompilerOptions = {}) {
  return typeCompilerPlugin(program, {
    ...options,
    generateZodSchemas: true,
  });
}

// Export main API
export { createTypeCompilerPlugin } from './transformers';
export { typeToZodSchema } from './type-processor';
export * from './types';
export * from './cache';
export * from './parallel';
export * from './utils';
export { logger, Logger, LogLevel, getLogger } from './logger';

// Default export for backward compatibility
export default typeCompilerPlugin; 