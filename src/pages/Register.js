import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerApi, loginApi, saveTokens } from "../services/authApi";
import { setTokens, setCredentials } from "../store/authSlice";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 1. Đăng ký
      const payload = {
        username: values.username,
        email: values.email,
        password: values.password,
        name: values.name,
        firstname: values.firstname,
        lastname: values.lastname,
        surname: values.surname || "",
      };
      await registerApi(payload);
      message.success("Đăng ký thành công! Đang đăng nhập...");

      // 2. Tự đăng nhập luôn cho mượt (tài khoản đã ACTIVE ngay, không cần xác thực email)
      try {
        const data = await loginApi({
          username: values.username,
          password: values.password,
        });
        const tokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          token_type: data.token_type,
        };
        saveTokens(tokens);
        dispatch(setTokens(tokens));
        if (data.user) dispatch(setCredentials(data.user));
        navigate("/", { replace: true });
      } catch {
        // Nếu auto-login lỗi thì về trang đăng nhập
        navigate("/login", { replace: true });
      }
    } catch (e) {
      message.error(e.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4 py-8">
      <div className="w-full max-w-[380px] flex flex-col gap-3">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg px-10 py-8">
          <h1 className="text-4xl font-serif italic text-center mb-2 select-none">
            Instagram
          </h1>
          <p className="text-center text-gray-500 font-semibold text-[15px] mb-6">
            Đăng ký để xem ảnh và video từ bạn bè.
          </p>

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Nhập email" },
                { type: "email", message: "Email không đúng định dạng" },
              ]}
            >
              <Input size="large" placeholder="Email" autoComplete="email" />
            </Form.Item>

            <Form.Item
              name="name"
              rules={[{ required: true, message: "Nhập tên hiển thị" }]}
            >
              <Input size="large" placeholder="Tên hiển thị" />
            </Form.Item>

            <div className="flex gap-2">
              <Form.Item
                name="firstname"
                className="flex-1"
                rules={[{ required: true, message: "Nhập họ" }]}
              >
                <Input size="large" placeholder="Họ" />
              </Form.Item>
              <Form.Item
                name="lastname"
                className="flex-1"
                rules={[{ required: true, message: "Nhập tên" }]}
              >
                <Input size="large" placeholder="Tên" />
              </Form.Item>
            </div>

            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Nhập tên đăng nhập" },
                { min: 3, message: "Tên đăng nhập tối thiểu 3 ký tự" },
              ]}
            >
              <Input size="large" placeholder="Tên đăng nhập" autoComplete="username" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Nhập mật khẩu" },
                { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
              ]}
            >
              <Input.Password
                size="large"
                placeholder="Mật khẩu"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Nhập lại mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Mật khẩu nhập lại không khớp"));
                  },
                }),
              ]}
            >
              <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                Đăng ký
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg py-5 text-center">
          <span className="text-sm">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-blue-500 font-semibold">
              Đăng nhập
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
