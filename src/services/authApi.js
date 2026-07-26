// Đăng nhập/đăng ký/đăng xuất đều qua Keycloak (Authorization Code Flow).
// File này chỉ còn: quản lý token trong localStorage.
// Logic đăng xuất (gọi keycloak.logout) nằm riêng ở từng nơi dùng (LogoutButton.js cho
// trang admin, HomePage.js cho trang user) — không dùng chung 1 hàm nữa.

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

/* ============ Thông báo "tài khoản đã bị khóa" — hiện lại ở trang /login ===
   sessionStorage (không phải localStorage) vì chỉ cần sống sót qua đúng 1 lần
   redirect sang Keycloak rồi quay lại /login, không cần tồn tại lâu dài. */
const ACCOUNT_LOCKED_KEY = "account_locked_message";

export function setAccountLockedMessage(message) {
  sessionStorage.setItem(ACCOUNT_LOCKED_KEY, message || "Tài khoản của bạn đã bị khóa.");
}

/** Đọc thông báo (nếu có) rồi xoá luôn — chỉ hiện đúng 1 lần. */
export function consumeAccountLockedMessage() {
  const msg = sessionStorage.getItem(ACCOUNT_LOCKED_KEY);
  if (msg) sessionStorage.removeItem(ACCOUNT_LOCKED_KEY);
  return msg;
}
