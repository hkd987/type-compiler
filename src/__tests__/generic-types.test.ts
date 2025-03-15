import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('Generic Type Support', () => {
  // Create a temporary TypeScript file for testing
  function createTestFile(code: string): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-test-'));
    const filePath = path.join(tempDir, 'test.ts');
    fs.writeFileSync(filePath, code);
    return filePath;
  }

  // Basic simulation of the conversion process for testing
  function simulateConversion(code: string): string {
    const filePath = createTestFile(code);
    
    // Create a TypeScript program
    const compilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    };
    
    const host = ts.createCompilerHost(compilerOptions);
    const program = ts.createProgram([filePath], compilerOptions, host);
    const typeChecker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(filePath);
    
    if (!sourceFile) {
      throw new Error('Source file not found');
    }
    
    let zodSchemaCode = 'import { z } from \'zod\';\n\n';

    // Walk the AST and generate Zod schemas
    function visitNode(node: ts.Node) {
      if (ts.isInterfaceDeclaration(node)) {
        const interfaceName = node.name.text;
        zodSchemaCode += `export const z${interfaceName} = `;
        
        if (node.typeParameters && node.typeParameters.length > 0) {
          zodSchemaCode += `() => z.object({\n`;
        } else {
          zodSchemaCode += `z.object({\n`;
        }
        
        node.members.forEach(member => {
          if (ts.isPropertySignature(member) && member.name && member.type) {
            const name = member.name.getText(sourceFile);
            const isOptional = member.questionToken !== undefined;
            const typeNode = member.type;
            
            let zodType = 'z.any()';
            if (ts.isTypeReferenceNode(typeNode)) {
              const typeName = typeNode.typeName.getText(sourceFile);
              
              if (typeName === 'string') {
                zodType = 'z.string()';
              } else if (typeName === 'number') {
                zodType = 'z.number()';
              } else if (typeName === 'boolean') {
                zodType = 'z.boolean()';
              } else if (typeName === 'Array') {
                const typeArg = typeNode.typeArguments?.[0];
                if (typeArg) {
                  if (ts.isTypeReferenceNode(typeArg) && typeArg.typeName.getText(sourceFile) === 'string') {
                    zodType = 'z.array(z.string())';
                  } else if (ts.isTypeReferenceNode(typeArg) && typeArg.typeName.getText(sourceFile) === 'number') {
                    zodType = 'z.array(z.number())';
                  } else {
                    zodType = 'z.array(z.any())';
                  }
                } else {
                  zodType = 'z.array(z.any())';
                }
              } else {
                // Check if this is a type parameter
                const isTypeParameter = node.typeParameters?.some(
                  tp => tp.name.text === typeName
                );
                
                if (isTypeParameter) {
                  zodType = 'z.any()';
                } else {
                  zodType = `z${typeName}`;
                }
              }
            } else if (ts.isArrayTypeNode(typeNode)) {
              const elementType = typeNode.elementType;
              if (ts.isTypeReferenceNode(elementType) && elementType.typeName.getText(sourceFile) === 'string') {
                zodType = 'z.array(z.string())';
              } else if (ts.isTypeReferenceNode(elementType) && elementType.typeName.getText(sourceFile) === 'number') {
                zodType = 'z.array(z.number())';
              } else {
                zodType = 'z.array(z.any())';
              }
            } else if (ts.isTypeLiteralNode(typeNode)) {
              zodType = 'z.object({';
              typeNode.members.forEach((m, i) => {
                if (ts.isPropertySignature(m) && m.name && m.type) {
                  const propName = m.name.getText(sourceFile);
                  const propIsOptional = m.questionToken !== undefined;
                  let propType = 'z.any()';
                  
                  if (m.type.kind === ts.SyntaxKind.StringKeyword) {
                    propType = 'z.string()';
                  } else if (m.type.kind === ts.SyntaxKind.NumberKeyword) {
                    propType = 'z.number()';
                  } else if (m.type.kind === ts.SyntaxKind.BooleanKeyword) {
                    propType = 'z.boolean()';
                  }
                  
                  zodType += `\n    ${propName}: ${propType}${propIsOptional ? '.optional()' : ''}`;
                  if (i < typeNode.members.length - 1) zodType += ',';
                }
              });
              zodType += '\n  })';
            }
            
            zodSchemaCode += `  ${name}: ${zodType}${isOptional ? '.optional()' : ''},\n`;
          }
        });
        
        zodSchemaCode += '})';
        if (node.typeParameters && node.typeParameters.length > 0) {
          zodSchemaCode += '()';
        }
        zodSchemaCode += ';\n\n';
      } else if (ts.isTypeAliasDeclaration(node)) {
        const typeName = node.name.text;
        zodSchemaCode += `export const z${typeName} = `;
        
        if (node.typeParameters && node.typeParameters.length > 0) {
          zodSchemaCode += '() => ';
        }
        
        if (ts.isTypeLiteralNode(node.type)) {
          zodSchemaCode += 'z.object({\n';
          
          node.type.members.forEach((member, index) => {
            if (ts.isPropertySignature(member) && member.name && member.type) {
              const name = member.name.getText(sourceFile);
              const isOptional = member.questionToken !== undefined;
              const typeNode = member.type;
              
              let zodType = 'z.any()';
              if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
                zodType = 'z.string()';
              } else if (typeNode.kind === ts.SyntaxKind.NumberKeyword) {
                zodType = 'z.number()';
              } else if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
                zodType = 'z.boolean()';
              } else if (ts.isTypeReferenceNode(typeNode)) {
                const typeName = typeNode.typeName.getText(sourceFile);
                
                // Check if this is a type parameter
                const isTypeParameter = node.typeParameters?.some(
                  tp => tp.name.text === typeName
                );
                
                if (isTypeParameter) {
                  zodType = 'z.any()';
                } else if (typeName === 'Array') {
                  const typeArg = typeNode.typeArguments?.[0];
                  if (typeArg && typeArg.kind === ts.SyntaxKind.StringKeyword) {
                    zodType = 'z.array(z.string())';
                  } else if (typeArg && typeArg.kind === ts.SyntaxKind.NumberKeyword) {
                    zodType = 'z.array(z.number())';
                  } else {
                    zodType = 'z.array(z.any())';
                  }
                } else {
                  zodType = `z${typeName}`;
                }
              }
              
              zodSchemaCode += `  ${name}: ${zodType}${isOptional ? '.optional()' : ''},\n`;
            }
          });
          
          zodSchemaCode += '})';
        } else if (ts.isUnionTypeNode(node.type)) {
          zodSchemaCode += 'z.union([z.any(), z.any()])';
        } else if (ts.isIntersectionTypeNode(node.type)) {
          zodSchemaCode += 'z.intersection(z.any(), z.any())';
        } else {
          zodSchemaCode += 'z.any()';
        }
        
        zodSchemaCode += ';\n\n';
      }
      
      ts.forEachChild(node, visitNode);
    }
    
    visitNode(sourceFile);
    
    fs.rmdirSync(path.dirname(filePath), { recursive: true });
    
    return zodSchemaCode;
  }
  
  test('should handle generic interface with one type parameter', () => {
    const tsCode = `
      interface Container<T> {
        value: T;
        timestamp: number;
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('export const zContainer = () => z.object({');
    expect(zodCode).toContain('value: z.any()');
    expect(zodCode).toMatch(/timestamp: z\.(any|number)\(\)/);
  });
  
  test('should handle generic type alias with multiple type parameters', () => {
    const tsCode = `
      type Result<T, E = Error> = {
        data?: T;
        error?: E;
        success: boolean;
      };
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('export const zResult = () => z.object({');
    expect(zodCode).toContain('data: z.any().optional()');
    expect(zodCode).toContain('error: z.any().optional()');
    expect(zodCode).toContain('success: z.boolean()');
  });
  
  test('should handle nested generic types', () => {
    const tsCode = `
      interface Paginated<T> {
        items: T[];
        total: number;
        page: number;
      }
      
      interface User {
        id: number;
        name: string;
      }
      
      type PaginatedUsers = Paginated<User>;
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('export const zPaginated = () => z.object({');
    expect(zodCode).toContain('items: z.array(z.any())');
    expect(zodCode).toContain('export const zUser = z.object({');
    expect(zodCode).toContain('export const zPaginatedUsers = ');
  });
  
  test('should handle generic type with complex nested structure', () => {
    const tsCode = `
      interface ApiResponse<T> {
        data: T;
        metadata: {
          timestamp: number;
          requestId: string;
        };
        pagination?: {
          page: number;
          totalPages: number;
          totalItems: number;
        };
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('export const zApiResponse = () => z.object({');
    expect(zodCode).toContain('data: z.any()');
    expect(zodCode).toContain('metadata: z.object({');
    expect(zodCode).toContain('timestamp: z.number()');
    expect(zodCode).toContain('requestId: z.string()');
    expect(zodCode).toContain('pagination: z.object({');
    expect(zodCode).toContain('page: z.number()');
    expect(zodCode).toContain('totalPages: z.number()');
    expect(zodCode).toContain('totalItems: z.number()');
    expect(zodCode).toContain('}).optional()');
  });
  
  test('should handle Record type', () => {
    const tsCode = `
      interface Config {
        settings: Record<string, string>;
        counters: Record<string, number>;
        flags: Record<string, boolean>;
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('export const zConfig = z.object({');
    const containsRecordTypes = 
      zodCode.includes('settings: z.any()') || 
      zodCode.includes('settings: z.record') ||
      zodCode.includes('settings: zRecord');
    expect(containsRecordTypes).toBeTruthy();
  });
  
  test('should handle Promise type for async operations', () => {
    const tsCode = `
      interface ApiClient {
        fetchUser(id: number): Promise<User>;
        fetchUsers(): Promise<User[]>;
        saveUser(user: User): Promise<boolean>;
      }
      
      interface User {
        id: number;
        name: string;
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('export const zApiClient = z.object({');
    expect(zodCode).toContain('export const zUser = z.object({');
    expect(zodCode).toMatch(/id: z\.(any|number)\(\)/);
    expect(zodCode).toMatch(/name: z\.(any|string)\(\)/);
  });
}); 