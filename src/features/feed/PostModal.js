import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { X, MessageCircle, Loader2, Repeat2, MoreHorizontal, Pin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import MediaCarousel from "./MediaCarousel";
import CommentSection from "./CommentSection";
import ReactionButton from "./ReactionButton";
import ReactionsModal from "./ReactionsModal";
import SharePostDialog from "./SharePostDialog";
import EditPostDialog from "./EditPostDialog";
import Modal from "../../components/Modal";
import { getSharers } from "../../services/postApi";
import { deletePostThunk } from "../../store/feedSlice";
import { formatNumber } from "../../utils/formatNumber";
import { timeAgo } from "../../utils/timeAgo";
import MentionText from "../../utils/MentionText";

/**
 * Modal chi tiết bài viết.
 * - Có ảnh/video: 2 cột kiểu Instagram (media trái, thông tin + bình luận phải).
 * - Chỉ có text: 1 cột rộng kiểu Facebook.
 * Bấm "lượt thích" -> xem ai thả cảm xúc (phân theo loại); bấm "chia sẻ" -> xem ai đã chia sẻ.
 */
export default function PostModal({ post, open, onClose, currentUserId, onDeleted }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [sharers, setSharers] = useState(null); // { loading, users } | null
  const [openShare, setOpenShare] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const hasMedia = !!(post && post.media && post.media.length > 0);
  const author = post?.author || { username: "Người dùng", name: "", avatar: "" };
  const avatarName = (author.name && author.name.trim()) ? author.name.trim() : author.username;
  const isOwner = !!(currentUserId && post && post.authorId === currentUserId);
  const shareDisabled = !!(post && post.isShared && post.originalLost);

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm("Xoá bài viết này?")) return;
    try {
      await dispatch(deletePostThunk(post.id)).unwrap();
      onClose?.();
      onDeleted?.(post.id);
    } catch (e) {
      alert("Xoá bài thất bại: " + e);
    }
  };

  const openSharers = async () => {
    setSharers({ loading: true, users: [] });
    try {
      const users = await getSharers(post.id);
      setSharers({ loading: false, users: Array.isArray(users) ? users : [] });
    } catch { setSharers({ loading: false, users: [] }); }
  };

  return (
    <>
      <AnimatePresence>
        {open && post && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className={`relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full h-[86vh] flex overflow-hidden ${hasMedia ? "max-w-4xl" : "max-w-xl"}`}
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 text-white/90 sm:text-gray-500 hover:opacity-70"
              >
                <X size={24} />
              </button>

              {/* Cột media (chỉ khi có ảnh/video) */}
              {hasMedia && (
                <div className="hidden sm:flex flex-1 bg-black">
                  <MediaCarousel media={post.media} className="h-full" />
                </div>
              )}

              {/* Cột thông tin + bình luận */}
              <div className={`w-full flex flex-col ${hasMedia ? "sm:w-[380px] shrink-0" : ""}`}>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
                  <img
                    src={author.avatar}
                    alt={author.username}
                    className="w-9 h-9 rounded-full object-cover cursor-pointer"
                    onClick={() => post.authorId && navigate(`/u/${post.authorId}`)}
                    onError={(e) => {
                      e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(avatarName);
                    }}
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{author.username}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      {post.isPinned && <Pin size={12} className="text-gray-400" />}
                      {timeAgo(post.ts)}
                    </div>
                  </div>

                  {/* Menu chủ bài: Chỉnh sửa, Xoá bài */}
                  {isOwner && (
                    <div className="ml-auto mr-6 relative">
                      <button onClick={() => setMenuOpen((v) => !v)} className="p-1 hover:opacity-60"><MoreHorizontal size={20} /></button>
                      {menuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                          <div className="absolute right-0 top-7 z-20 w-32 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 text-sm">
                            <button
                              onClick={() => { setMenuOpen(false); setOpenEdit(true); }}
                              className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700"
                            >
                              Chỉnh sửa
                            </button>
                            <button onClick={handleDelete} className="block w-full text-left px-3 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700">Xoá bài</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Nội dung */}
                <div className="px-4 pt-3 shrink-0">
                  {hasMedia && (
                    <div className="sm:hidden mb-3 rounded-lg overflow-hidden aspect-square">
                      <MediaCarousel media={post.media} className="h-full" />
                    </div>
                  )}
                  {post.caption && (
                    hasMedia ? (
                      <p className="text-sm whitespace-pre-wrap break-words mb-2">
                        <span className="font-semibold mr-2">{author.username}</span>
                        <MentionText text={post.caption} />
                      </p>
                    ) : (
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words mb-3">
                        <MentionText text={post.caption} />
                      </p>
                    )
                  )}
                </div>

                {/* Hàng thao tác + thống kê */}
                <div className="px-4 py-2 border-y border-gray-200 dark:border-neutral-800 flex items-center gap-4 shrink-0">
                  <ReactionButton post={post} />
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MessageCircle size={20} /> {formatNumber(post.commentCount || 0)}
                  </span>
                  <button
                    onClick={() => !shareDisabled && setOpenShare(true)}
                    disabled={shareDisabled}
                    title={shareDisabled ? "Bài đã mất bài gốc, không thể chia sẻ" : "Chia sẻ"}
                    className="hover:opacity-60 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Repeat2 size={22} />
                  </button>
                  <div className="ml-auto flex items-center gap-3 text-sm">
                    <button onClick={() => setReactionsOpen(true)} className="font-semibold hover:underline">
                      {formatNumber(post.likes || 0)} lượt thích
                    </button>
                    {post.shareCount > 0 && (
                      <button onClick={openSharers} className="text-gray-500 hover:underline">
                        {formatNumber(post.shareCount)} chia sẻ
                      </button>
                    )}
                  </div>
                </div>

                {/* Bình luận */}
                <div className="flex-1 overflow-hidden px-4 py-2">
                  <CommentSection post={post} currentUserId={currentUserId} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Xem ai thả cảm xúc (phân theo loại) */}
      <ReactionsModal open={reactionsOpen} onClose={() => setReactionsOpen(false)} targetId={post?.id} />

      {/* Chia sẻ (repost) bài viết */}
      {openShare && post && <SharePostDialog open={openShare} onClose={() => setOpenShare(false)} post={post} />}

      {/* Chỉnh sửa bài viết */}
      {openEdit && post && <EditPostDialog open={openEdit} onClose={() => setOpenEdit(false)} post={post} />}

      {/* Xem ai đã chia sẻ */}
      {sharers && (
        <Modal open onClose={() => setSharers(null)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Lượt chia sẻ</h2>
            <button onClick={() => setSharers(null)} className="text-gray-500 hover:opacity-70"><X size={20} /></button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {sharers.loading ? (
              <div className="flex items-center gap-2 text-gray-500 py-6 justify-center"><Loader2 size={16} className="animate-spin" /> Đang tải...</div>
            ) : sharers.users.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">Chưa có ai.</div>
            ) : (
              sharers.users.map((u) => (
                <button key={u.id} onClick={() => { setSharers(null); navigate(`/u/${u.id}`); }}
                  className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-left">
                  <img src={u.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.username || "U")}`} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{u.username}</div>
                    {u.name && <div className="text-xs text-gray-500 truncate">{u.name}</div>}
                  </div>
                </button>
              ))
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
