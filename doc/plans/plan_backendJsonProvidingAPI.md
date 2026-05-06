## Plan: Add `/export` API to serve stored JSON

TL;DR - Add a new GET API `/api/export` that returns a locally-stored JSON file (previously saved by the importer). Implement a safe `readJson` in the importer model, add a new `export` router/controller, mount it in `backend/app.js`, and add tests that post JSON objects then request them via `/api/export` to validate full flow.

**Steps**
1. Add `readJson(filename)` export to `backend/modules/importer/model.js` (safely resolve path using `UPLOAD_DIR` and `path.basename`, return parsed JSON or throw 404). *depends on step 2 tests creating a file*
2. Create `backend/modules/export/controller.js` with a `download` handler that reads the `filename` query (or `id`) and returns JSON (status 200) or 404. *parallel with step 3*
3. Create `backend/modules/export/index.js` to expose an Express router and route `GET /` -> `download`.
4. Mount the router in `backend/app.js`: `app.use('/api/export', exportRouter);`.
5. Add tests in `backend/__tests__/export.test.js` that:
   - Set `UPLOAD_DIR` test env (like `importer.test.js`).
   - POST a JSON payload to `/api/import` (reusing importer) to create a stored file.
   - GET `/api/export?filename=<id>` and assert `200` and `res.body` equals original payload (use JSON objects for strict equality).
   - Test `GET /api/export?filename=missing.json` returns `404`.
6. Run tests (`npm test` in `backend`) and fix any issues.

**Relevant files**
- [backend/app.js](backend/app.js) — mount new export router here
- [backend/modules/importer/model.js](backend/modules/importer/model.js) — add `readJson` and keep `saveJson`
- [backend/modules/export/index.js](backend/modules/export/index.js) — new router file to create
- [backend/modules/export/controller.js](backend/modules/export/controller.js) — new handler to read and send JSON
- [backend/__tests__/export.test.js](backend/__tests__/export.test.js) — new tests to validate the flow
- [backend/__tests__/importer.test.js](backend/__tests__/importer.test.js) — reference/consistency for test setup

**Verification**
1. Run `cd backend && npm test` and ensure all tests, including the new `export.test.js`, pass.
2. Manually test with `curl`:
   - Create: `curl -X POST http://localhost:3000/api/import?filename=test.json -H 'Content-Type: application/json' -d '{"a":1}'`
   - Fetch: `curl 'http://localhost:3000/api/export?filename=test.json'`
3. Check code paths for path-traversal (ensure `path.basename` + `path.resolve`) and that `404` is returned for missing files.

**Decisions / Assumptions**
- The API will accept a `filename` or `id` query parameter that corresponds to the saved file name (as returned by importer). Using `filename` keeps compatibility with importer tests.
- Reuse `UPLOAD_DIR` from config; do not add new config keys.
- Return the stored JSON as application/json with `res.json(...)` rather than forcing a file download.

**Further Considerations**
1. If users want file download headers (`Content-Disposition`), add an optional `download=true` query flag.
2. Consider pagination/listing endpoints later to enumerate stored files.
3. Add permission checks or rate limiting if exposing stored data publicly.
