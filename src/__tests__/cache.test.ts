import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { FileCache, globalTypeCache, getFileCache } from '../cache';
import { TypeCompilerOptions } from '../types';

// Create a temporary test file
function createTempFile(content: string): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'));
  const filePath = path.join(tempDir, 'test.ts');
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('Cache Module', () => {
  describe('globalTypeCache', () => {
    test('should be an instance of Map', () => {
      expect(globalTypeCache).toBeInstanceOf(Map);
      expect(globalTypeCache.size).toBe(0);
    });

    test('should store and retrieve values', () => {
      globalTypeCache.set('testType', 'z.string()');
      expect(globalTypeCache.get('testType')).toBe('z.string()');
      
      // Clean up
      globalTypeCache.delete('testType');
    });
  });

  describe('FileCache', () => {
    test('should detect file changes', () => {
      const fileCache = new FileCache();
      const filePath = createTempFile('// Initial content');

      // First check should indicate the file has changed (since it's not in cache)
      expect(fileCache.hasFileChanged(filePath)).toBe(true);
      
      // Second check should indicate no change
      expect(fileCache.hasFileChanged(filePath)).toBe(false);
      
      // Modify the file and check again
      fs.writeFileSync(filePath, '// Modified content');
      expect(fileCache.hasFileChanged(filePath)).toBe(true);
      
      // Clean up
      try {
        fs.rmSync(path.dirname(filePath), { recursive: true, force: true });
      } catch (error) {
        console.error('Error cleaning up:', error);
      }
    });

    test('should handle non-existent files', () => {
      const fileCache = new FileCache();
      const nonExistentPath = path.join(os.tmpdir(), 'non-existent-file.ts');
      
      // Should return true for non-existent files (indicating they've "changed")
      expect(fileCache.hasFileChanged(nonExistentPath)).toBe(true);
    });
  });

  describe('getFileCache', () => {
    test('should return a FileCache instance', () => {
      const options: TypeCompilerOptions = {};
      const cache = getFileCache(options);
      expect(cache).toBeInstanceOf(FileCache);
    });

    test('should use incrementalCachePath when provided', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-path-test-'));
      const cachePath = path.join(tempDir, 'cache.json');
      
      const options: TypeCompilerOptions = {
        incrementalCompilation: true,
        incrementalCachePath: cachePath
      };
      
      // Create cache and save it
      const cache = getFileCache(options);
      
      // Test file operations to ensure cache file is created
      const testFile = path.join(tempDir, 'test.ts');
      fs.writeFileSync(testFile, '// Test content');
      cache.hasFileChanged(testFile);
      cache.saveCache();
      
      // Check that cache file was created
      expect(fs.existsSync(cachePath)).toBe(true);
      
      // Clean up
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Error cleaning up:', error);
      }
    });
  });
}); 