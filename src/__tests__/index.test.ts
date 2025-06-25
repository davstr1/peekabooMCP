import { describe, test, expect } from 'vitest';
import { createPeekabooServer } from '../index.js';

describe('createPeekabooServer', () => {
  test('creates server with root directory', () => {
    const server = createPeekabooServer('/test/root');
    expect(server).toBeDefined();
    expect(server.connect).toBeDefined();
  });

  test('creates server with custom root directory', () => {
    const server = createPeekabooServer('/custom/root');
    expect(server).toBeDefined();
  });

  test('creates server with custom configuration', () => {
    const server = createPeekabooServer('/root', {
      recursive: false,
      maxDepth: 3
    });
    expect(server).toBeDefined();
  });

  test('server has required methods', () => {
    const server = createPeekabooServer('/test/root');
    expect(typeof server.connect).toBe('function');
    // The server object from MCP SDK has these methods
  });
});