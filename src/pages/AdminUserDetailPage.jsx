import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Unlock, Trash2, Eye, ShieldAlert } from "lucide-react";
import AdminSidebar from "../features/admin/AdminSidebar";
import {
  getAdminUserById,
  getAdminUserPosts,
  suspendUser,
  activateUser,
} from "../services/adminApi";
import { USER_STATUS } from "../services/data/adminSeed";
import { StatusPill, USER_STATUS_META, NotInDbTag, fmtDate, fmtDateTime, shortId } from "../features/admin/adminUi";

const POST_TYPE_LABEL = { IMAGE: "Ảnh", VIDEO: "Video", CAROUSEL: "Nhiều ảnh/video", TEXT: "Chỉ chữ" };
const POST_STATUS_META = {
  PUBLISHED: { label: "Đã đăng", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  PENDING_REVIEW: { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  FLAGGED: { label: "Bị gắn cờ", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

// ============================================================================
// TRANG "CHI TIẾT NGƯỜI DÙNG" (/admin/users/:userId)
//
// Nguồn dữ liệu THẬT — không mock:
//   - Thông tin tài khoản: GET /auth/getuser?userId=...
//   - Danh sách bài viết:  GET /post/GetlistPost?userId=...&pageSize=100
// Khóa/mở khóa dùng lại đúng suspendUser/activateUser đã nối PUT /auth/toggle-status.
//
// Đã bỏ khỏi thiết kế mẫu vì KHÔNG có trong DB (User entity không có các cột này):
// "Xác minh email", "Số điện thoại", "Quyền" (role), "Đăng nhập cuối", "Địa chỉ IP cuối".
// Không có nút "Chỉnh sửa" — admin không được sửa hồ sơ user (chỉ khóa/mở khóa).
// Cột bảng bài viết "Danh mục"/"Lượt xem" trong ảnh mẫu cũng không có trong DB — thay
// bằng "Loại bài" (post_type, có thật) và bỏ hẳn cột "Lượt xem".
// ============================================================================
export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const loadUser = useCallback(() => {
    setLoadingUser(true);
    getAdminUserById(userId)
      .then((u) => {
        setUser(u);
        setNotFound(!u);
      })
      .finally(() => setLoadingUser(false));
  }, [userId]);

  const loadPosts = useCallback(() => {
    setLoadingPosts(true);
    getAdminUserPosts(userId)
      .then(({ items, totalElements }) => {
        setPosts(items);
        setTotalPosts(totalElements);
      })
      .finally(() => setLoadingPosts(false));
  }, [userId]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => { loadPosts(); }, [loadPosts]);

  const isSuspended = user?.status === USER_STATUS.SUSPENDED;

  const toggleLock = async () => {
    setBusy(true);
    try {
      if (isSuspended) await activateUser(userId);
      else await suspendUser(userId);
      loadUser();
    } finally {
      setBusy(false);
    }
  };

  // Lượt thích nhận: tính từ reactionCount thật của các bài đã tải (tối đa 100 bài gần nhất).
  const likesReceived = posts.reduce((sum, p) => sum + (p.reactionCount || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-black">
      <AdminSidebar active="users" onSelect={() => navigate("/admin")} />

      <div className="flex-1 min-w-0">
        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center gap-3 px-6">
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            <ArrowLeft size={16} /> Người dùng
          </button>
          <span className="text-gray-300 dark:text-neutral-700">/</span>
          <span className="text-sm text-gray-700 dark:text-neutral-200 font-medium">Chi tiết người dùng</span>
        </header>

        <main className="p-6 space-y-6">
          {loadingUser ? (
            <div className="py-16 text-center text-gray-400 text-sm">Đang tải…</div>
          ) : notFound ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Không tìm thấy người dùng này (có thể đã bị xóa hoặc ID không đúng).
            </div>
          ) : (
            <>
              {/* Hồ sơ + thông tin tài khoản */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
                <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={user.photo || "https://via.placeholder.com/80"}
                      alt={user.username}
                      className="w-20 h-20 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</span>
                        <StatusPill meta={USER_STATUS_META} value={user.status} />
                      </div>
                      <div className="text-gray-400 text-sm">@{user.username}</div>
                      <div className="text-gray-400 text-xs mt-1">
                        Tham gia ngày {fmtDateTime(user.creationDate)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {isSuspended ? (
                      <button
                        disabled={busy}
                        onClick={toggleLock}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <Unlock size={15} /> Mở khóa tài khoản
                      </button>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={toggleLock}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                      >
                        <Lock size={15} /> Khóa tài khoản
                      </button>
                    )}
                    <button
                      disabled
                      title="Chưa hỗ trợ — chưa nối API xóa tài khoản ở trang quản trị"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-400 dark:border-neutral-700 cursor-not-allowed"
                    >
                      <Trash2 size={15} /> Xóa tài khoản
                    </button>
                  </div>

                  {/* Thống kê nhanh */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-100 dark:border-neutral-800 p-3 text-center">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {loadingPosts ? "…" : totalPosts.toLocaleString("vi-VN")}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">Bài viết</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 dark:border-neutral-800 p-3 text-center">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {loadingPosts ? "…" : likesReceived.toLocaleString("vi-VN")}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">Lượt thích nhận</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 dark:border-neutral-800 p-3 text-center">
                      <div className="mt-1"><NotInDbTag text="Chưa có" /></div>
                      <div className="text-xs text-gray-400 mt-1">Báo cáo</div>
                    </div>
                  </div>
                </div>

                {/* Thông tin tài khoản — chỉ field thật có trong bảng users */}
                <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
                  <div className="font-semibold text-gray-900 dark:text-white mb-3">Thông tin tài khoản</div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-400">ID người dùng</dt>
                      <dd className="font-mono text-xs text-gray-600 dark:text-neutral-300 text-right" title={user.id}>
                        {shortId(user.id)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-400">Email</dt>
                      <dd className="text-gray-700 dark:text-neutral-200 text-right break-all">{user.email}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-400">Trạng thái tài khoản</dt>
                      <dd><StatusPill meta={USER_STATUS_META} value={user.status} /></dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-400">Riêng tư</dt>
                      <dd className="text-gray-700 dark:text-neutral-200">{user.isPrivate ? "Riêng tư" : "Công khai"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-400">Ngày tham gia</dt>
                      <dd className="text-gray-700 dark:text-neutral-200">{fmtDate(user.creationDate)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Danh sách bài viết */}
              <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-neutral-800 font-semibold text-gray-900 dark:text-white">
                  <ShieldAlert size={16} className="text-gray-400" />
                  Danh sách bài viết ({loadingPosts ? "…" : totalPosts})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-neutral-400 border-b border-gray-100 dark:border-neutral-800">
                        <th className="py-3 px-4 font-medium">#</th>
                        <th className="py-3 px-4 font-medium">Nội dung</th>
                        <th className="py-3 px-4 font-medium">Loại bài</th>
                        <th className="py-3 px-4 font-medium">Trạng thái</th>
                        <th className="py-3 px-4 font-medium">Lượt thích</th>
                        <th className="py-3 px-4 font-medium">Bình luận</th>
                        <th className="py-3 px-4 font-medium">Ngày tạo</th>
                        <th className="py-3 px-4 font-medium text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingPosts ? (
                        <tr><td colSpan={8} className="py-10 text-center text-gray-400">Đang tải…</td></tr>
                      ) : posts.length === 0 ? (
                        <tr><td colSpan={8} className="py-10 text-center text-gray-400">Người dùng này chưa có bài viết nào.</td></tr>
                      ) : (
                        posts.map((p, idx) => (
                          <tr key={p.id} className="border-b border-gray-50 dark:border-neutral-800/60 hover:bg-gray-50/70 dark:hover:bg-neutral-800/40">
                            <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                            <td className="py-3 px-4 max-w-[320px] truncate text-gray-800 dark:text-neutral-200" title={p.text || ""}>
                              {p.text || <span className="text-gray-400 italic">(không có chữ)</span>}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-neutral-300">
                              {POST_TYPE_LABEL[p.postType] || p.postType}
                            </td>
                            <td className="py-3 px-4"><StatusPill meta={POST_STATUS_META} value={p.status} /></td>
                            <td className="py-3 px-4 text-gray-600 dark:text-neutral-300">{p.reactionCount ?? 0}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-neutral-300">{p.commentCount ?? 0}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-neutral-300">{fmtDateTime(p.createTime)}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => navigate(`/post/${p.id}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
                              >
                                <Eye size={14} /> Xem
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
