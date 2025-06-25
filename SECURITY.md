# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in peekaboo-mcp, please report it by:

1. **DO NOT** open a public issue
2. Email security concerns to: [Create an issue marked as security]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Features

### Built-in Protections

1. **Path Traversal Prevention**
   - Multiple validation layers
   - Rejects `..` sequences
   - Validates resolved paths

2. **Automatic Root Detection**
   - No user-configurable root directory
   - Restricts access to project directory only
   - Must be run as installed npm package

3. **Read-Only Access**
   - No write operations
   - No file modification
   - No deletion capabilities

4. **Resource Limits**
   - Configurable timeouts
   - File size limits
   - Total size limits

### Best Practices

1. Keep the package updated
2. Use appropriate resource limits
3. Monitor server logs
4. Run with minimal privileges
5. Avoid exposing to untrusted networks

## Security Checklist

- [ ] Using latest version
- [ ] Resource limits configured
- [ ] Logging enabled
- [ ] Running with minimal privileges
- [ ] Not exposed to public internet
- [ ] Regular security updates applied