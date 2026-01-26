import React from "react";
import { useDispatch } from "react-redux";
// Import action logout từ slice của m (nếu m đã tạo như hướng dẫn trước)
// import { logout } from "../store/authSlice"; 

const LogoutButton = ({ keycloak }) => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    // 1. Xóa token rác ở trình duyệt
    localStorage.removeItem("token");

    // 2. Xóa state user trong Redux (để giao diện cập nhật ngay lập tức)
    // dispatch(logout()); // Bỏ comment dòng này nếu m đã thêm reducer logout bên authSlice
    
    // 3. Gọi Keycloak logout
    // redirectUri: Sau khi logout xong, Keycloak sẽ đá về trang chủ (http://localhost:3000)
    if (keycloak) {
      keycloak.logout({
        redirectUri: window.location.origin 
      });
    } else {
        console.error("Keycloak instance bị null!");
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
    >
      Đăng xuất
    </button>
  );
};

export default LogoutButton;