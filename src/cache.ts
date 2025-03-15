import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileInfo, TypeCompilerOptions } from './types';
import { logger } from './logger';

/**
 * Global cache to store computed Zod schemas across transformer invocations
 */
export const globalTypeCache = new Map<string, string>();

/**
 * File cache for tracking file modifications for incremental compilation
 */
export class FileCache {
  private cache: Map<string, FileInfo> = new Map();
  private cachePath?: string;
  private initialized = false;
  
  constructor(cachePath?: string) {
    this.cachePath = cachePath;
    this.initialized = false;
    this.loadCache();
  }
  
  /**
   * Load the cache from disk if a cache path is provided
   */
  private loadCache(): void {
    if (this.initialized) return;
    
    if (this.cachePath && fs.existsSync(this.cachePath)) {
      try {
        logger.debug(`Loading cache from ${this.cachePath}`);
        const cacheData = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8'));
        for (const [key, value] of Object.entries(cacheData)) {
          this.cache.set(key, value as FileInfo);
        }
        logger.info(`Loaded ${this.cache.size} entries from cache`);
      } catch (error) {
        logger.error('Error loading cache', { 
          error: error instanceof Error ? error.message : String(error),
          path: this.cachePath
        });
        // Continue without cache if there's an error
      }
    } else if (this.cachePath) {
      logger.debug(`Cache file does not exist yet: ${this.cachePath}`);
    }
    
    this.initialized = true;
  }
  
  /**
   * Save the cache to disk if a cache path is provided
   */
  public saveCache(): void {
    if (!this.cachePath) return;
    
    try {
      logger.debug(`Saving cache to ${this.cachePath}`);
      const cacheData: Record<string, FileInfo> = {};
      for (const [key, value] of this.cache.entries()) {
        cacheData[key] = value;
      }
      
      // Create directory if it doesn't exist
      const cacheDir = path.dirname(this.cachePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      fs.writeFileSync(this.cachePath, JSON.stringify(cacheData, null, 2));
      logger.info(`Saved ${this.cache.size} entries to cache`);
    } catch (error) {
      logger.error('Error saving cache', { 
        error: error instanceof Error ? error.message : String(error),
        path: this.cachePath
      });
      // Continue even if we can't save the cache
    }
  }
  
  /**
   * Check if a file has changed since the last time it was processed
   */
  public hasFileChanged(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        // File doesn't exist, so consider it changed
        logger.debug(`File does not exist: ${filePath}`);
        return true;
      }
      
      const stats = fs.statSync(filePath);
      const currentTimestamp = stats.mtimeMs;
      
      // Compute a hash of the file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const contentHash = crypto
        .createHash('md5')
        .update(fileContent)
        .digest('hex');
      
      const cachedInfo = this.cache.get(filePath);
      
      if (!cachedInfo) {
        // File not in cache, so consider it changed
        logger.trace(`File not in cache: ${filePath}`);
        this.updateFile(filePath, currentTimestamp, contentHash);
        logger.incrementMetric('cacheMisses');
        return true;
      }
      
      // Check if timestamp or content has changed
      if (
        cachedInfo.timestamp !== currentTimestamp ||
        cachedInfo.contentHash !== contentHash
      ) {
        logger.trace(`File has changed: ${filePath}`);
        this.updateFile(filePath, currentTimestamp, contentHash);
        logger.incrementMetric('cacheMisses');
        return true;
      }
      
      logger.trace(`File unchanged: ${filePath}`);
      logger.incrementMetric('cacheHits');
      return false;
    } catch (error) {
      logger.error(`Error checking if file has changed: ${filePath}`, { 
        error: error instanceof Error ? error.message : String(error)
      });
      // If there's an error, assume the file has changed to be safe
      logger.incrementMetric('cacheMisses');
      return true;
    }
  }
  
  /**
   * Update the cache entry for a file
   */
  private updateFile(filePath: string, timestamp: number, contentHash: string): void {
    this.cache.set(filePath, {
      timestamp,
      contentHash
    });
  }
  
  /**
   * Mark a file as processed without checking its content
   */
  public markFileProcessed(filePath: string): void {
    try {
      const stats = fs.statSync(filePath);
      const currentTimestamp = stats.mtimeMs;
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const contentHash = crypto
        .createHash('md5')
        .update(fileContent)
        .digest('hex');
      
      this.updateFile(filePath, currentTimestamp, contentHash);
      logger.trace(`Marked file as processed: ${filePath}`);
    } catch (error) {
      logger.error(`Error marking file as processed: ${filePath}`, { 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

/**
 * Get or create a file cache based on the provided options
 */
export function getFileCache(options: TypeCompilerOptions): FileCache {
  const cachePath = options.incrementalCompilation && options.incrementalCachePath
    ? path.resolve(options.incrementalCachePath)
    : undefined;
  
  if (cachePath) {
    logger.debug(`Creating file cache with path: ${cachePath}`);
  } else {
    logger.debug('Creating in-memory file cache');
  }
  
  return new FileCache(cachePath);
}

/**
 * Check if a file has changed since the last compilation
 */
export function isFileUnchanged(filePath: string): boolean {
  // This is a stub that would be replaced with the real implementation
  // that uses the FileCache class
  return false;
}

/**
 * Mark a file as processed in the cache
 */
export function markFileAsProcessed(filePath: string): void {
  // This is a stub that would be replaced with the real implementation
  // that uses the FileCache class
} 