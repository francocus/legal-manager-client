# email-verification-reset — Email confirmation + password recovery (cross-repo)

Backend branch: `legal-manager-api` → `feat/email-verificacion-recuperacion` (from latest master)
Frontend branch: `legal-manager-client` → `feat/conexion-front`

## Goal

Accounts cannot exist "just like that": every created account starts
`EmailConfirmed=false` and receives a confirmation email. Login is gated with a
dedicated 403 until confirmation. Email links open frontend routes that call the
API and hand straight off to the session start. Password recovery via email link
(session-change + email proof). Email sending via MailKit (SMTP) with a
logging fallback when SMTP is not configured. Admin rescue endpoint to confirm
by id (lost emails / automated QA).

## Backend tasks (legal-manager-api)

1. [x] Pull master + feature branch `feat/email-verificacion-recuperacion`.
2. [x] Domain: `User.EmailConfirmed` + hashed confirm/reset tokens (sha256 hex,
       single-use, expiry UTC) + entity methods; `FieldLengths.EmailTokenHash`.
3. [x] Application: `EmailOptions` (FrontBaseUrl, paths, lifetimes),
       `IAccountEmailService`, `AccountConfirmationService`
       (StartForNewUser/Notify/ConfirmByToken/ForgotPassword/ResetPassword/Resend),
       four request DTOs, login gate (`ForbiddenException` → 403) and
       AccountLinkException for invalid/expired links.
4. [x] Presentation: anonymous `POST /api/auth/confirm-email`,
       `/forgot-password`, `/reset-password`, `/resend-confirmation`; admin
       `PATCH /api/user/{id}/confirm-email` (idempotent); seed admin inserted
       confirmed; DI wiring lenient-at-boot.
5. [x] Infrastructure: MailKit 4.13.0 sender (plain+HTML, Spanish copy,
       no-Host fallback logs the link/token), token lookups in repository, EF
       migration `20261110222004_AddEmailVerificationAndReset` (5 columns ×
       Clients/Lawyers/Admins [TPC] + backfill `EmailConfirmed = 1` in Up only).
6. [x] README section (endpoints, config keys, fallback warning).
7. [x] `dotnet build` green (writer ran; re-verified before commit).

Note: repo has no test project (team tests live/via Postman); verification is
live-API-based per workflow, see task below.

## Frontend tasks (legal-manager-client)

1. [x] `accountApi.js`: confirmEmail / forgotPassword / resetPassword /
       resendConfirmation, all `auth:false`.
2. [x] Routes (public, next to login/register): `/recuperar-contrasena`,
       `/restablecer-contrasena`, `/confirmar-email`, `/registro-pendiente`.
3. [x] ForgotPassword screen (email form → pending-notice, 1h link expiry note).
4. [x] ResetPassword screen (token param, equal-password check, success arena
       → auto-redirect to login, error → "Pedir otro correo").
5. [x] ConfirmEmail screen (auto-confirm by token; success → auto-redirect
       login; error → resend-by-email block).
6. [x] RegisterPending screen (post-registration: "Confirmá tu email", resend
       button, link to login); Register.jsx no longer auto-logs in.
7. [x] Login.jsx: "¿Olvidaste tu contraseña?" link.
8. [x] lint + build green (writer ran; re-verified before commit).

## Verification plan (equal to previous live run)

- Regression: same 28-check documents suite against production Azure.
- New-flows probes with pre/post-deploy awareness (404 while the backend branch
  is not deployed; full happy path incl. 403-gated login, admin rescue confirm
  and reset once deployed).
- Evidence recorded in Engram (`live-api-test-email-flows`).

## Evidence

- Backend code commit: 596c284 (feat: agregar verificación de email y recuperación de contraseña)
- Frontend code commit: 2147822 (feat: add email confirmation and password recovery flows)
- Live re-run: see Engram topic `live-api-test-email-flows` (deploy-aware run)
