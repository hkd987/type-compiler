import ts from 'typescript';
import { globalTypeCache } from './cache';
import { TypeCompilerOptions } from './types';
import { generateStableTypeId } from './utils';
import { getWorkerPool } from './parallel';
import { logger } from './logger';

/**
 * Determines if a special field validator should be applied to a property
 * and returns the appropriate Zod validator expression
 */
function applySpecialFieldValidation(
  propertyName: string, 
  defaultValidator: string,
  options?: TypeCompilerOptions,
  parentTypeName?: string
): string {
  // If no options are provided, return the default
  if (!options) {
    return defaultValidator;
  }
  
  // First, check for contextual validators if parent type name is provided
  if (parentTypeName && options.contextualValidators) {
    // Check for exact parent type match
    if (parentTypeName in options.contextualValidators) {
      const contextValidator = options.contextualValidators[parentTypeName];
      
      // Handle both record and pattern object formats
      if (typeof contextValidator === 'object' && !('pattern' in contextValidator)) {
        // Regular object format with field mappings
        const fieldMap = contextValidator as Record<string, string>;
        if (propertyName in fieldMap) {
          logger.debug(`Applying contextual validator for ${parentTypeName}.${propertyName}: ${fieldMap[propertyName]}`);
          return fieldMap[propertyName];
        }
      } else if (typeof contextValidator === 'object' && 'pattern' in contextValidator && contextValidator.pattern === false) {
        // Object with pattern=false and fields
        const patternObj = contextValidator as { pattern: boolean; fields: Record<string, string> };
        if (propertyName in patternObj.fields) {
          logger.debug(`Applying contextual validator for ${parentTypeName}.${propertyName}: ${patternObj.fields[propertyName]}`);
          return patternObj.fields[propertyName];
        }
      }
    }
    
    // Then check for pattern matches in parent type names
    for (const [pattern, validatorData] of Object.entries(options.contextualValidators)) {
      // Skip if this is a direct match (already handled) or not a pattern
      if (pattern === parentTypeName || 
          typeof validatorData !== 'object' || 
          !('pattern' in validatorData) || 
          !validatorData.pattern) {
        continue;
      }
      
      try {
        // Create a RegExp object from the pattern
        const regex: RegExp = new RegExp(pattern);
        
        // Test if the parent type name matches the pattern
        if (regex.test(parentTypeName)) {
          const patternObj = validatorData as { pattern: boolean; fields: Record<string, string> };
          // If there's a field match in the pattern's fields
          if (propertyName in patternObj.fields) {
            logger.debug(`Applying pattern contextual validator "${pattern}" for ${parentTypeName}.${propertyName}: ${patternObj.fields[propertyName]}`);
            return patternObj.fields[propertyName];
          }
        }
      } catch (error) {
        // Log warning if regex compilation fails
        logger.warn(`Invalid regex pattern in contextualValidators: "${pattern}"`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
  
  // If no contextual validator matched, fall back to special field validators
  if (!options.specialFieldValidators) {
    return defaultValidator;
  }
  
  // First, check for exact name matches
  if (propertyName in options.specialFieldValidators) {
    const specialValidator = options.specialFieldValidators[propertyName];
    
    // Handle both string validator and pattern object
    if (typeof specialValidator === 'string') {
      logger.debug(`Applying special validator for property "${propertyName}": ${specialValidator}`);
      return specialValidator;
    } else if (specialValidator.pattern === false) {
      // This is an object format but without pattern matching
      logger.debug(`Applying special validator for property "${propertyName}": ${specialValidator.validator}`);
      return specialValidator.validator;
    }
  }
  
  // Then, check for pattern matches
  for (const [pattern, validatorData] of Object.entries(options.specialFieldValidators)) {
    // Skip if this is a direct match (already handled) or not a pattern
    if (pattern === propertyName || typeof validatorData === 'string' || !validatorData.pattern) {
      continue;
    }
    
    try {
      // Create a RegExp object from the pattern
      const regex = new RegExp(pattern);
      
      // Test if the property name matches the pattern
      if (regex.test(propertyName)) {
        logger.debug(`Applying pattern validator "${pattern}" for property "${propertyName}": ${validatorData.validator}`);
        return validatorData.validator;
      }
    } catch (error) {
      // Log warning if regex compilation fails
      logger.warn(`Invalid regex pattern in specialFieldValidators: "${pattern}"`, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // No special validator found, return the default
  return defaultValidator;
}

/**
 * Convert a TypeScript type to a Zod schema
 */
export function typeToZodSchema(
  type: ts.Type, 
  typeChecker: ts.TypeChecker,
  program?: ts.Program,
  options?: TypeCompilerOptions
): string {
  logger.trace(`Converting type to Zod schema: ${typeChecker.typeToString(type)}`);
  
  // For demonstration, let's enhance our simplified implementation
  // In a real implementation, we would analyze the properties of the type
  // and apply special validators based on property names
  
  // Check if the type has properties (like an interface or class)
  if (type.getProperties && type.getProperties().length > 0) {
    const properties = type.getProperties();
    const propertySchemas: string[] = [];
    
    // Get the parent type name if available
    let parentTypeName: string | undefined;
    if (type.symbol && type.symbol.name) {
      parentTypeName = type.symbol.name;
    }
    
    // Process each property
    for (const property of properties) {
      const propertyName = property.getName();
      const propertyType = typeChecker.getTypeOfSymbolAtLocation(property, property.valueDeclaration!);
      
      // Start with a basic validator based on the property type
      let baseValidator = 'z.any()';
      
      // In a real implementation, we would analyze the property type here
      // and convert it to the appropriate Zod schema
      
      // Apply any special field validation
      const finalValidator = applySpecialFieldValidation(propertyName, baseValidator, options, parentTypeName);
      
      // Add to property schemas
      propertySchemas.push(`${propertyName}: ${finalValidator}`);
    }
    
    // Return a Zod object schema with the processed properties
    if (propertySchemas.length > 0) {
      return `z.object({\n  ${propertySchemas.join(',\n  ')}\n})`;
    }
  }
  
  // For simplicity, return a basic object schema for other cases
  return `z.object({})`;
}

/**
 * Generate a validator for function parameters
 */
export function generateFunctionParamsValidator(
  node: ts.FunctionDeclaration | ts.MethodDeclaration,
  typeChecker: ts.TypeChecker,
  options?: TypeCompilerOptions
): string {
  const params = node.parameters;
  const paramsObj: { [key: string]: string } = {};
  
  logger.debug(`Generating validator for function parameters: ${node.name?.getText() || 'anonymous'}`);
  
  // Generate schemas for each parameter
  for (const param of params) {
    if (!param.name || !ts.isIdentifier(param.name) || !param.type) {
      logger.trace(`Skipping parameter with no name or type`);
      continue;
    }
    
    const paramName = param.name.text;
    const paramType = typeChecker.getTypeFromTypeNode(param.type);
    
    logger.trace(`Processing parameter: ${paramName}`);
    const paramSchema = typeToZodSchema(paramType, typeChecker);
    paramsObj[paramName] = paramSchema;
  }
  
  // Create a validator function
  return `z.object({
    ${Object.entries(paramsObj).map(([name, schema]) => `${name}: ${schema}`).join(',\n    ')}
  })`;
}

/**
 * Generate validators for class methods
 */
export function generateClassValidators(
  node: ts.ClassDeclaration,
  typeChecker: ts.TypeChecker,
  zodSchemaPrefix: string = 'z',
  options?: TypeCompilerOptions
): ts.Statement[] {
  const validators: ts.Statement[] = [];
  
  if (!node.name) {
    logger.warn(`Skipping class validation for class with no name`);
    return validators;
  }
  
  const className = node.name.text;
  logger.debug(`Generating validators for class: ${className}`);
  
  // Find methods that should be validated
  for (const member of node.members) {
    if (!ts.isMethodDeclaration(member)) {
      continue;
    }
    
    if (!member.name || !ts.isIdentifier(member.name)) {
      logger.trace(`Skipping method with no name`);
      continue;
    }
    
    const methodName = member.name.text;
    
    // Skip methods that don't need validation
    if (
      methodName === 'constructor' ||
      member.parameters.length === 0
    ) {
      logger.trace(`Skipping method: ${methodName} (constructor or no parameters)`);
      continue;
    }
    
    logger.trace(`Generating validator for method: ${className}.${methodName}`);
    
    // Generate validator for this method
    const schema = generateFunctionParamsValidator(member, typeChecker, options);
    
    // Create a variable statement for the validator
    const validatorName = `${zodSchemaPrefix}${className}${methodName}Params`;
    const statement = ts.factory.createVariableStatement(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      ts.factory.createVariableDeclarationList(
        [ts.factory.createVariableDeclaration(
          validatorName,
          undefined,
          undefined,
          ts.factory.createIdentifier(schema)
        )],
        ts.NodeFlags.Const
      )
    );
    
    validators.push(statement);
  }
  
  logger.debug(`Generated ${validators.length} validators for class ${className}`);
  return validators;
}

/**
 * Process a type with a worker thread
 */
export function processTypeWithWorker(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  options?: TypeCompilerOptions,
  workerPool?: any
): string {
  try {
    // Start timer for performance logging
    const endTimer = logger.startTimer(`Process type: ${typeChecker.typeToString(type)}`);
    
    if (!workerPool) {
      // Fallback to synchronous processing
      logger.debug(`No worker pool available, processing type synchronously`);
      const result = typeToZodSchema(type, typeChecker);
      endTimer(); // End the timer
      return result;
    }
    
    logger.debug(`Processing type with worker pool: ${typeChecker.typeToString(type)}`);
    
    // In a real implementation, we would:
    // 1. Serialize the type information into a plain object
    // 2. Send to a worker thread via workerPool.processType
    // 3. Wait for the result
    
    // For this demo, we'll use a placeholder
    const result = 'z.lazy(() => z.object({}))';
    
    // Update metrics
    logger.incrementMetric('workerTasksProcessed');
    
    endTimer(); // End the timer
    return result;
  } catch (error) {
    logger.error('Error processing type with worker', { 
      error: error instanceof Error ? error.message : String(error),
      type: typeChecker.typeToString(type)
    });
    // Fallback to synchronous processing
    return typeToZodSchema(type, typeChecker);
  }
} 