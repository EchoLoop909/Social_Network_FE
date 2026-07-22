import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginApi, saveTokens } from "../services/authApi";
import { setTokens, setCredentials } from "../store/authSlice";
import { isAdminToken } from "../utils/auth";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = await loginApi(values);
      const tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
      };
      saveTokens(tokens);
      dispatch(setTokens(tokens));
      if (data.user) dispatch(setCredentials(data.user));
      message.success("Đăng nhập thành công");
      // RBAC: tài khoản có role ADMIN -> vào trang quản trị; còn lại -> trang chủ.
      navigate(isAdminToken(tokens.access_token) ? "/admin" : "/", { replace: true });
    } catch (e) {
      message.error(e.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="w-full max-w-[350px] flex flex-col gap-3">
        {/* Card chính */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg px-10 py-8">
          <h1 className="text-4xl font-serif italic text-center mb-8 select-none">
            Instagram
          </h1>

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: "Nhập tài khoản" }]}
            >
              <Input size="large" placeholder="Tên đăng nhập" autoComplete="username" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Nhập mật khẩu" }]}
            >
              <Input.Password
                size="large"
                placeholder="Mật khẩu"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Card đăng ký */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg py-5 text-center">
          <span className="text-sm">
            Bạn chưa có tài khoản?{" "}
            <Link to="/register" className="text-blue-500 font-semibold">
              Đăng ký
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
