const AUTH_KEY = "auth";

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function decodeJwt(token) {
  // safe base64 decode without dependencies
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    // If token isn't a JWT or has no exp, treat as invalid on client.
    // (Optionally call a /auth/verify endpoint instead; see note below.)
    return false;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp > nowSec;
}

export function getValidAuthOrNull() {
  const auth = getAuth();
  if (!auth?.token) return null;
  return isTokenValid(auth.token) ? auth : null;
}
