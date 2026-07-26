import "./polyfillGlobal"; // PHẢI đứng đầu tiên (trước khi sockjs-client được nạp)
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import App from "./App";
import keycloak from "./services/keycloak";
import { setTokens, setCredentials } from "./store/authSlice";
import { instance } from "./services/api";
import { setAccountLockedMessage } from "./services/authApi";

// Đổ token từ Keycloak vào ĐÚNG "hợp đồng" cũ của app: localStorage.auth_tokens + redux auth.tokens.
// Nhờ vậy interceptor Bearer (api.js), RBAC (utils/auth.js) và route guard (App.js) không phải đổi logic.
function syncKeycloakTokens() {
  if (keycloak.authenticated && keycloak.token) {
    const tokens = {
      access_token: keycloak.token,
      refresh_token: keycloak.refreshToken,
      expires_in: keycloak.tokenParsed?.exp
        ? keycloak.tokenParsed.exp - Math.floor(Date.now() / 1000)
        : undefined,
      token_type: "Bearer",
    };
    localStorage.setItem("auth_tokens", JSON.stringify(tokens));
    store.dispatch(setTokens(tokens));
  } else {
    localStorage.removeItem("auth_tokens");
    store.dispatch(setTokens(null));
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));

function render() {
  root.render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}

// Authorization Code Flow + PKCE: init trước khi render để biết đã đăng nhập hay chưa.
// check-sso: nếu đã có phiên ở Keycloak thì lấy token luôn, chưa thì để null (guard đá về /login).
keycloak
  .init({ onLoad: "check-sso", pkceMethod: "S256", checkLoginIframe: false })
  .then(async () => {
    syncKeycloakTokens();
    // Tự làm mới access_token trước khi hết hạn (thay cho endpoint /auth/refresh cũ).
    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then(syncKeycloakTokens)
        .catch(() => keycloak.logout({ redirectUri: window.location.origin + "/login" }));
    };
    // Đã đăng nhập -> gọi /auth/me: BE tự cấp phát hồ sơ vào DB nếu chưa có (vd đăng nhập Google),
    // đồng thời chặn tài khoản bị khóa. Đưa user vào redux để UI dùng ngay.
    if (keycloak.authenticated) {
      try {
        const res = await instance.get("/auth/me");
        if (res?.Object) store.dispatch(setCredentials(res.Object));
      } catch (e) {
        console.error("/auth/me lỗi:", e);
        // Tài khoản bị khóa (403) -> lưu lại thông báo để /login hiện ra, rồi đăng xuất.
        if (e?.response?.status === 403) {
          setAccountLockedMessage(e?.response?.data?.Errors?.message);
          keycloak.logout({ redirectUri: window.location.origin + "/login", logoutMethod: "POST" });
          return;
        }
      }
    }
    render();
  })
  .catch((e) => {
    console.error("Keycloak init lỗi:", e);
    render(); // vẫn render để hiển thị trang đăng nhập
  });
