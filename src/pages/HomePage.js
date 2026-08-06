import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Send } from "lucide-react";
import FeedList from "../features/feed/FeedList";
import StoryBar from "../features/stories/StoryBar";
import { logoutFromKeycloak } from "../services/authApi";
import { getUserById } from "../services/profileApi";
import { getSuggestions, sendFriendRequest } from "../services/followershipApi";

// Avatar: có ảnh -> dùng ảnh; chưa có -> avatar chữ viết tắt theo tên/username (vd "Hiệp Hoàng" -> "HH").
const avatarSrc = (u) =>
  u?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || u?.username || "User")}`;

function displayName(u) {
  if (!u) return "";
  return (
    u.name ||
    [u.lastname, u.firstname].filter(Boolean).join(" ").trim() ||
    u.username ||
    ""
  );
}

export default function HomePage() {
  const reduxUser = useSelector((s) => s.auth.user);
  const navigate = useNavigate();

  const meId = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem("auth_tokens") || "null");
      if (!t?.access_token) return null;
      return JSON.parse(atob(t.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))?.sub || null;
    } catch {
      return null;
    }
  }, []);

  const [me, setMe] = useState(reduxUser || null);
  const [suggestions, setSuggestions] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // Lấy thông tin tài khoản đang đăng nhập (nếu redux chưa có) + gợi ý kết bạn
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!reduxUser && meId) {
          const u = await getUserById(meId);
          if (alive) setMe(u);
        }
        const sug = await getSuggestions();
        if (alive) setSuggestions(Array.isArray(sug) ? sug.slice(0, 5) : []);
      } catch {
        /* ignore */
      }
    })();
    return () => { alive = false; };
  }, [reduxUser, meId]);

  // Nút đăng xuất cho TRANG USER — độc lập với LogoutButton.js (admin), không dùng chung hàm.
  // Đúng luồng Authorization Code Flow (RP-Initiated Logout, OIDC): chỉ gọi
  // keycloak.logout() để điều hướng sang endpoint logout của Keycloak — nơi duy nhất
  // thực sự huỷ phiên SSO. KHÔNG dispatch(logout())/clearTokens() ở đây: đổi Redux state
  // ngay lập tức khiến route guard chuyển sang <Login/>, rồi Login.js tự gọi
  // keycloak.login() — 2 lệnh điều hướng trình duyệt gần như cùng lúc khiến cái sau huỷ
  // cái trước (logout() bị abort giữa chừng, tài khoản coi như CHƯA đăng xuất thật ở
  // Keycloak). index.js sẽ tự đồng bộ lại state qua keycloak.init({onLoad:"check-sso"})
  // khi trang thực sự tải lại.
  const handleLogout = () => {
    logoutFromKeycloak();
  };

  // Sau khi gửi lời mời, gọi lại gợi ý (BE đã ghi "đã gợi ý" nên tự loại người vừa gửi +
  // những người vừa hiện trong 24h qua) để làm ĐẦY LẠI đủ 5 người, thay vì chỉ xóa 1 rồi thôi.
  const onFollow = async (u) => {
    setBusyId(u.id);
    try {
      await sendFriendRequest(u.id);
    } catch {
      setBusyId(null);
      return; // gửi lời mời thất bại -> giữ nguyên danh sách, không xóa người này
    }
    try {
      const sug = await getSuggestions();
      setSuggestions(Array.isArray(sug) ? sug.slice(0, 5) : []);
    } catch {
      // Gửi lời mời đã thành công, chỉ lỗi lúc gọi lại gợi ý -> ít nhất xóa người vừa gửi.
      setSuggestions((prev) => prev.filter((x) => x.id !== u.id));
    } finally {
      setBusyId(null);
    }
  };

  const user = reduxUser || me;

  return (
    <div className="w-full flex justify-center gap-8 px-4">
      {/* ===== Cột feed (giữa) ===== */}
      <div className="w-full max-w-[630px] pt-6 pb-16">
        <StoryBar meId={meId} me={user} />
        <FeedList />
      </div>

      {/* ===== Sidebar phải (IG-style) ===== */}
      <aside className="hidden lg:block w-[320px] pt-8 shrink-0">
        <div className="sticky top-8">
          {/* Tài khoản đang đăng nhập + đăng xuất */}
          {user && (
            <div className="flex items-center gap-4 mb-6">
              <Link to="/u/me">
                <img
                  src={avatarSrc(user)}
                  alt={user.username}
                  className="w-14 h-14 rounded-full object-cover border"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to="/u/me" className="font-semibold text-sm truncate block hover:underline">
                  {user.username}
                </Link>
                <div className="text-gray-400 text-sm truncate">{displayName(user)}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-blue-500 hover:text-blue-700"
              >
                Đăng xuất
              </button>
            </div>
          )}

          {/* Gợi ý kết bạn */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">Gợi ý cho bạn</span>
            <Link to="/friends" className="text-xs font-semibold hover:opacity-70">Xem tất cả</Link>
          </div>

          <div className="flex flex-col gap-3">
            {suggestions.length === 0 ? (
              <div className="text-xs text-gray-400">Chưa có gợi ý nào.</div>
            ) : (
              suggestions.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Link to={`/u/${u.id}`}>
                    <img
                      src={avatarSrc(u)}
                      alt={u.username}
                      className="w-11 h-11 rounded-full object-cover border"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/u/${u.id}`} className="font-semibold text-sm truncate block hover:underline">
                      {u.username}
                    </Link>
                    <div className="text-gray-400 text-xs truncate">{displayName(u)}</div>
                  </div>
                  <button
                    onClick={() => onFollow(u)}
                    disabled={busyId === u.id}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
                  >
                    {busyId === u.id && <Loader2 size={12} className="animate-spin" />} Theo dõi
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <footer className="text-[11px] text-gray-400 mt-8 leading-4">
            © 2026 SOCIAL NETWORK
          </footer>
        </div>
      </aside>

      {/* ===== Pill "Tin nhắn" nổi góc dưới phải ===== */}
      <button
        onClick={() => navigate("/inbox")}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-lg rounded-full pl-4 pr-5 py-2.5 hover:shadow-xl transition"
      >
        <Send size={20} />
        <span className="font-semibold text-sm">Tin nhắn</span>
      </button>
    </div>
  );
}
