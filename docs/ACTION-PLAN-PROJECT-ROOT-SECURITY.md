# Action Plan: Implement Project Root Auto-Detection

## Overview
Remove the configurable `PEEKABOO_ROOT` environment variable and implement automatic project root detection for security.

## Phase 1: Create the findProjectRoot Function

- [ ] Open `src/index.ts` in the editor
- [ ] Add required imports at the top:
  - [ ] Import `path` from 'path'
  - [ ] Import `fs` from 'fs' (if not already imported)
- [ ] Create the `findProjectRoot()` function after the imports:
  - [ ] Add the function signature: `function findProjectRoot(): string`
  - [ ] Implement node_modules detection using `__dirname.lastIndexOf`
  - [ ] Add error handling for when not in node_modules
  - [ ] Return the extracted project root path
- [ ] Add JSDoc comment explaining the function's purpose

## Phase 2: Update Main Function

- [ ] Locate the `main()` function (around line 237)
- [ ] Find the line: `const rootDir = process.env.PEEKABOO_ROOT || DEFAULT_ROOT;`
- [ ] Replace it with: `const rootDir = findProjectRoot();`
- [ ] Remove any references to `PEEKABOO_ROOT` in error messages

## Phase 3: Update Configuration

- [ ] Check if `DEFAULT_ROOT` constant is still needed
- [ ] If not needed, remove the `DEFAULT_ROOT` declaration
- [ ] Update the `createPeekabooServer` function signature:
  - [ ] Make `rootDir` parameter non-optional if needed
  - [ ] Update default parameter handling

## Phase 4: Add Error Handling

- [ ] In `findProjectRoot()`, add descriptive error message
- [ ] Consider adding a try-catch block in `main()`
- [ ] Log the detected root directory for debugging:
  - [ ] Update the console.error message to show detected root
  - [ ] Keep the message informative but concise

## Phase 5: Update Tests

- [ ] Create a new test file: `src/__tests__/project-root.test.ts`
- [ ] Add test cases:
  - [ ] Test when running from node_modules
  - [ ] Test error case when not in node_modules
  - [ ] Mock `__dirname` for different scenarios
- [ ] Run tests to ensure they pass

## Phase 6: Update Documentation

- [ ] Open `README.md`
- [ ] Remove any mentions of `PEEKABOO_ROOT` configuration
- [ ] Add note about automatic project root detection
- [ ] Update the "Security" section if it exists
- [ ] Check for any example configurations and update them

## Phase 7: Test the Implementation

- [ ] Build the project: `npm run build`
- [ ] Run manual test: `npm run test:manual`
- [ ] Create a test scenario:
  - [ ] Create a temporary test project
  - [ ] Install peekaboo-mcp locally
  - [ ] Verify it correctly detects the project root
- [ ] Test error handling:
  - [ ] Try running directly (not from node_modules)
  - [ ] Verify error message is clear

## Phase 8: Final Verification

- [ ] Run all tests: `npm test`
- [ ] Run linting if available
- [ ] Check TypeScript compilation: `npm run build`
- [ ] Review all changes for security implications
- [ ] Ensure no environment variable override is possible

## Phase 9: Commit Changes

- [ ] Stage all changes
- [ ] Create commit with message explaining security improvement
- [ ] Push to repository

## Notes

- This is a breaking change - users can no longer configure the root directory
- The security improvement outweighs the loss of flexibility
- Advanced users can fork if they need custom behavior