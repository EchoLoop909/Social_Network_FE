import axios from "axios";
import { BE_URL } from "../config";

// Client riêng cho auth (login/register/logout là endpoint public, không cần Bearer)
const authClient = axios.create({
  baseURL: BE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "auth_tokens";

/* ============ Quản lý token trong localStorage ============ */
export function getStoredTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveTokens(tokens) {
  if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

/* ============ Bóc thông báo lỗi từ envelope BE ============ */
// BE trả: { isError, Errors: { code, message } }  hoặc lỗi validate: { errors: [...] }
function extractError(err, fallback) {
  const d = err?.response?.data;
  if (!d) return err?.message || fallback;
  if (d.Errors && d.Errors.message) return d.Errors.message;
  if (typeof d.Errors === "string") return d.Errors;
  if (Array.isArray(d.errors)) {
    return d.errors.map((e) => e.message || e.defaultMessage || e).join(", ");
  }
  if (typeof d.errors === "string") return d.errors;
  return fallback;
}

/* ============ API ============ */

/** Đăng nhập: POST /auth/login -> { access_token, refresh_token, expires_in, token_type, user } */
export async function loginApi({ username, password }) {
  try {
    const res = await authClient.post("/auth/login", { username, password });
    return res.data.Object;
  } catch (err) {
    throw new Error(extractError(err, "Đăng nhập thất bại"));
  }
}

/** Đăng ký: POST /auth/register -> { userId, status, message } */
export async function registerApi(payload) {
  try {
    const res = await authClient.post("/auth/register", payload);
    return res.data.Object;
  } catch (err) {
    throw new Error(extractError(err, "Đăng ký thất bại"));
  }
}

/** Đăng xuất: POST /auth/logout (thu hồi phiên tại Keycloak). Bỏ qua lỗi. */
export async function logoutApi(refreshToken) {
  try {
    await authClient.post("/auth/logout", { refreshToken });
  } catch {
    /* ignore */
  }
}
