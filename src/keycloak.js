import Keycloak from 'keycloak-js';

// Thông tin lấy từ Keycloak Server
const keycloakConfig = {
  url: 'http://localhost:8080', // Đường dẫn đến Keycloak Server của bạn
  realm: 'master',            // Tên Realm bạn đã tạo
  clientId: 'SocialNetwork-FE'   // Client ID bạn vừa cấu hình ở Bước 1
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;