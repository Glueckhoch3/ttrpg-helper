## Plan: Backend JSON API scaffold

TL;DR - Create an Express (ESM) backend that exposes endpoints to receive and return whole JSON files, organized into modules (model.js, index.js, controller.js, service.js). Enforce security rules from doc/documentation-DE.md (schema validation, size limits, path sanitization), load config from .env, and keep server bootstrap in `app.js` and `server.js`.

**Steps**
1. Discovery (done): inspected `backend/package.json`, `backend/server.js`, and `doc/documentation-DE.md` for security requirements and repo constraints. *depends on none*
2. Define config and defaults: list `.env` keys (PORT, BODY_LIMIT, UPLOAD_DIR, ALLOW_OVERWRITE). *depends on step 1*
3. Design JSON schema(s) for accepted payloads (use AJV). *depends on step 2*
4. Scaffold module layout for each feature area (e.g., `importer`, `exporter`, `storage`): create `model.js`, `service.js`, `controller.js`, `index.js` for each module. *parallelizable across modules*
5. Implement app bootstrap in `app.js`: load `dotenv`, apply middleware (`express.json({ limit })`, CORS, helmet or minimal headers), mount module routers, central error handler. *depends on steps 2-4*
6. Implement `server.js`: import `app.js`, start listening on `PORT`, graceful shutdown handlers. *depends on step 5*
7. Implement schema validation + file size checks in service layer; controllers return clear 4xx on validation failures. *depends on step 3*
8. Implement storage model: safe filesystem writes using allowlisted base directory, sanitize filenames, avoid path traversal; optionally implement atomic write and overwrite confirmation. *depends on step 4*
9. Add tests and verification scripts (unit tests for validation, integration curl tests). *parallel with steps 7-8*
10. Documentation & security audit: record decisions, list env vars, and document endpoints in `doc/ttrpg-API.yaml`.

**Relevant files (existing)**
- backend/server.js — simple placeholder/startup (inspect before reuse)
- backend/package.json — uses ESM and lists `express`, `dotenv`, `cors`
- doc/documentation-DE.md — security requirements to follow

**Files to create (suggested paths)**
- backend/app.js
- backend/server.js (update existing)
- backend/.env.example (populate with keys)
- backend/modules/importer/index.js
- backend/modules/importer/controller.js
- backend/modules/importer/service.js
- backend/modules/importer/model.js
- backend/modules/exporter/index.js
- backend/modules/exporter/controller.js
- backend/modules/exporter/service.js
- backend/modules/exporter/model.js
- backend/config/index.js (loads env constants)
- backend/middleware/errorHandler.js
- backend/middleware/requestValidation.js

**Verification**
1. `npm install` and `npm run dev` should start the server on configured `PORT`.
2. `curl` tests: POST valid JSON under size limit → 200/201; POST invalid JSON → 400; POST > limit → 413.
3. Unit tests for AJV schemas (valid/invalid cases).
4. Try GET endpoint to retrieve stored JSON file and verify content and headers.

**Decisions & Assumptions**
- Use filesystem-backed JSON storage (no DB) unless user requests a DB.
- Use AJV for JSON schema validation.
- Use `express.json({ limit: process.env.BODY_LIMIT })` to enforce size limits.
- Use ESM `import`/`export` to match `package.json`.
- Minimal auth: assume endpoints are unauthenticated unless user requests otherwise.

**Security considerations (from doc/documentation-DE.md)**
- Validate payloads against a schema and reject invalid structures.
- Enforce max body size to mitigate DoS.
- Sanitize filenames and disallow path traversal; write only to allowlisted base directory.
- Avoid logging sensitive data or local absolute file paths.
- Use fail-fast error handling and clear 4xx/5xx semantics.

**Questions (to confirm before implementation)**
1. Persist JSON to filesystem or use a DB? (filesystem recommended by your request)
2. Default max upload size? (recommend `2mb` as conservative default)
3. Should the backend accept the JSON as `application/json` body or multipart file upload?
4. Require authentication/authorization for endpoints?

**Next actions**
- Get answers to the above questions, then scaffold the folder structure and implement `app.js`, module templates, and validation logic.

*Plan saved to session memory.*