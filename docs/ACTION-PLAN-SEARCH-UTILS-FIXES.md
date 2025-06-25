# Action Plan: Fix Search Utils Test Failures

## Overview
This action plan addresses the 3 failing tests in search-utils.test.ts by fixing pattern matching issues.

## Preparation Steps

- [ ] Open search-utils.ts in the editor
- [ ] Open search-utils.test.ts in a separate pane for reference
- [ ] Run tests to confirm current failures: `npm test`

## Fix 1: Handle zero-or-more directories for `**` pattern

- [ ] Locate the `**` replacement logic at line 34 in search-utils.ts
- [ ] Identify the issue: `**` is replaced with `.*` which requires at least one character
- [ ] Modify line 34 to handle `**/` specifically:
  - [ ] Check if `__DOUBLE_STAR__` is followed by `/`
  - [ ] If yes, replace `__DOUBLE_STAR__/` with `(?:.*/)?` (optional path with trailing slash)
  - [ ] If no, keep existing behavior (replace with `.*`)
- [ ] Test the fix:
  - [ ] Run the specific test: `npm test -- --testNamePattern="matches directory patterns"`
  - [ ] Verify `/src/utils.js` is matched by pattern `src/**/*.js`

## Fix 2: Fix filename-only pattern logic

- [ ] Locate the broken logic at lines 50-51 in search-utils.ts
- [ ] Remove the existing broken logic that uses `indexOf('[^/]*')`
- [ ] Replace with new logic:
  - [ ] Check if pattern contains no `/` characters
  - [ ] If true, prepend `^.*/` to match any path ending with the pattern
  - [ ] Ensure the regex matches only the filename portion
- [ ] Special handling for `?` patterns:
  - [ ] Ensure `?` remains as `[^/]` (single non-slash character)
  - [ ] Don't add extra `[^/]*` for filename matching
- [ ] Test the fix:
  - [ ] Run the specific test: `npm test -- --testNamePattern="handles patterns with question marks"`
  - [ ] Verify `?.ts` matches `/a.ts` but not `/ab.ts`

## Fix 3: Add brace expansion to searchContent

- [ ] Locate searchContent's include pattern handling (lines 106-116)
- [ ] Find searchByPath's brace expansion logic (lines 36-40)
- [ ] Copy the brace expansion regex replacement to searchContent:
  - [ ] Add the `.replace(/\{([^}]+)\}/g, ...)` logic after line 110
  - [ ] This should convert `{js,md}` to `(js|md)`
- [ ] Ensure the order of replacements is correct:
  - [ ] Escape dots first
  - [ ] Then handle wildcards
  - [ ] Then handle braces
- [ ] Test the fix:
  - [ ] Run the specific test: `npm test -- --testNamePattern="handles complex include patterns"`
  - [ ] Verify `*.{js,md}` matches both `.js` and `.md` files

## Verification Steps

- [ ] Run all tests: `npm test`
- [ ] Confirm all 3 previously failing tests now pass
- [ ] Check that no other tests have been broken
- [ ] Run tests with coverage: `npm run test:coverage`
- [ ] Verify search-utils.ts has good coverage

## Code Quality Steps

- [ ] Add comments explaining the regex transformations
- [ ] Consider extracting common pattern conversion logic
- [ ] Update any relevant documentation

## Final Steps

- [ ] Commit the fixes with a descriptive message
- [ ] Push the changes
- [ ] Update the review document if needed