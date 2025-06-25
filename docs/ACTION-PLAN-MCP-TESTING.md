# Action Plan: Improve MCP Testing to Production Quality

## Overview
Address the critical gaps in MCP protocol testing to bring peekaboo-mcp from 70% to 100% production readiness.

## Phase 1: MCP Protocol Handler Tests

### Setup Test Infrastructure
- [ ] Create new test file: `src/__tests__/mcp-handlers.test.ts`
- [ ] Import necessary MCP types and schemas
- [ ] Create mock request/response helpers
- [ ] Set up test server instance for each test

### Test ListResourcesRequestSchema Handler
- [ ] Create test: "returns empty array when no files exist"
- [ ] Create test: "returns correct resource structure for files"
- [ ] Create test: "returns correct resource structure for directories"
- [ ] Create test: "includes proper MIME types for files"
- [ ] Create test: "handles recursive listing correctly"
- [ ] Create test: "respects maxDepth configuration"
- [ ] Create test: "excludes node_modules and build directories"
- [ ] Create test: "handles filesystem errors gracefully"

### Test ReadResourceRequestSchema Handler
- [ ] Create test: "reads text file content successfully"
- [ ] Create test: "returns correct MIME type for file"
- [ ] Create test: "rejects non-file:// URIs"
- [ ] Create test: "handles path traversal attempts"
- [ ] Create test: "handles non-existent files"
- [ ] Create test: "handles permission denied errors"
- [ ] Create test: "handles binary files appropriately"
- [ ] Create test: "validates URI format correctly"

### Test ListToolsRequestSchema Handler
- [ ] Create test: "returns both search tools"
- [ ] Create test: "includes correct tool schemas"
- [ ] Create test: "tool descriptions are accurate"
- [ ] Create test: "required parameters are specified"

### Test CallToolRequestSchema Handler - search_path
- [ ] Create test: "finds files with simple patterns"
- [ ] Create test: "handles glob patterns correctly"
- [ ] Create test: "returns empty when no matches"
- [ ] Create test: "handles missing pattern parameter"
- [ ] Create test: "handles invalid patterns gracefully"

### Test CallToolRequestSchema Handler - search_content
- [ ] Create test: "finds content in text files"
- [ ] Create test: "respects include parameter"
- [ ] Create test: "handles ignoreCase flag"
- [ ] Create test: "limits results to maxResults"
- [ ] Create test: "handles missing query parameter"
- [ ] Create test: "skips binary files"
- [ ] Create test: "handles regex special characters"

## Phase 2: Integration Tests

### Create MCP Client Integration Tests
- [ ] Create new test file: `src/__tests__/mcp-integration.test.ts`
- [ ] Set up test MCP client using SDK
- [ ] Create helper to spawn server process
- [ ] Create helper to connect client to server

### Test Full Client-Server Interaction
- [ ] Test: "client can connect to server"
- [ ] Test: "client can list resources"
- [ ] Test: "client can read specific resource"
- [ ] Test: "client can list available tools"
- [ ] Test: "client can call search_path tool"
- [ ] Test: "client can call search_content tool"
- [ ] Test: "server handles client disconnect gracefully"

### Test Error Handling
- [ ] Test: "server returns proper MCP errors"
- [ ] Test: "client receives error codes correctly"
- [ ] Test: "malformed requests don't crash server"
- [ ] Test: "server recovers from handler errors"

## Phase 3: Edge Cases and Stress Tests

### Create Edge Case Tests
- [ ] Create new test file: `src/__tests__/edge-cases.test.ts`
- [ ] Test: "handles empty directories"
- [ ] Test: "handles very long file paths"
- [ ] Test: "handles special characters in filenames"
- [ ] Test: "handles symbolic links safely"
- [ ] Test: "handles circular directory structures"

### Create Stress Tests
- [ ] Create new test file: `src/__tests__/stress.test.ts`
- [ ] Test: "handles directory with 1000 files"
- [ ] Test: "handles deeply nested directories (50 levels)"
- [ ] Test: "handles large file content (10MB)"
- [ ] Test: "handles rapid sequential requests"
- [ ] Test: "memory usage stays within bounds"

## Phase 4: Security Tests Enhancement

### Enhance findProjectRoot Tests
- [ ] Test: "handles symlinked node_modules"
- [ ] Test: "works in monorepo with workspaces"
- [ ] Test: "works with pnpm node_modules structure"
- [ ] Test: "handles permission denied on parent dirs"
- [ ] Test: "works on Windows with different separators"

## Phase 5: Timeout and Resource Management

### Implement Timeout Handling
- [ ] Add timeout configuration to ServerConfig
- [ ] Wrap all async operations with timeout
- [ ] Add tests for timeout scenarios
- [ ] Ensure timeouts return proper MCP errors

### Implement Memory Limits
- [ ] Add maxFileSize configuration
- [ ] Add maxTotalSize for directory listing
- [ ] Implement streaming for large files
- [ ] Add tests for memory limit scenarios

## Phase 6: Documentation and Examples

### Create Test Documentation
- [ ] Document how to run integration tests
- [ ] Create example test client script
- [ ] Document expected MCP responses
- [ ] Add troubleshooting guide

### Update Main Documentation
- [ ] Add section on stability guarantees
- [ ] Document all error codes returned
- [ ] Add performance characteristics
- [ ] Include breaking changes migration guide

## Verification Steps

- [ ] Run full test suite: `npm test`
- [ ] Check coverage increased to >80% for index.ts
- [ ] Run integration tests separately
- [ ] Test with real MCP client (Claude, etc.)
- [ ] Verify no memory leaks under stress
- [ ] Confirm all MCP protocol requirements met

## Success Criteria

- [ ] index.ts coverage > 80%
- [ ] All MCP handlers have dedicated tests
- [ ] Integration tests pass consistently
- [ ] Stress tests complete without crashes
- [ ] Memory usage predictable and bounded
- [ ] Timeouts prevent hanging operations
- [ ] Security tests cover all scenarios

## Notes

- Rate limiting excluded per user requirement
- Focus on MCP protocol compliance
- Prioritize stability over features
- Each test should be independent
- Use realistic test data when possible