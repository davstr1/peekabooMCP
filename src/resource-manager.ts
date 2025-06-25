import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export interface ResourceLimits {
  timeout?: number;
  maxFileSize?: number;
  maxTotalSize?: number;
}

export class ResourceManager {
  private totalSize = 0;
  
  constructor(private limits: ResourceLimits = {}) {}
  
  /**
   * Wraps an async operation with a timeout
   */
  async withTimeout<T>(
    operation: Promise<T>,
    operationName: string,
    customTimeout?: number
  ): Promise<T> {
    const timeout = customTimeout || this.limits.timeout;
    if (!timeout) {
      return operation;
    }
    
    return Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new McpError(
            ErrorCode.InternalError,
            `Operation timed out after ${timeout}ms`
          ));
        }, timeout);
      })
    ]);
  }
  
  /**
   * Checks if a file size exceeds the limit
   */
  checkFileSize(size: number, filePath: string): void {
    if (!this.limits.maxFileSize) return;
    
    if (size > this.limits.maxFileSize) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `File size (${size} bytes) exceeds maximum allowed size (${this.limits.maxFileSize} bytes)`
      );
    }
  }
  
  /**
   * Tracks total size and checks against limit
   */
  trackSize(size: number): void {
    this.totalSize += size;
    
    if (this.limits.maxTotalSize && this.totalSize > this.limits.maxTotalSize) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Total size (${this.totalSize} bytes) exceeds maximum allowed size (${this.limits.maxTotalSize} bytes)`
      );
    }
  }
  
  /**
   * Resets the total size counter
   */
  resetSize(): void {
    this.totalSize = 0;
  }
  
  /**
   * Gets the current total size
   */
  getTotalSize(): number {
    return this.totalSize;
  }
}