# Thai Flashcards App - Bugbot Review Guidelines

## Project Overview
This is a Next.js 14 Thai language learning flashcard application with spaced repetition, audio lessons, and AI-generated content.

## Critical Review Areas

### Import and Export Consistency
- Verify all imports match actual exports (e.g., `ALL_COMMON_SENTENCES_SETS` vs `COMMON_SENTENCES_SETS`)
- Check that refactored files maintain backward compatibility
- Ensure TypeScript interfaces are properly exported and imported

### Data Structure Integrity
- Validate that all `Phrase` objects have required fields: `english`, `thai`, `pronunciation`, `mnemonic`
- Check for unterminated string literals in data files
- Ensure `thaiMasculine` and `thaiFeminine` fields are present where expected
- Verify `examples` array contains proper `ExampleSentence` objects with `translation` (not `english`)

### Mnemonic Quality
- Flag mnemonics that contain verbatim translations instead of phonetic memory aids
- Ensure mnemonics don't include gender pronouns (chan/pom) or politeness particles (ka/krap)
- Check that mnemonics relate to pronunciation, not literal meaning

### TypeScript Strict Mode
- No `any` types without explicit justification
- All function parameters must be typed
- Catch missing properties in interfaces

### Authentication and Data Access
- Verify Clerk authentication is properly implemented
- Check that user data is properly scoped (no cross-user data leaks)
- Ensure default sets are accessible to both guests and logged-in users

### Database and Storage
- Prisma queries should handle null/undefined gracefully
- Supabase storage operations need proper error handling
- Check for proper cleanup of temporary files

### Frontend State Management
- Verify proper React hook dependencies
- Check for memory leaks in useEffect cleanup
- Ensure localStorage operations have fallbacks

### Mobile Responsiveness
- Check for viewport-specific CSS issues
- Verify touch event handlers
- Look for z-index conflicts with mobile browsers

### API Routes
- All routes should handle both GET and POST appropriately
- Check for proper error responses and status codes
- Verify CORS and authentication middleware

### Audio Generation
- Ensure proper handling of background audio generation
- Check for memory leaks in audio processing
- Verify cleanup of audio blobs

## Common Issues to Flag

1. **Missing await keywords** - Especially in database operations
2. **Unhandled promise rejections** - All promises should have error handling
3. **Console.log statements** - Should be removed or use proper logging
4. **Hardcoded values** - Should use environment variables or constants
5. **Missing null checks** - Especially for optional chaining
6. **Incorrect array methods** - Using map when forEach is needed, etc.

## Performance Considerations
- Flag large data imports that could be lazy-loaded
- Check for unnecessary re-renders in React components
- Identify potential N+1 query problems

## Security Focus
- Input validation on all user-provided data
- XSS prevention in rendered content
- Proper sanitization of file uploads
- Rate limiting on API endpoints

## Testing Requirements
- New features should have corresponding tests
- Data transformations need unit tests
- API routes need integration tests

## Code Style
- Consistent use of TypeScript strict mode
- Proper naming conventions (camelCase for functions, PascalCase for components)
- Meaningful variable names (no single letters except in loops)

## Deployment Checks
- Environment variables are properly configured
- Build process completes without warnings
- No development dependencies in production
