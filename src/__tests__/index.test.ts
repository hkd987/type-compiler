import { typeCompilerPlugin } from '../index';
import ts from 'typescript';
import { createSourceFile } from 'typescript';

describe('TypeCompiler Plugin', () => {
  test('should have proper plugin structure', () => {
    // Create a minimal program
    const sourceFile = createSourceFile(
      'test.ts',
      '',
      ts.ScriptTarget.Latest
    );
    
    const host = ts.createCompilerHost({});
    const program = ts.createProgram(['test.ts'], {}, {
      ...host,
      getSourceFile: (fileName) => fileName === 'test.ts' ? sourceFile : undefined
    });
    
    // Test with default options
    const plugin = typeCompilerPlugin(program);
    
    // Verify the plugin structure
    expect(plugin).toBeDefined();
    
    // Test with generateZodSchemas enabled
    const pluginWithZod = typeCompilerPlugin(program, { generateZodSchemas: true });
    expect(pluginWithZod).toBeDefined();
    expect(pluginWithZod.before).toBeDefined();
    expect(Array.isArray(pluginWithZod.before)).toBe(true);
    expect(pluginWithZod.before?.length).toBeGreaterThan(0);
  });
}); 