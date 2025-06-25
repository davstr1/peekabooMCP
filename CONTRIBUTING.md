# Contributing to peekaboo-mcp

Thank you for your interest in contributing to peekaboo-mcp! This guide will help you get started.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/peekabooMCP.git
   cd peekabooMCP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Development Workflow

### Running the server locally

```bash
npm run dev
```

### Running tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
npm run build
```

## Code Style

- We use TypeScript with strict mode enabled
- Follow existing code patterns
- Keep functions small and focused
- Add JSDoc comments for public APIs

## Testing

### Test Requirements

- All new features must have tests
- Maintain or improve code coverage
- Tests should be independent and not rely on external state
- Use meaningful test descriptions

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    test('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Ensure tests pass**
   ```bash
   npm run validate
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `test:` for tests
   - `refactor:` for refactoring
   - `chore:` for maintenance

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Requirements**
   - Clear description of changes
   - Tests passing
   - No decrease in code coverage
   - Documentation updated if needed

## Security

- Never add authentication tokens or secrets
- Always validate user input
- Follow the principle of least privilege
- Report security issues privately

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag
4. Push tag to trigger release

## Questions?

Feel free to open an issue for any questions or concerns!