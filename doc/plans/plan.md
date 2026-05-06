## Plan: Simple Frontend JSON Import/Export

TL;DR - Add a minimal Vue UI that lets a user POST arbitrary JSON to the backend at `/api/import`, and fetch stored JSON via `/api/export?filename=...`. Implement two inputs: one for JSON body + `Import` button, and one for `filename` + `Fetch` button to display returned JSON.

**Steps**
1. Create a new Vue component `frontend/src/components/JsonImportExport.vue` that contains:
   - A textarea for free-form JSON input and an `Import` button.
   - A single-line input for `filename` and a `Fetch` button.
   - A display area for response/result JSON.
   - Local validation: basic JSON.parse with user-friendly error message before POST.
   - Use `fetch` to call backend endpoints.
   - *depends on step 3 (styles optional)*
2. Register a route or mount the component in the existing app:
   - Add an import and include the component in [frontend/src/App.vue](frontend/src/App.vue) (simple approach) or add a route in [frontend/src/router/index.js](frontend/src/router/index.js). *No backend changes required.*
3. Add a tiny helper `frontend/src/utils/api.js` (or `composables/useApi.js`) to centralize calls to:
   - `POST /api/import` with JSON body
   - `GET /api/export?filename=NAME`
   This keeps component code minimal and is optional but recommended.
4. Update `frontend/package.json` dev script instructions if needed (usually not necessary). Ensure `frontend` dev server proxies `/api` to backend, or rely on same-origin when running backend on same host/port. (Check `vite.config.js` if a proxy is desired.)
5. Manual verification steps (see "Verification").

**Relevant files**
- [frontend/src/App.vue](frontend/src/App.vue) — mount the new component.
- [frontend/src/router/index.js](frontend/src/router/index.js) — optional route registration.
- [frontend/src/components/JsonImportExport.vue](frontend/src/components/JsonImportExport.vue) — new component to create.
- [frontend/src/utils/api.js](frontend/src/utils/api.js) — optional helper to create.
- [backend/modules/importer/controller.js](backend/modules/importer/controller.js) — endpoint used for `POST /api/import`.
- [backend/modules/export/controller.js](backend/modules/export/controller.js) — endpoint used for `GET /api/export`.

**Verification**
1. From repository root, run backend and frontend concurrently (examples):

   - Start backend:

     npm --prefix backend install
     npm --prefix backend run start

   - Start frontend:

     npm --prefix frontend install
     npm --prefix frontend run dev

2. In the browser, open the app page containing the component.
3. Paste a sample JSON into the textarea (e.g., `{ "name": "test", "value": 42 }`) and click `Import`. Expect 201 response and a small success message.
4. Use the returned or chosen filename in the `filename` input and click `Fetch`. Expect the saved JSON to be displayed.
5. Try invalid JSON in the textarea — component should show a parse error and not call the API.

**Decisions & Assumptions**
- Use simple `fetch` (no external HTTP client) to keep dependencies minimal.
- The backend endpoints described in the repo (`/api/import`, `/api/export`) are available and CORS is enabled; no auth required.
- The `filename` parameter will match the importer/exporter expectations (basename without path). If `ALLOW_OVERWRITE=false`, repeated imports with the same filename may return 409; frontend will surface that error.

**Further Considerations**
1. Proxy config: If frontend dev server runs on a different port, add a proxy in `vite.config.js` to forward `/api` to the backend to avoid CORS issues during development. Option A: rely on existing CORS on backend (already enabled). Option B: add proxy for cleaner dev UX.
2. UX: Consider adding JSON schema validation server-side if you need stricter checks.


