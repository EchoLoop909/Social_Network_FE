const KC_AUTH_URL =
  "http://10.2.22.23:8080/realms/master/protocol/openid-connect/auth";
const CLIENT_ID = "SocialNetwork";
const REDIRECT_URI = `${window.location.origin}/`;

function genState() {
  return Math.random().toString(36).slice(2);
}

export function buildLoginUrl() {
  const state = genState();
  sessionStorage.setItem("oauth_state", state);
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid",
    state,
  });
  return `${KC_AUTH_URL}?${p.toString()}`;
}

export async function exchangeCodeForToken({ code, state }) {
  const saved = sessionStorage.getItem("oauth_state");
  if (!saved || saved !== state) {
    throw new Error("Invalid OAuth state");
  }
  const res = await fetch("/api/exchange-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state }),
  });
  if (!res.ok) throw new Error(await res.text());
  const tokens = await res.json();
  sessionStorage.removeItem("oauth_state");
  return tokens; // {access_token, refresh_token, ...}
}

export function getStoredTokens() {
  try {
    return JSON.parse(localStorage.getItem("auth_tokens") || "null");
  } catch {
    return null;
  }
}
