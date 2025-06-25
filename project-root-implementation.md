# Project Root Auto-Detection Implementation Plan

## Overview
Implement automatic project root detection for peekaboo-mcp when installed as an npm package, while maintaining security and preventing path traversal attacks.

## Key Requirements
1. Automatically detect project root when installed in `node_modules`
2. No user configuration allowed (to prevent exploitation)
3. Maintain existing security measures (path validation, traversal prevention)
4. Fallback to safe defaults when detection fails

## Implementation Approach

### 1. Detection Logic
```typescript
function findProjectRoot(): string {
  // Start from the directory containing the executing file
  let currentDir = __dirname;
  
  // Check if we're in node_modules
  const nodeModulesIndex = currentDir.lastIndexOf(`${path.sep}node_modules${path.sep}`);
  
  if (nodeModulesIndex !== -1) {
    // Extract the project directory (parent of node_modules)
    currentDir = currentDir.substring(0, nodeModulesIndex);
  }
  
  // Find the nearest package.json
  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      // Verify it's not our own package.json
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (pkg.name !== 'peekaboo-mcp') {
          return currentDir;
        }
      } catch {
        // Invalid package.json, continue searching
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  // Fallback to current working directory
  return process.cwd();
}
```

### 2. Security Considerations

#### A. Path Validation
- The detected root must be an absolute path
- No symlink resolution that could escape the intended directory
- Validate the detected root is a real directory

#### B. Prevent Exploitation
- Never accept user input for root directory when auto-detection is enabled
- Ignore environment variables that could override the detection
- Ensure the detection cannot be influenced by malicious package.json files

#### C. Safe Fallbacks
- If detection fails, use `process.cwd()` as fallback
- Never default to system root or sensitive directories
- Log warnings when fallback is used

### 3. Integration Points

#### A. Main Entry Point (src/index.ts)
```typescript
// Replace current logic:
const DEFAULT_ROOT = process.cwd();

// With:
const DEFAULT_ROOT = findProjectRoot();

// Remove environment variable override when in auto-detect mode:
const rootDir = isAutoDetectMode() ? DEFAULT_ROOT : (process.env.PEEKABOO_ROOT || DEFAULT_ROOT);
```

#### B. Detection Mode Flag
```typescript
function isAutoDetectMode(): boolean {
  // Check if we're running from node_modules
  return __dirname.includes(`${path.sep}node_modules${path.sep}peekaboo-mcp`);
}
```

### 4. Edge Cases to Handle

1. **Global Installation**
   - Detect if installed globally (npm -g)
   - Use `process.cwd()` for global installs

2. **Monorepo Structures**
   - May have multiple package.json files
   - Use the first one found above node_modules

3. **Symbolic Links**
   - Resolve real paths to prevent escaping via symlinks
   - Use `fs.realpathSync()` for validation

4. **Permission Issues**
   - Handle cases where package.json is not readable
   - Continue searching up the tree

### 5. Testing Strategy

1. **Unit Tests**
   - Mock different directory structures
   - Test node_modules detection
   - Test fallback scenarios

2. **Integration Tests**
   - Test actual npm installation
   - Test with various project structures
   - Test security boundaries

### 6. Implementation Steps

1. Create `findProjectRoot()` function in a new `src/project-root.ts` file
2. Add comprehensive unit tests for the detection logic
3. Update `src/index.ts` to use auto-detection
4. Add integration tests for npm installation scenarios
5. Update documentation about auto-detection behavior
6. Add logging for debugging root detection

### 7. Example Usage Scenarios

#### Scenario 1: Normal npm install
```
/my-project/
  package.json
  node_modules/
    peekaboo-mcp/
      dist/
        index.js  <- Running from here
```
Result: Root = `/my-project/`

#### Scenario 2: Nested project
```
/workspace/
  projects/
    my-app/
      package.json
      node_modules/
        peekaboo-mcp/
```
Result: Root = `/workspace/projects/my-app/`

#### Scenario 3: Global install
```
/usr/local/lib/node_modules/peekaboo-mcp/
```
Result: Root = `process.cwd()` (current directory where command is run)

### 8. Security Testing Checklist

- [ ] Cannot escape detected root via path traversal
- [ ] Cannot influence detection via malicious package.json
- [ ] Cannot override detection via environment variables
- [ ] Symlinks are properly resolved and validated
- [ ] All paths are normalized before use
- [ ] Proper error handling for permission issues
- [ ] No information disclosure in error messages