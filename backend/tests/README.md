# Running Tests

## Prerequisites
Make sure all dependencies are installed:
```bash
npm install
```

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run tests with coverage:
```bash
npm run test:coverage
```

## Test Structure

- `db.test.ts` - Tests for database functions (`addSession`, `addChat`, `getChats`)
- `app.test.ts` - Tests for Express API endpoints

## Notes

- Tests use a separate test database (`test-database.db`) that is automatically cleaned up
- The test database is isolated from the production database
- All tests run in isolation with fresh database state

## Known Issues

If you encounter "exports is not defined" errors, this is a known issue with `better-sqlite3` (a native module) and ESM in Jest. The tests are set up to work around this, but if issues persist, you may need to:

1. Ensure you're using Node.js 18+ with experimental VM modules support
2. The `NODE_OPTIONS=--experimental-vm-modules` flag is already included in the test scripts
3. If problems persist, consider using an in-memory database for tests or refactoring `db.ts` to accept a database instance parameter

## Test Coverage

The test suite covers:
- ✅ Database function: `addSession()` - creating sessions
- ✅ Database function: `addChat()` - adding chat messages
- ✅ Database function: `getChats()` - retrieving chats for a session
- ✅ API endpoint: `GET /api/v1/hello` - hello world endpoint
- ✅ API endpoint: `GET /api/v1/add-session` - session creation
- ✅ API endpoint: `POST /api/v1/chats` - chat message creation with validation
- ✅ API endpoint: `GET /api/v1/chats/:sessionId` - retrieving chats with error handling
