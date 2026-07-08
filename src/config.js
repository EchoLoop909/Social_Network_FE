// URL của Backend (Spring Boot). Đổi qua biến môi trường REACT_APP_BE_URL nếu cần.
// BE mặc định chạy ở cổng 8888 (server.port trong application.properties).
export const BE_URL = process.env.REACT_APP_BE_URL || "http://localhost:8888";
