import { useEffect, useState } from "react";
import { X, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { getRootComments } from "../../services/commentApi";
import { VelaStatusPill, VELA_POST_STATUS_META, Avatar, fmtDateTime } from "./adminUi";

// Modal chi tiết 1 bài viết — dùng chung cho tab "Bài viết" (AdminPostsTable) và
// bảng bài viết trong trang chi tiết người dùng (AdminUserDetailPage). Dữ liệu bài
// viết (media, số liệu tương tác) lấy từ chính dòng bảng đã tải; chỉ gọi thêm
// GET /comment/list để lấy danh sách bình luận gốc thật.
export default function PostDetailModal({ post, onClose }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingComments(true);
    getRootComments(post.id, 1, 20)
      .then((res) => {
        if (!cancelled) setComments(res.items);
      })
      .finally(() => {
        if (!cancelled) setLoadingComments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  const authorName = [post.user?.firstname, post.user?.lastname].filter(Boolean).join(" ") || post.user?.username;
  const media = Array.isArray(post.mediaList) ? post.mediaList : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-md border border-vela-border bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={post.user?.photo} name={authorName} size={40} />
            <div className="min-w-0">
              <div className="font-medium text-neutral-900 truncate">{authorName}</div>
              <div className="text-xs text-neutral-400 font-mono truncate">@{post.user?.username}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-vela-bg text-neutral-400 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-vela-brand/40 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <VelaStatusPill meta={VELA_POST_STATUS_META} value={post.status} />
          <span className="text-xs text-neutral-400 font-mono">{fmtDateTime(post.createTime)}</span>
        </div>

        {post.text && <div className="mt-3 text-sm text-neutral-800 whitespace-pre-wrap">{post.text}</div>}

        {media.length > 0 && (
          <div className={`mt-3 grid gap-1.5 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {media
              .slice()
              .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .map((m) =>
                m.mediaType === "VIDEO" ? (
                  <video key={m.id} src={m.mediaUrl} controls className="w-full rounded-md border border-vela-border bg-black" />
                ) : (
                  <img key={m.id} src={m.mediaUrl} alt="" className="w-full rounded-md border border-vela-border object-cover" />
                )
              )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 font-mono text-sm text-neutral-600 border-y border-vela-border py-2.5">
          <span className="inline-flex items-center gap-1.5"><Heart size={15} /> {post.reactionCount ?? 0}</span>
          <span className="inline-flex items-center gap-1.5"><MessageCircle size={15} /> {post.commentCount ?? 0}</span>
          <span className="inline-flex items-center gap-1.5"><Repeat2 size={15} /> {post.shareCount ?? 0}</span>
        </div>

        <div className="mt-3">
          <div className="text-xs font-medium text-neutral-500 mb-2">Bình luận</div>
          {loadingComments ? (
            <div className="text-sm text-neutral-400 py-4 text-center">Đang tải…</div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-neutral-400 py-4 text-center">Chưa có bình luận nào.</div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar
                    src={c.author.avatar?.includes("ui-avatars.com") ? null : c.author.avatar}
                    name={c.author.name || c.author.username}
                    size={28}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="rounded-md bg-vela-bg/60 px-3 py-1.5">
                      <div className="text-xs font-medium text-neutral-800">{c.author.name || c.author.username}</div>
                      <div className="text-sm text-neutral-700">{c.text}</div>
                    </div>
                    {c.replyCount > 0 && (
                      <div className="text-xs text-neutral-400 mt-1 ml-1">{c.replyCount} phản hồi</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
