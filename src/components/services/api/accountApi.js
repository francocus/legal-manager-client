import { apiRequest } from '../http/httpClient';

// Anonymous account flows (email confirmation, password recovery and reset):
// every endpoint runs without a session, so all calls pass auth:false and a
// stale stored token can never trigger the expired-session redirect.
export const accountApi = {
  confirmEmail: (token) =>
    apiRequest('/auth/confirm-email', { method: 'POST', body: { token }, auth: false }),

  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),

  resetPassword: (token, newPassword) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: { token, newPassword }, auth: false }),

  resendConfirmation: (email) =>
    apiRequest('/auth/resend-confirmation', { method: 'POST', body: { email }, auth: false }),
};
