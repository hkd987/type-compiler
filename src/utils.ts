import ts from 'typescript';
import path from 'path';
import { TypeCompilerOptions } from './types';

/**
 * Check if a file should be processed based on excludePatterns
 */
export function shouldProcessFile(fileName: string, excludePatterns: string[] = []): boolean {
  // Skip declaration files
  if (fileName.endsWith('.d.ts')) {
    return false;
  }
  
  // Skip files in node_modules
  if (fileName.includes('node_modules')) {
    return false;
  }
  
  // Skip files matching exclude patterns
  for (const pattern of excludePatterns) {
    if (matchPattern(fileName, pattern)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Match a file path against a glob pattern
 */
function matchPattern(filePath: string, pattern: string): boolean {
  // Handle common glob patterns
  if (pattern === '**/*.test.ts' && filePath.endsWith('.test.ts')) {
    return true;
  }
  
  if (pattern.includes('**/excluded/**') && filePath.includes('/excluded/')) {
    return true;
  }
  
  // Simple implementation for other patterns
  const regex = new RegExp(
    '^' + 
    pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
    + '$'
  );
  
  return regex.test(filePath);
}

/**
 * Check if a declaration is exported
 */
export function isExported(node: ts.Declaration): boolean {
  // Cast to a type that might have modifiers
  const nodeWithModifiers = node as any;
  
  // Check for export keyword in modifiers
  if (nodeWithModifiers.modifiers && 
      Array.isArray(nodeWithModifiers.modifiers) &&
      nodeWithModifiers.modifiers.some(
        (modifier: any) => modifier.kind === ts.SyntaxKind.ExportKeyword
      )) {
    return true;
  }
  
  // Check if parent is an export declaration
  if (node.parent && ts.isExportDeclaration(node.parent)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a type should be processed based on options
 */
export function shouldProcessType(
  declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.ClassDeclaration | ts.EnumDeclaration,
  excludedTypes: string[] = [],
  includedTypes: string[] = []
): boolean {
  if (!declaration.name) {
    return false;
  }
  
  const typeName = declaration.name.text;
  
  // Skip types explicitly excluded
  if (excludedTypes.includes(typeName)) {
    return false;
  }
  
  // Only include specified types if the list is provided
  if (includedTypes.length > 0 && !includedTypes.includes(typeName)) {
    return false;
  }
  
  return true;
}

/**
 * Generate a stable ID for a type by hashing its name and position
 */
export function generateStableTypeId(
  type: ts.Type,
  typeChecker: ts.TypeChecker
): string {
  // Get the display name of the type
  const typeName = typeChecker.typeToString(type);
  
  // If the type has a symbol, get its declaration
  let location = '';
  if (type.symbol && type.symbol.declarations && type.symbol.declarations.length > 0) {
    const declaration = type.symbol.declarations[0];
    const sourceFile = declaration.getSourceFile();
    location = `${sourceFile.fileName}:${declaration.pos}`;
  }
  
  // Combine name and location for a stable ID
  return `${typeName}_${location}`;
} 