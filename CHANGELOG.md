# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-26

### Breaking Changes
- Removed `PEEKABOO_ROOT` environment variable for security reasons
- Direct execution is no longer supported - must be installed as npm package
- Changed function signatures for `listDirectory` and `readFileContent` to support resource management

### Added
- Search tools: `search_path` and `search_content` for finding files and content
- Resource management with configurable timeouts and size limits
- Automatic project root detection for enhanced security
- Comprehensive test suite (191 tests)
- Logger module for better production logging
- Example MCP client implementation
- Detailed documentation (testing guide, API responses, breaking changes)

### Changed
- Improved error messages and handling
- Enhanced MIME type detection
- Better TypeScript types throughout

### Fixed
- Path traversal vulnerabilities
- Memory usage in large directory structures
- Proper handling of special characters in filenames

### Security
- Automatic project root detection prevents access outside installed project
- Enhanced path validation with multiple security layers
- No user-configurable root directory

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Basic MCP server implementation
- List and read file operations
- Recursive directory listing
- Basic security measures