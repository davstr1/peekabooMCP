import { describe, test, expect, vi } from 'vitest';
import { ResourceManager } from '../resource-manager.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

describe('ResourceManager', () => {
  describe('Timeout Management', () => {
    test('allows operation to complete within timeout', async () => {
      const rm = new ResourceManager({ timeout: 1000 });
      
      const quickOperation = new Promise<string>((resolve) => {
        setTimeout(() => resolve('success'), 100);
      });
      
      const result = await rm.withTimeout(quickOperation, 'test-operation');
      expect(result).toBe('success');
    });
    
    test('times out operation that exceeds limit', async () => {
      const rm = new ResourceManager({ timeout: 100 });
      
      const slowOperation = new Promise<string>((resolve) => {
        setTimeout(() => resolve('success'), 500);
      });
      
      await expect(rm.withTimeout(slowOperation, 'test-operation'))
        .rejects.toThrow('Operation timed out after 100ms');
    });
    
    test('returns operation directly when no timeout configured', async () => {
      const rm = new ResourceManager({});
      
      const operation = Promise.resolve('success');
      const result = await rm.withTimeout(operation, 'test-operation');
      expect(result).toBe('success');
    });
    
    test('uses custom timeout over default', async () => {
      const rm = new ResourceManager({ timeout: 1000 });
      
      const slowOperation = new Promise<string>((resolve) => {
        setTimeout(() => resolve('success'), 150);
      });
      
      // Custom timeout of 100ms should fail
      await expect(rm.withTimeout(slowOperation, 'test-operation', 100))
        .rejects.toThrow('Operation timed out after 100ms');
    });
  });
  
  describe('File Size Limits', () => {
    test('allows file within size limit', () => {
      const rm = new ResourceManager({ maxFileSize: 1000 });
      
      expect(() => rm.checkFileSize(500, '/test.txt')).not.toThrow();
    });
    
    test('rejects file exceeding size limit', () => {
      const rm = new ResourceManager({ maxFileSize: 1000 });
      
      expect(() => rm.checkFileSize(1500, '/test.txt'))
        .toThrow('exceeds maximum allowed size');
    });
    
    test('no error when maxFileSize not configured', () => {
      const rm = new ResourceManager({});
      
      expect(() => rm.checkFileSize(999999999, '/test.txt')).not.toThrow();
    });
  });
  
  describe('Total Size Tracking', () => {
    test('tracks cumulative size', () => {
      const rm = new ResourceManager({ maxTotalSize: 1000 });
      
      rm.trackSize(300);
      rm.trackSize(400);
      
      expect(rm.getTotalSize()).toBe(700);
    });
    
    test('throws when total size exceeds limit', () => {
      const rm = new ResourceManager({ maxTotalSize: 1000 });
      
      rm.trackSize(500);
      rm.trackSize(400);
      
      expect(() => rm.trackSize(200))
        .toThrow('exceeds maximum allowed size');
    });
    
    test('resets size counter', () => {
      const rm = new ResourceManager({ maxTotalSize: 1000 });
      
      rm.trackSize(500);
      rm.trackSize(400);
      rm.resetSize();
      
      expect(rm.getTotalSize()).toBe(0);
      
      // Should not throw after reset
      expect(() => rm.trackSize(800)).not.toThrow();
    });
    
    test('no error when maxTotalSize not configured', () => {
      const rm = new ResourceManager({});
      
      rm.trackSize(999999999);
      rm.trackSize(999999999);
      
      expect(rm.getTotalSize()).toBeGreaterThan(0);
    });
  });
  
  describe('Error Types', () => {
    test('timeout error has correct type', async () => {
      const rm = new ResourceManager({ timeout: 50 });
      
      const slowOperation = new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
      
      try {
        await rm.withTimeout(slowOperation, 'test-op');
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect((error as McpError).code).toBe(ErrorCode.InternalError);
      }
    });
    
    test('file size error has correct type', () => {
      const rm = new ResourceManager({ maxFileSize: 100 });
      
      try {
        rm.checkFileSize(200, '/test.txt');
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect((error as McpError).code).toBe(ErrorCode.InvalidRequest);
      }
    });
    
    test('total size error has correct type', () => {
      const rm = new ResourceManager({ maxTotalSize: 100 });
      
      try {
        rm.trackSize(200);
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect((error as McpError).code).toBe(ErrorCode.InvalidRequest);
      }
    });
  });
});