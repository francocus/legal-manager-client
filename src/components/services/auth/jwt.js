// Minimal, dependency-free base64url JWT payload decoder.
const base64UrlToBytes = (segment) => {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

export const decodeJwtPayload = (token) => {
  try {
    const payload = String(token ?? '').split('.')[1];
    if (!payload) return null;
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));
  } catch {
    return null;
  }
};
