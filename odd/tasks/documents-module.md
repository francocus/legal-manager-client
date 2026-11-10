# documents-module — Documents module + AI case summary (frontend)

Feature branch: `feat/conexion-front`
Backend contract: `legal-manager-api` → `DocumentController` (`api/document`), schema as
in the TIF report (plantilla TIF).

## Goal

Consume the full .NET document module from the React SPA: list, download, upload and
soft-delete documents attached to a case, plus the AI-generated case summary with an
explicit keep-or-discard decision made by the user.

## Tasks

1. [ ] **documentsApi + DTO mapping** — `documentsApi.js` for the 8 endpoints
       (`GET /case/{id}` list, `GET /{id}`, `POST` upload multipart ≤10MB,
       `GET /{id}/download`, `POST /case/{id}/generate-summary`,
       `PATCH /{id}/approve`, `PATCH /{id}/discard`, `DELETE /{id}`);
       `Documents.data.js` mapper (type labels, pending state, formatters);
       extend `httpClient` with FormData bodies and binary download.
2. [ ] **Documents section in CasePage** — panel listing the case documents
       (name, type, date, size, state), upload button + form (type + PDF file),
       download, delete; role-aware (client is read-only, backend hides pending
       AI drafts from clients), closed case handled through backend 409 messages.
3. [ ] **AI summary flow** — "Generar resumen con IA" (admin/lawyer), generating
       state, then draft review UI: Save (approve) / Discard; friendly 409
       (pending draft exists) and 502 (AI unavailable) toasts.
4. [~] **Verification** — build + lint green after each task and on the final
       tree. Live API run 2026-11-10 against the production Azure instance
       (`legalmanager-api-f4gqhqfsejdshrcm.chilecentral-01.azurewebsites.net`):
       27/28 PASS (the single FAIL was a harness assertion bug, later verdict
       manually confirmed the backend correct). Full evidence in Engram topic
       `live-api-test-2026-11-10`; re-runnable harness in
       `%TEMP%/lm_test_suite.py` (creates its own throwaway fixture, closes
       its case afterwards).

### Live-verified semantics
- Discard soft-deletes immediately (Active=false): discarded summaries
  disappear from list and by-id; delete-after-discard answers 404 by design.
- Approve/discard are single-shot (409 on a second review).
- Generate while a pending draft exists → 409 BEFORE the LLM (no quota burn).
- Clients: 403 on every write, pending drafts silently hidden (200 lists).
- Non-PDF → 400 plain-text "Solo se permiten archivos PDF."; oversize →
  400 ProblemDetails (10 MB); closed case upload → 409.

## Backend rules to honor

- Max one pending AI draft per case (generate returns 409 until reviewed).
- Pending AI drafts are hidden from clients by the backend (silent filter).
- AI document is reviewed once: approve → official; discard → rejected
  (Approved/ReviewedAt set).
- No document operations allowed on closed cases (backend 409 → message).

## Evidence

Task commence date: 2026-11-10
- Task 1 commit: 6d0b3c2
- Task 2 commit: bda33a6
- Task 3 commit: 28792fa
- Task 4 commit: none needed (no code changes; verify-level only)
