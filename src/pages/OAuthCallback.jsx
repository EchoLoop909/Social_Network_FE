// import { useEffect, useRef } from "react";
// import { useDispatch } from "react-redux";
// import { useNavigate, useLocation } from "react-router-dom";
// import { exchangeCodeForToken, fetchMe } from "../store/authSlice";
// import { Spin } from "antd";

// export default function OAuthCallback() {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const ranOnce = useRef(false);

//   useEffect(() => {
//     // Tránh React.StrictMode gọi 2 lần
//     if (ranOnce.current) return;
//     ranOnce.current = true;

//     const params = new URLSearchParams(location.search);
//     const code = params.get("code");

//     if (code) {
//       dispatch(exchangeCodeForToken(code))
//         .unwrap()
//         .then(() => dispatch(fetchMe())) // Lấy token xong thì lấy thông tin user
//         .then(() => navigate("/"))       // Xong xuôi mới về trang chủ
//         .catch((err) => {
//           console.error("Lỗi đăng nhập:", err);
//           navigate("/login");
//         });
//     } else {
//       navigate("/login");
//     }
//   }, []);

//   return (
//     <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
//       <Spin size="large" tip="Đang xử lý đăng nhập..." />
//     </div>
//   );
// }