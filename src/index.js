import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import Keycloak from "keycloak-js";
import App from "./App"; 

const keycloakConfig = {
  url: "http://localhost:8080", 
  realm: "master",            
  clientId: "Social_Network_FE", 
};

const keycloak = new Keycloak(keycloakConfig);

window.__store__ = store;
const root = ReactDOM.createRoot(document.getElementById("root"));

// --- MÀN HÌNH LOADING ĐƠN GIẢN KHI KHỞI TẠO ---
// Render tạm một cái loading trắng trong lúc chờ Keycloak check
root.render(
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
    Đang kết nối tới máy chủ đăng nhập...
  </div>
);

keycloak
  .init({
    onLoad: "login-required", // <--- DÒNG QUAN TRỌNG NHẤT: Bắt buộc dùng trang Login Keycloak
    pkceMethod: "S256",
    checkLoginIframe: false,
  })
  .then((authenticated) => {
    if (!authenticated) {
      // Thực tế dòng này ít khi chạy vì 'login-required' đã tự redirect rồi
      console.log("User chưa đăng nhập, đang redirect...");
    } else {
      console.log("Đã đăng nhập thành công!");
      
      // Lưu token để tiện dùng (hoặc cấu hình axios interceptor sau này)
      localStorage.setItem("token", keycloak.token);

      // --- CHỈ RENDER APP KHI ĐÃ CÓ AUTHENTICATION ---
      root.render(
        <React.StrictMode>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <BrowserRouter>
                {/* Truyền keycloak xuống để App dùng gọi API hoặc Logout */}
                <App keycloak={keycloak} />
              </BrowserRouter>
            </PersistGate>
          </Provider>
        </React.StrictMode>
      );
    }
  })
  .catch((error) => {
    console.error("Lỗi Keycloak:", error);
    root.render(
       <div style={{ color: 'red', padding: 20 }}>
         Lỗi kết nối Keycloak server. Hãy kiểm tra lại backend.
       </div>
    );
  });