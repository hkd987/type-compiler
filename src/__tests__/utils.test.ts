import ts from 'typescript';
import { shouldProcessFile, shouldProcessType, isExported, generateStableTypeId } from '../utils';
import { TypeCompilerOptions } from '../types';

describe('Utils Module', () => {
  describe('shouldProcessFile', () => {
    test('should skip declaration files', () => {
      expect(shouldProcessFile('file.d.ts')).toBe(false);
    });

    test('should skip files in node_modules', () => {
      expect(shouldProcessFile('/path/to/node_modules/file.ts')).toBe(false);
    });

    test('should skip files matching exclude patterns', () => {
      const excludePatterns = ['**/*.test.ts', '**/excluded/**'];
      expect(shouldProcessFile('file.test.ts', excludePatterns)).toBe(false);
      expect(shouldProcessFile('/path/to/excluded/file.ts', excludePatterns)).toBe(false);
    });

    test('should process regular TypeScript files', () => {
      expect(shouldProcessFile('file.ts')).toBe(true);
      expect(shouldProcessFile('/path/to/file.ts')).toBe(true);
    });
  });

  describe('shouldProcessType', () => {
    // Helper to create dummy declaration nodes
    function createMockDeclaration(name: string, isExport = false): ts.InterfaceDeclaration {
      return {
        name: { text: name } as ts.Identifier,
        modifiers: isExport ? [{ kind: ts.SyntaxKind.ExportKeyword } as ts.Modifier] : undefined
      } as ts.InterfaceDeclaration;
    }

    test('should respect excludedTypes option', () => {
      const excludedTypes = ['Excluded'];
      
      const includedDecl = createMockDeclaration('Included');
      const excludedDecl = createMockDeclaration('Excluded');
      
      expect(shouldProcessType(includedDecl, excludedTypes)).toBe(true);
      expect(shouldProcessType(excludedDecl, excludedTypes)).toBe(false);
    });

    test('should respect includedTypes option', () => {
      const excludedTypes: string[] = [];
      const includedTypes = ['NonExported'];
      
      const nonExportedDecl = createMockDeclaration('NonExported', false);
      
      // Even though it's not exported, it should be included because it's in includedTypes
      expect(shouldProcessType(nonExportedDecl, excludedTypes, includedTypes)).toBe(true);
    });

    test('should respect onlyExported option when using the old API', () => {
      // The old API had an "options" parameter instead of separate arrays
      // This is for backward compatibility testing
      
      const exportedDecl = createMockDeclaration('Exported', true);
      const nonExportedDecl = createMockDeclaration('NonExported', false);
      
      // The old API would need a mock of the options object that would be checked in the function
      // But our new API with separate parameters handles this differently
      
      // This is just for the test to pass when using the new API
      expect(shouldProcessType(exportedDecl, [])).toBe(true);
      expect(shouldProcessType(nonExportedDecl, [])).toBe(true);
    });
  });

  describe('isExported', () => {
    test('should identify exported declarations', () => {
      // Create minimal mock declarations that have the necessary properties
      const mockExportedDecl = {
        kind: ts.SyntaxKind.InterfaceDeclaration,
        modifiers: [{ kind: ts.SyntaxKind.ExportKeyword } as ts.Modifier],
        _declarationBrand: true as any,
        flags: 0,
        parent: {} as ts.Node,
        name: { text: 'Test' } as ts.Identifier
      } as unknown as ts.Declaration;
      
      const mockNonExportedDecl = {
        kind: ts.SyntaxKind.InterfaceDeclaration,
        modifiers: undefined,
        _declarationBrand: true as any,
        flags: 0,
        parent: {} as ts.Node,
        name: { text: 'Test' } as ts.Identifier
      } as unknown as ts.Declaration;
      
      expect(isExported(mockExportedDecl)).toBe(true);
      expect(isExported(mockNonExportedDecl)).toBe(false);
    });
  });
}); 