# REVIEW: Search Utils Test Failures

## Overview
3 tests are failing in search-utils.test.ts due to pattern matching issues in the search-utils.ts implementation.

## Failing Tests Analysis

### 1. Test: `matches directory patterns: src/**/*.js`
**Expected**: Pattern should match `/src/utils.js`
**Actual**: Returns empty array

**Root Cause**: 
- The regex conversion produces `^/src/.*/[^/]*\.js$`
- The `.*` after `src/` requires at least one character, but `/src/utils.js` has nothing between `src/` and `utils.js`
- The pattern incorrectly assumes `**` means "one or more directories" when it should mean "zero or more"

### 2. Test: `handles patterns with question marks`
**Expected**: Pattern `?.ts` should match `/a.ts` but not `/ab.ts`
**Actual**: Matches both

**Root Cause**:
- Lines 50-51 have broken logic for filename-only patterns
- The code tries to find `[^/]*` in the pattern, but `?` converts to `[^/]` (single char)
- `indexOf('[^/]*')` returns -1, causing incorrect string slicing
- Final regex becomes `[^/]*ts$` instead of matching single-character filenames

### 3. Test: `handles complex include patterns`
**Expected**: Pattern `*.{js,md}` should match `.js` and `.md` files
**Actual**: Matches nothing

**Root Cause**:
- searchContent (lines 106-116) doesn't handle brace expansion `{...}`
- searchByPath has this feature (lines 36-40) but searchContent doesn't
- The pattern `*.{js,md}` becomes `.*\.{js,md}` which literally looks for files ending in `.{js,md}`

## Actionable Fixes

### Fix 1: Handle zero-or-more directories for `**`
In searchByPath, modify the pattern handling to ensure `**` can match zero directories:
- Change line 34 to handle the case where `**` is directly followed by `/`
- Consider: `src/**/*.js` should match both `/src/utils.js` and `/src/foo/bar.js`

### Fix 2: Fix filename-only pattern logic
Replace the broken logic at lines 50-51:
- Detect if pattern has no path separators
- For such patterns, create a regex that matches only the filename portion
- Ensure `?` correctly translates to single-character match

### Fix 3: Add brace expansion to searchContent
Port the brace expansion logic from searchByPath (lines 36-40) to searchContent:
- Add the regex replacement for `{...}` patterns
- Ensure consistency between both search functions

## Additional Issues Found

1. **Inconsistent pattern handling**: searchByPath and searchContent use different regex conversion approaches
2. **No unit tests for regex conversion**: The pattern-to-regex conversion logic should be extracted and tested separately
3. **Edge cases not covered**: Patterns like `**/` (trailing slash), `**` alone, or nested braces aren't handled

## Recommendations

1. **Extract pattern conversion**: Create a shared `globToRegex` function used by both search functions
2. **Add comprehensive tests**: Test the regex conversion logic independently
3. **Document pattern syntax**: Add JSDoc comments explaining supported glob patterns
4. **Consider using a library**: For production use, consider using established glob libraries like `minimatch` or `micromatch`