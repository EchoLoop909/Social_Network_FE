import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Send } from "lucide-react";
import FeedList from "../features/feed/FeedList";
import { logout } from "../store/authSlice";
import { getStoredTokens, clearTokens, logoutApi } from "../services/authApi";
import { getUserById } from "../services/profileApi";
import { getSuggestions, sendFriendRequest } from "../services/followershipApi";

const AVATAR_FALLBACK = "https://via.placeholder.com/56?text=?";

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
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const meId = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem("auth_tokens") || "null");
      if (!t?.access_token) return null;
      return JSON.parse(atob(t.access_token.split(".")[1]))?.sub || null;
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

  const handleLogout = async () => {
    const tokens = getStoredTokens();
    if (tokens?.refresh_token) await logoutApi(tokens.refresh_token);
    clearTokens();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const onFollow = async (u) => {
    setBusyId(u.id);
    try {
      await sendFriendRequest(u.id);
      setSuggestions((prev) => prev.filter((x) => x.id !== u.id));
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  const user = reduxUser || me;

  return (
    <div className="w-full flex justify-center gap-8 px-4">
      {/* ===== Cột feed (giữa) ===== */}
      <div className="w-full max-w-[630px] pt-6 pb-16">
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
                  src={user.photo || AVATAR_FALLBACK}
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
                      src={u.photo || AVATAR_FALLBACK}
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
