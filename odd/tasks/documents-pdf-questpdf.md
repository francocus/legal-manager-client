# documents-pdf-questpdf — Real PDFs (QuestPDF), constancias, confirm-first (cross-repo)

Backend branch: `legal-manager-api` → `feat/documentos-questpdf` (from merged master `5d6f261`)
Frontend branch: `legal-manager-client` → `feat/documentos-confirmacion` (from merged main `4ba7a29`)
Linked prior merges: backend PR #21, front PR #2 (both merged).

## Goal

Honor the TIF contract end to end:

1. **QuestPDF is the real renderer** for system-generated documents (the TIF
   promised constancias/plantillas with QuestPDF; the AI only writes the summary
   text). Today `ResumenIA.pdf` is plain text with a .pdf name — fixed by
   rendering every generated document through QuestPDF.
2. **Nothing persists until the user confirms** (user rule): generation acts are
   previews. The AI summary (and the constancia) return the rendered PDF to the
   client; only an explicit save call persists the document (AI summaries are
   saved already reviewed: `Approved=true` + reviewer; constancias persist
   without review — non-AI generated).
3. **Constancias / plantillas fijas** (TIF casuística): new deterministic
   generator — no LLM — composing the case data into a formal constancia PDF.
4. **Manual document upload UX**: drag & drop zone + click-to-browse fallback in
   the documents panel. Only lawyer/admin write, client read-only (backend
   already enforces: `AdminOrLawyer` + case-ownership; client 403 everywhere).

## Backend tasks

1. [ ] QuestPDF package + `IPdfDocumentRenderer` (Infrastructure): summary + constancia templates.
2. [ ] Rework `generate-summary`: LLM text → render → return draft (pdfBase64 +
       summaryText) WITHOUT storage/db writes; drop the pending-draft 409 guard.
3. [ ] New `POST /api/document/generated` (AdminOrLawyer): validates the returned
       draft (case writable, not closed, %PDF- magic, ≤10 MB) and persists:
       AI → Approved=true/reviewer; constancia → Approved=null.
4. [ ] New `POST /api/document/case/{id}/generate-constancia`: deterministic
       constancia draft (no LLM), same non-persisting contract.
5. [ ] Remove the now-dead `PATCH approve` / `PATCH discard` endpoints and service
       paths (no server-side pending drafts exist anymore).
6. [ ] Migration: soft-cleanup of orphan pending AI drafts left by the old flow
       (`Approved IS NULL AND GeneratedByAI = 1 → discard`) so `isPendingReview`
       rows cannot linger.
7. [ ] `dotnet build` green.

## Frontend tasks

1. [ ] `documentsApi`: `generateAiSummary` (new draft shape), `generateConstancia`,
       `saveGenerated(payload)`; approve/discard methods removed.
2. [ ] `CaseDocuments` rework: draft preview card (inline PDF embed + Guardar /
       Descartar), generating states, drag & drop dropzone + browse fallback for
       upload (canWrite && !closed), client unchanged (read-only).
3. [ ] lint + build green.

## Verification plan

- Suite v3 (deploy-aware) after merge: regression documents block minus the
  removed approve/discard, plus new checks — draft generation returns %PDF bytes
  and does NOT create a row; save persists as approved; constancia flow; drag
  & drop is frontend-only UX (not API-testable).
- Evidence → Engram `live-api-test-questpdf`.

## Evidence

- Backend: branch `feat/documentos-questpdf` pushed, tip `981a479` (feat) on `ed4fe77`
  (chore MailKit 4.16.0 CVE fix + Polly 8.9.1, vulnerable count 0).
- Frontend: branch `feat/documentos-confirmacion` pushed, tip `564e8f3` (feat) on
  `7d16b3c` (chore bumps + compiler-lint adaptations; vite pinned 8.0.8).
- Test gate: live suite deployed **34/34 PASS** (documents regression + real email
  flows against prod).
- PRs: [api#23](https://github.com/francocus/legal-manager-api/pull/23) (Closes #22),
  [client#4](https://github.com/francocus/legal-manager-client/pull/4) (Closes #3).
- Pending: after both merges, re-run the suite detecting the new contract (draft
  %PDF-, no persistence on generate, save persists approved).
