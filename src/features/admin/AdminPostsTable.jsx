import { useCallback, useEffect, useState } from "react";
import { Eye, Trash2, EyeOff, Heart, MessageCircle, Repeat2, Info } from "lucide-react";
import { getAdminPosts, deletePost } from "../../services/adminApi";
import { POST_STATUS } from "../../services/data/adminSeed";
import { VelaStatusPill, VELA_POST_STATUS_META, TableShell, SectionHeader, Avatar, fmtDateTime } from "./adminUi";
import PostDetailModal from "./PostDetailModal";

const POST_TYPE_LABEL = { IMAGE: "Ảnh", VIDEO: "Video", CAROUSEL: "Nhiều ảnh/video", TEXT: "Chỉ chữ" };

const STATUS_CHIPS = [
  { value: "", label: "Tất cả" },
  { value: POST_STATUS.PUBLISHED, label: "Hiển thị" },
  { value: POST_STATUS.PENDING_REVIEW, label: "Chờ duyệt" },
  { value: POST_STATUS.FLAGGED, label: "Đã ẩn" },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vela-brand/40 ${
        active
          ? "bg-vela-brand text-white border-vela-brand"
          : "bg-white text-neutral-600 border-vela-border hover:bg-vela-bg"
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminPostsTable() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getAdminPosts({ pageSize: 100 })
      .then((res) => setPosts(res.content))
      .catch((e) => setLoadError(e?.response?.data?.Errors?.message || e?.message || "Không tải được danh sách bài viết"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doDelete = async (p) => {
    if (!window.confirm("Xoá vĩnh viễn bài viết này? Không thể hoàn tác.")) return;
    setBusyId(p.id);
    try {
      await deletePost(p.id);
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) {
      alert(e?.response?.data?.Errors?.message || e?.message || "Xoá thất bại");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = status ? posts.filter((p) => p.status === status) : posts;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Bài viết"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_CHIPS.map((c) => (
              <Chip key={c.value} active={status === c.value} onClick={() => setStatus(c.value)}>
                {c.label}
              </Chip>
            ))}
          </div>
        }
      />

 

      <TableShell>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-vela-border bg-vela-bg/40">
              <th className="py-3 px-4 font-medium">Tác giả</th>
              <th className="py-3 px-4 font-medium">Nội dung</th>
              <th className="py-3 px-4 font-medium">Ngày đăng</th>
              <th className="py-3 px-4 font-medium">Tương tác</th>
              <th className="py-3 px-4 font-medium">Trạng thái</th>
              <th className="py-3 px-4 font-medium text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-neutral-400">
                  Đang tải…
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-vela-danger text-sm">
                  Không tải được danh sách bài viết: {loadError}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-neutral-400">
                  Không có bài viết nào khớp bộ lọc.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-vela-border/60 hover:bg-vela-bg/40">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={p.user?.photo}
                        name={[p.user?.firstname, p.user?.lastname].filter(Boolean).join(" ") || p.user?.username}
                        size={32}
                      />
                      <div className="min-w-0">
                        <div className="text-neutral-800 font-medium truncate">
                          {[p.user?.firstname, p.user?.lastname].filter(Boolean).join(" ") || p.user?.username}
                        </div>
                        <div className="text-xs text-neutral-400 font-mono truncate">{p.user?.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-[280px]">
                    <div className="truncate text-neutral-700" title={p.text || ""}>
                      {p.text || <span className="italic text-neutral-400">({POST_TYPE_LABEL[p.postType] || p.postType})</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-500 font-mono text-xs">{fmtDateTime(p.createTime)}</td>
                  <td className="py-3 px-4 text-neutral-600">
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="inline-flex items-center gap-1"><Heart size={13} /> {p.reactionCount ?? 0}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle size={13} /> {p.commentCount ?? 0}</span>
                      <span className="inline-flex items-center gap-1"><Repeat2 size={13} /> {p.shareCount ?? 0}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <VelaStatusPill meta={VELA_POST_STATUS_META} value={p.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedPost(p)}
                        title="Xem chi tiết bài viết"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border border-vela-border hover:bg-vela-bg"
                      >
                        <Eye size={14} /> Xem
                      </button>
                      <button
                        disabled
                        title="Chỉ ẩn được qua xử lý báo cáo ở tab Báo cáo"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border border-dashed border-vela-border text-neutral-400 cursor-not-allowed"
                      >
                        <EyeOff size={14} /> Ẩn
                      </button>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => doDelete(p)}
                        title="Xoá bài viết"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-vela-danger text-white hover:bg-vela-danger/90 disabled:opacity-50"
                      >
                        <Trash2 size={14} /> Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
}
