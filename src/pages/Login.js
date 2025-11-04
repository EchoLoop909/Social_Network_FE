import { useEffect } from "react";
import { Spin } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { buildLoginUrl } from "../services/authApi";

export default function LoginPage() {
  const nav = useNavigate();
  const tokens = useSelector((s) => s.auth.tokens);

  useEffect(() => {
    if (tokens?.access_token) {
      nav("/", { replace: true });
      return;
    }
    window.location.replace(buildLoginUrl());
  }, [tokens, nav]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <Spin tip="Đang chuyển đến trang đăng nhập..." />
    </div>
  );
}
