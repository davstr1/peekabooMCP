# Release Notes - v2.0.0

## 🎉 100% Production Ready Release

This major release brings peekaboo-mcp to 100% production readiness with significant improvements in security, stability, and developer experience.

## 🚨 Breaking Changes

- **Logging**: Removed `console.error` in favor of structured logging via the new logger module
- **Health Check**: The `health_check` tool no longer exposes sensitive configuration details (rootDir, timeout values, etc.)
- **Error Messages**: Error messages no longer expose file paths for enhanced security

## ✨ New Features

### Structured Logging
- New logger module with configurable log levels (error, warn, info, debug)
- Environment variable support: `LOG_LEVEL=debug npx peekaboo-mcp`
- Consistent logging format across the application

### Health Check Tool
- New MCP tool: `health_check` provides server status and metrics
- Includes uptime, version, and operation metrics
- Secure output without sensitive configuration exposure

### Performance Metrics
- Built-in metrics collection for all operations
- Track success rates, operation counts, and timing
- Available through the health check tool

### Enhanced Security
- Improved error message sanitization
- Added resource limits to search operations
- File size checks before content search (skip files > 1MB)
- Maximum files to search limit (default 1000)

## 🔧 Improvements

### Developer Experience
- Added comprehensive CI/CD with GitHub Actions
- Automated testing on pull requests
- Build validation scripts (`prepublishOnly`, `pretest`)
- Improved TypeScript strict mode compliance

### Documentation
- Added CONTRIBUTING.md with development guidelines
- Created SECURITY.md with vulnerability reporting process
- Enhanced troubleshooting guide with error codes
- Added FAQ section to README

### Package Quality
- Optimized npm package size: 20.9kB (was 48.3kB)
- Reduced file count: 39 files (was 91)
- Proper .npmignore configuration
- Complete package metadata

### Testing
- 191 tests with >80% coverage
- Fixed all TypeScript compilation issues
- Added stress tests for large directories
- Enhanced security test suite

## 🔒 Security Fixes

- Path traversal protection enhancements
- Removed sensitive information from error messages
- Added input validation for search patterns
- Resource limit enforcement

## 📦 Installation

```bash
npm install peekaboo-mcp@2.0.0
```

## 🔄 Migration Guide

### From v1.x to v2.0.0

1. **Error Handling**: Update any code that depends on specific error message formats
2. **Health Check**: If using the health check, adjust to the new response format
3. **Logging**: Set `LOG_LEVEL` environment variable if you need debug logging

## 🙏 Acknowledgments

Thanks to all contributors and users who helped make peekaboo-mcp production-ready!

## 📝 Full Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed changes.