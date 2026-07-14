import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import FeedList from "../features/feed/FeedList";
import { logout } from "../store/authSlice";
import { getStoredTokens, clearTokens, logoutApi } from "../services/authApi";

export default function HomePage() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const tokens = getStoredTokens();
    if (tokens?.refresh_token) {
      await logoutApi(tokens.refresh_token);
    }
    clearTokens();
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const displayName =
    user &&
    (((user.lastname || "") + " " + (user.firstname || "")).trim() ||
      user.name ||
      "");
  const avatar =
    user?.photo ||
    `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=random`;

  return (
    <div className="flex justify-center gap-14 px-4 max-w-[935px] mx-auto">
      {/* ===== Cột feed (giữa) ===== */}
      <div className="w-full max-w-[630px] pt-6 pb-16">
        <FeedList />
      </div>

      {/* ===== Sidebar phải ===== */}
      <aside className="hidden lg:block w-[320px] pt-10 shrink-0">
        <div className="sticky top-10">
          {/* Thẻ người dùng hiện tại */}
          {user && (
            <div className="flex items-center gap-4 mb-6">
              <img
                src={avatar}
                alt={user.username}
                className="w-14 h-14 rounded-full object-cover border"
                onError={(e) => {
                  e.target.src =
                    "https://ui-avatars.com/api/?name=" + (user.username || "U");
                }}
              />
              <div className="flex-1 min-w-0">
                <Link
                  to="/u/me"
                  className="font-semibold text-sm truncate block hover:underline"
                >
                  {user.username}
                </Link>
                <div className="text-gray-400 text-sm truncate">
                  {displayName}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-blue-500 hover:text-blue-700"
              >
                Đăng xuất
              </button>
            </div>
          )}

          {/* Footer */}
          <footer className="text-[11px] text-gray-400 mt-8 space-y-3 leading-4">
           
          </footer>
        </div>
      </aside>
    </div>
  );
}
