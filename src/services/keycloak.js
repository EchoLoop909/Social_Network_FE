import Keycloak from "keycloak-js";

// Instance Keycloak dùng chung cho toàn app (Authorization Code Flow + PKCE).
// Đổi qua biến môi trường REACT_APP_KEYCLOAK_* nếu cần (mặc định khớp application.properties BE).
const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL || "http://localhost:8080",
  realm: process.env.REACT_APP_KEYCLOAK_REALM || "Social_Network",
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT || "Social_FE",
});

export default keycloak;
