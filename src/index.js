import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";

// Import instance từ file chung
import keycloak from "./keycloak"; 
import App from "./App"; 

const root = ReactDOM.createRoot(document.getElementById("root"));

// 1. Hiển thị màn hình chờ ban đầu
root.render(
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
    <h3>Đang kết nối tới máy chủ đăng nhập...</h3>
  </div>
);

// 2. Khởi tạo Keycloak
keycloak
  .init({
    onLoad: "login-required", // Bắt buộc đăng nhập
    checkLoginIframe: false,
    pkceMethod: "S256",
  })
  .then((authenticated) => {
    if (authenticated) {
      console.log("Keycloak Login OK!");
      
      // Render App khi đã có Token
      root.render(
        // <React.StrictMode> // Có thể tạm tắt StrictMode nếu thấy log bị lặp 2 lần
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <BrowserRouter>
                {/* Truyền keycloak đã login thành công vào App */}
                <App keycloak={keycloak} />
              </BrowserRouter>
            </PersistGate>
          </Provider>
        // </React.StrictMode>
      );
    } else {
      // Trường hợp hiếm: login-required thất bại thì reload
      window.location.reload();
    }
  })
  .catch((error) => {
    console.error("Lỗi Keycloak:", error);
    root.render(
       <div style={{ color: 'red', padding: 20, textAlign: 'center' }}>
         <h3>Lỗi kết nối tới Keycloak Server (localhost:8080).</h3>
         <p>Vui lòng kiểm tra: Keycloak đã bật chưa? Đã cấu hình Web Origins chưa?</p>
       </div>
    );
  });