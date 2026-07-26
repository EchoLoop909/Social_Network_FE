import { useEffect, useRef, useState } from "react";
import keycloak from "../services/keycloak";
import { consumeAccountLockedMessage } from "../services/authApi";

// Không có giao diện trung gian: vào /login là redirect NGAY sang Keycloak —
// TRỪ KHI vừa bị khóa tài khoản (real-time hoặc phát hiện lúc /auth/me), lúc đó
// dừng lại hiện thông báo trước, người dùng tự bấm mới quay lại đăng nhập.
// Trang đăng nhập Keycloak có sẵn: nhập tài khoản, nút Google, và link "Register" (bật User registration).
export default function Login() {
  const redirected = useRef(false);
  const [lockedMessage, setLockedMessage] = useState(() => consumeAccountLockedMessage());

  useEffect(() => {
    if (lockedMessage) return; // đang hiện thông báo khóa tài khoản -> chưa redirect vội
    if (redirected.current) return; // tránh gọi 2 lần (StrictMode dev)
    redirected.current = true;
    keycloak.login({ redirectUri: window.location.origin });
  }, [lockedMessage]);

  if (lockedMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-red-500 text-lg font-semibold">Tài khoản đã bị khóa</div>
          <p className="text-gray-500 dark:text-neutral-400 text-sm">{lockedMessage}</p>
          <button
            onClick={() => setLockedMessage(null)}
            className="px-4 py-2 rounded-lg bg-[#1877f2] text-white text-sm font-semibold hover:bg-[#166fe0]"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
      <span className="text-gray-500 text-sm">Đang chuyển tới trang đăng nhập…</span>
    </div>
  );
}
