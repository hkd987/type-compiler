import ts from 'typescript';
import { TypeCompilerOptions } from './types';
import { typeToZodSchema } from './type-processor';
import { shouldProcessFile, shouldProcessType, isExported } from './utils';
import { getWorkerPool } from './parallel';
import { logger } from './logger';

/**
 * Create a transformer for generating Zod schemas
 */
export function createZodTransformer(program: ts.Program, options: TypeCompilerOptions): any {
  const typeChecker = program.getTypeChecker();
  
  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile): ts.SourceFile => {
      // Skip declaration files, node_modules, test files, etc.
      if (!shouldProcessFile(sourceFile.fileName, options.excludePatterns || [])) {
        logger.debug(`Skipping file: ${sourceFile.fileName}`);
        return sourceFile;
      }

      logger.info(`Processing file: ${sourceFile.fileName}`);
      const zodDeclarations: ts.Statement[] = [];
      const workerPool = options.parallelProcessing ? getWorkerPool(options) : null;

      if (options.parallelProcessing) {
        logger.info('Parallel processing is enabled, but operating synchronously for now.');
      }

      // First pass: collect all type nodes to process
      const typeNodes: Array<{ declaration: ts.Declaration; exportedName: string }> = [];
      
      const visitor = (node: ts.Node): ts.Node => {
        // Only process type declarations
        if (
          ts.isInterfaceDeclaration(node) ||
          ts.isTypeAliasDeclaration(node) ||
          ts.isEnumDeclaration(node) ||
          ts.isClassDeclaration(node)
        ) {
          // Check if we should process this type based on options
          if (!node.name) return node;
          
          const typeName = node.name.text;
          const shouldProcess = shouldProcessType(node, options.excludedTypes || []);
          
          // Skip types that shouldn't be processed
          if (!shouldProcess) {
            logger.trace(`Skipping type: ${typeName}`);
            return node;
          }
          
          // Only export types that were also exported in the source
          const isTypeExported = isExported(node);
          const exportedName = isTypeExported ? typeName : `_${typeName}`;
          
          logger.debug(`Found type to process: ${typeName}${isTypeExported ? ' (exported)' : ''}`);
          
          // Add to the list of types to process
          typeNodes.push({ declaration: node, exportedName });
        }
        
        return ts.visitEachChild(node, visitor, context);
      };
      
      // Run the visitor to collect type nodes
      const visitedSourceFile = ts.visitNode(sourceFile, visitor) as ts.SourceFile;
      
      // Second pass: generate Zod schemas for each type
      logger.debug(`Processing ${typeNodes.length} types in ${sourceFile.fileName}`);
      const startTime = Date.now();
      
      for (const { declaration, exportedName } of typeNodes) {
        try {
          // Get the full type symbol and name
          const type = typeChecker.getTypeAtLocation(declaration);
          if (!type) {
            logger.warn(`Could not get type for ${exportedName}`);
            continue;
          }
          
          // Check if we should use worker pool
          const zodSchema = typeToZodSchema(type, typeChecker, program, options);
          
          if (!zodSchema) {
            logger.warn(`Could not generate schema for ${exportedName}`);
            continue;
          }
          
          logger.trace(`Generated schema for ${exportedName}`);
          
          // Create the export statement for the Zod schema
          const factory = context.factory;
          
          const zodVarName = `${exportedName}Schema`;
          
          // Handle export modifiers for different declaration types
          let exportModifiers: ts.Modifier[] | undefined = undefined;
          
          if (ts.isInterfaceDeclaration(declaration) || 
              ts.isTypeAliasDeclaration(declaration) ||
              ts.isClassDeclaration(declaration) ||
              ts.isEnumDeclaration(declaration)) {
            
            if (declaration.modifiers && declaration.modifiers.some(
              mod => mod.kind === ts.SyntaxKind.ExportKeyword
            )) {
              exportModifiers = [factory.createModifier(ts.SyntaxKind.ExportKeyword)];
            }
          }
          
          const zodDeclaration = factory.createVariableStatement(
            exportModifiers,
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  zodVarName,
                  undefined,
                  undefined,
                  factory.createIdentifier(zodSchema)
                ),
              ],
              ts.NodeFlags.Const
            )
          );
          
          zodDeclarations.push(zodDeclaration);
          
          // Update metrics
          logger.incrementMetric('typesProcessed');
        } catch (error) {
          logger.error(`Error generating schema for ${declaration.getText()}`, { 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Log processing time
      const duration = Date.now() - startTime;
      logger.debug(`Generated ${zodDeclarations.length} schemas in ${duration}ms`);
      
      // If no Zod declarations were generated, return the original source file
      if (zodDeclarations.length === 0) {
        logger.debug(`No schemas generated for ${sourceFile.fileName}`);
        return sourceFile;
      }
      
      // Add Zod import if needed
      const skipZodImport = !!options.skipZodImport;
      const updatedStatements = [
        ...(skipZodImport ? [] : [createZodImport(context)]),
        ...visitedSourceFile.statements,
        ...zodDeclarations,
      ];
      
      logger.incrementMetric('filesProcessed');
      
      return context.factory.updateSourceFile(
        sourceFile,
        updatedStatements,
        visitedSourceFile.isDeclarationFile,
        visitedSourceFile.referencedFiles,
        visitedSourceFile.typeReferenceDirectives,
        visitedSourceFile.hasNoDefaultLib,
        visitedSourceFile.libReferenceDirectives
      );
    };
  };
}

function createZodImport(context: ts.TransformationContext): ts.Statement {
  const factory = context.factory;
  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(
          false,
          undefined,
          factory.createIdentifier('z')
        ),
      ])
    ),
    factory.createStringLiteral('zod'),
    undefined
  );
}

/**
 * Creates TypeScript transformer factories for the TypeCompiler plugin
 */
export function createTypeCompilerPlugin(options: TypeCompilerOptions = {}): any[] {
  return options.generateZodSchemas
    ? [(program: ts.Program) => createZodTransformer(program, options)]
    : [];
} 