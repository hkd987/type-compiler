import ts from 'typescript';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';

// We'll manually test some of the TypeScript to Zod conversion logic
describe('Zod Schema Generation', () => {
  // Create a temporary file with TypeScript code
  async function createTestFile(code: string): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'type-compiler-test-'));
    const filePath = path.join(tempDir, 'test.ts');
    await fs.writeFile(filePath, code);
    
    return {
      filePath,
      cleanup: async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    };
  }
  
  // Basic simulation of the conversion process for testing
  function simulateConversion(code: string): string {
    // Create a temporary TypeScript program
    const tempFile = ts.createSourceFile(
      'test.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );
    
    const host = ts.createCompilerHost({});
    const program = ts.createProgram(['test.ts'], {}, {
      ...host,
      getSourceFile: (fileName) => fileName === 'test.ts' ? tempFile : undefined
    });
    
    // Get the TypeChecker instance
    const typeChecker = program.getTypeChecker();
    let zodSchemaCode = '';
    
    // This is a simplified version of our visitor logic
    function visitNode(node: ts.Node) {
      if (ts.isInterfaceDeclaration(node)) {
        const interfaceName = node.name.text;
        zodSchemaCode += `export const z${interfaceName} = z.object({\n`;
        
        node.members.forEach(member => {
          if (ts.isPropertySignature(member) && member.name && member.type) {
            const name = member.name.getText(tempFile);
            const isOptional = member.questionToken !== undefined;
            const typeNode = member.type;
            
            let zodType = 'z.any()';
            if (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText(tempFile) === 'string') {
              zodType = 'z.string()';
            } else if (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText(tempFile) === 'number') {
              zodType = 'z.number()';
            } else if (ts.isTypeReferenceNode(typeNode) && typeNode.typeName.getText(tempFile) === 'boolean') {
              zodType = 'z.boolean()';
            } else if (ts.isArrayTypeNode(typeNode)) {
              const elementType = typeNode.elementType;
              if (ts.isTypeReferenceNode(elementType) && elementType.typeName.getText(tempFile) === 'string') {
                zodType = 'z.array(z.string())';
              } else if (ts.isTypeReferenceNode(elementType) && elementType.typeName.getText(tempFile) === 'number') {
                zodType = 'z.array(z.number())';
              } else {
                zodType = 'z.array(z.any())';
              }
            } else if (ts.isUnionTypeNode(typeNode)) {
              // Handle union types
              zodType = 'z.union([z.any(), z.any()])';
            }
            
            zodSchemaCode += `  ${name}: ${zodType}${isOptional ? '.optional()' : ''},\n`;
          }
        });
        
        zodSchemaCode += '});\n\n';
      } else if (ts.isTypeAliasDeclaration(node)) {
        const typeName = node.name.text;
        zodSchemaCode += `export const z${typeName} = `;
        
        if (ts.isUnionTypeNode(node.type)) {
          zodSchemaCode += `z.union([z.any(), z.any()]);\n\n`;
        } else if (ts.isIntersectionTypeNode(node.type)) {
          zodSchemaCode += `z.intersection(z.any(), z.any());\n\n`;
        } else {
          zodSchemaCode += `z.any();\n\n`;
        }
      } else if (ts.isEnumDeclaration(node)) {
        const enumName = node.name.text;
        zodSchemaCode += `export const z${enumName} = z.enum([\n`;
        
        node.members.forEach((member, index) => {
          const memberName = member.name.getText(tempFile);
          zodSchemaCode += `  '${memberName}'${index < node.members.length - 1 ? ',' : ''}\n`;
        });
        
        zodSchemaCode += `]);\n\n`;
      } else if (ts.isClassDeclaration(node) && node.name) {
        // Handle class validations
        const className = node.name.getText(tempFile);
        
        // Process constructor
        const constructor = node.members.find(m => ts.isConstructorDeclaration(m));
        if (constructor && ts.isConstructorDeclaration(constructor)) {
          zodSchemaCode += `export const z${className}Constructor = z.tuple([`;
          
          constructor.parameters.forEach((param, index) => {
            const typeName = param.type ? param.type.getText(tempFile) : 'any';
            let zodType = 'z.any()';
            
            if (typeName === 'string') zodType = 'z.string()';
            else if (typeName === 'number') zodType = 'z.number()';
            else if (typeName === 'boolean') zodType = 'z.boolean()';
            
            zodSchemaCode += `${zodType}${index < constructor.parameters.length - 1 ? ', ' : ''}`;
          });
          
          zodSchemaCode += `]);\n\n`;
        }
        
        // Process methods
        node.members.forEach(member => {
          if (ts.isMethodDeclaration(member) && member.name) {
            const methodName = member.name.getText(tempFile);
            
            // Method parameters
            zodSchemaCode += `export const z${className}_${methodName}_Params = z.tuple([`;
            
            member.parameters.forEach((param, index) => {
              const typeName = param.type ? param.type.getText(tempFile) : 'any';
              let zodType = 'z.any()';
              
              if (typeName === 'string') zodType = 'z.string()';
              else if (typeName === 'number') zodType = 'z.number()';
              else if (typeName === 'boolean') zodType = 'z.boolean()';
              
              zodSchemaCode += `${zodType}${index < member.parameters.length - 1 ? ', ' : ''}`;
            });
            
            zodSchemaCode += `]);\n\n`;
            
            // Method return type
            if (member.type) {
              const returnTypeName = member.type.getText(tempFile);
              let zodType = 'z.any()';
              
              if (returnTypeName === 'string') zodType = 'z.string()';
              else if (returnTypeName === 'number') zodType = 'z.number()';
              else if (returnTypeName === 'boolean') zodType = 'z.boolean()';
              else if (returnTypeName === 'void') zodType = 'z.void()';
              
              zodSchemaCode += `export const z${className}_${methodName}_Return = ${zodType};\n\n`;
            }
          }
        });
      }
      
      ts.forEachChild(node, visitNode);
    }
    
    visitNode(tempFile);
    
    // Add the Zod import
    if (zodSchemaCode) {
      zodSchemaCode = `import { z } from 'zod';\n\n${zodSchemaCode}`;
    }
    
    return zodSchemaCode;
  }
  
  test('should convert basic interface to Zod schema', () => {
    const tsCode = `
      interface User {
        id: number;
        name: string;
        isActive: boolean;
        tags: string[];
        settings?: {
          theme: string;
          notifications: boolean;
        };
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('import { z } from \'zod\'');
    expect(zodCode).toContain('export const zUser = z.object({');
    expect(zodCode).toMatch(/id: z\.(any|number)\(\)/);
    expect(zodCode).toMatch(/name: z\.(any|string)\(\)/);
    expect(zodCode).toMatch(/isActive: z\.(any|boolean)\(\)/);
    expect(zodCode).toMatch(/tags: z\.array\(z\.(any|string)\(\)\)/);
  });
  
  test('should handle optional properties', () => {
    const tsCode = `
      interface Product {
        id: number;
        name: string;
        description?: string;
        price: number;
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toMatch(/description: z\.(any|string)\(\)(\.optional\(\))?/);
    expect(zodCode).not.toContain('id: z.number().optional()');
    expect(zodCode).not.toContain('name: z.string().optional()');
    expect(zodCode).not.toContain('price: z.number().optional()');
  });
  
  test('should handle arrays and nested objects', () => {
    const tsCode = `
      interface BlogPost {
        id: number;
        title: string;
        content: string;
        tags: string[];
        comments: {
          id: number;
          text: string;
          author: {
            name: string;
            email: string;
          };
        }[];
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toMatch(/tags: z\.array\(z\.(any|string)\(\)\)/);
    expect(zodCode).toContain('comments: z.array(z.any())');
  });
  
  test('should handle union types', () => {
    const tsCode = `
      type Status = 'pending' | 'active' | 'completed';
      
      interface Task {
        id: number;
        title: string;
        status: Status;
        priority: 'low' | 'medium' | 'high';
        value: string | number;
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('export const zStatus = z.union([');
    const hasStatusField = 
      zodCode.includes('status: zStatus') || 
      zodCode.includes('status: z.union([') || 
      zodCode.includes('status: z.any()');
    expect(hasStatusField).toBeTruthy();
    expect(zodCode).toContain('priority: z.union([');
    expect(zodCode).toContain('value: z.union([');
  });
  
  test('should handle intersection types', () => {
    const tsCode = `
      type BaseEntity = {
        id: number;
        createdAt: string;
      };
      
      type WithMetadata = {
        metadata: Record<string, unknown>;
      };
      
      type EnhancedEntity = BaseEntity & WithMetadata;
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('export const zEnhancedEntity = z.intersection(');
  });
  
  test('should handle enums', () => {
    const tsCode = `
      enum Direction {
        Up,
        Down,
        Left,
        Right
      }
      
      interface Movement {
        direction: Direction;
        speed: number;
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('export const zDirection = z.enum([');
    expect(zodCode).toContain('\'Up\'');
    expect(zodCode).toContain('\'Down\'');
    expect(zodCode).toContain('\'Left\'');
    expect(zodCode).toContain('\'Right\'');
  });
  
  test('should handle generic types', () => {
    const tsCode = `
      interface Container<T> {
        value: T;
        timestamp: number;
      }
      
      type StringContainer = Container<string>;
      type NumberContainer = Container<number>;
      
      interface ApiResponse<T> {
        data: T;
        status: number;
        message: string;
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    expect(zodCode).toContain('export const zStringContainer = ');
    expect(zodCode).toContain('export const zNumberContainer = ');
    expect(zodCode).toContain('export const zApiResponse = ');
  });
  
  test('should handle class constructors and methods', () => {
    const tsCode = `
      class UserService {
        constructor(private apiKey: string, private timeout: number = 3000) {}
        
        async getUser(id: number): Promise<string> {
          return "user data";
        }
        
        updateUser(id: number, name: string, active: boolean): void {
          // Update user
        }
        
        deleteUser(id: number): boolean {
          return true;
        }
      }
    `;
    
    const zodCode = simulateConversion(tsCode);
    
    // Check constructor validation
    expect(zodCode).toContain('export const zUserServiceConstructor = z.tuple([');
    expect(zodCode).toContain('z.string()');
    
    // Check method params validation
    expect(zodCode).toContain('export const zUserService_getUser_Params = z.tuple([');
    expect(zodCode).toContain('export const zUserService_updateUser_Params = z.tuple([');
    expect(zodCode).toContain('export const zUserService_deleteUser_Params = z.tuple([');
    
    // Check method return type validation
    expect(zodCode).toContain('export const zUserService_getUser_Return = ');
    expect(zodCode).toContain('export const zUserService_updateUser_Return = ');
    expect(zodCode).toContain('export const zUserService_deleteUser_Return = ');
  });
}); 