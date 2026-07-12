import axios from "axios";
import { BE_URL } from "../config";

// 1. Cấu hình Server
const instance = axios.create({
  baseURL: BE_URL, // URL Backend (mặc định http://localhost:8888)
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Hàm lấy Token chuẩn
const getAccessToken = () => {
  try {
    // Key này PHẢI KHỚP với key lưu bên App.js
    const tokens = localStorage.getItem("auth_tokens"); 
    if (tokens) {
      return JSON.parse(tokens).access_token;
    }
  } catch (error) {
    console.error("Lỗi parse token:", error);
  }
  return null;
};

// 3. Request Interceptor (Gửi đi)
instance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Response Interceptor (Nhận về)
instance.interceptors.response.use(
  (response) => {
    return response.data; // Trả về data luôn
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token hết hạn hoặc không hợp lệ!");
      localStorage.removeItem("auth_tokens");
      // window.location.href = "/"; // Refresh lại trang nếu cần
    }
    return Promise.reject(error);
  }
);

// Export instance để các service khác (postApi, likeApi, commentApi) tái dùng interceptor Bearer
export { instance };

export const api = {
  // API lấy bài viết
  getPosts: (pageIdx = 1, pageSize = 100) =>
    instance.get("/post/GetlistPost", {
      params: { pageIdx, pageSize },
    }),

  // API đăng ký user
  registerUser: (data) => instance.post("/auth/register", data),
};