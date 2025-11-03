import { useDispatch, useSelector } from "react-redux";
import { toggleLike, toggleSave, submitComment } from "../../store/feedSlice";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Avatar from "../../components/Avatar";
import { timeAgo } from "../../utils/timeAgo";
import { formatNumber } from "../../utils/formatNumber";

export default function PostCard({ post }) {
  const users = useSelector((s) => s.feed.users);
  const author = users.find((u) => u.id === post.authorId);
  const dispatch = useDispatch();
  const [showFull, setShowFull] = useState(false);
  const [anim, setAnim] = useState(false);
  const [comment, setComment] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const media = (() => {
    if (Array.isArray(post?.images) && post.images.length > 0)
      return post.images;
    if (Array.isArray(post?.media) && post.media.length > 0)
      return post.media.map((m) => m.url);
    // nếu post không có ảnh -> vẫn trả về 1 ảnh mặc định
    return [`https://picsum.photos/id/237/900/900`];
  })();

  // Danh sách ảnh fallback cứng (đảm bảo luôn hiển thị)
  const fallbacks = [
    "https://picsum.photos/id/237/900/900",
    "https://picsum.photos/id/238/900/900",
    "https://picsum.photos/id/239/900/900",
    "https://picsum.photos/id/240/900/900",
    "https://picsum.photos/id/241/900/900",
  ];

  // Giữ src hiện tại và chuyển sang fallback nếu lỗi
  const [imgSrc, setImgSrc] = useState(media[currentIndex] || fallbacks[0]);

  // cập nhật lại khi đổi ảnh/slide
  useEffect(() => {
    setImgSrc(
      media[currentIndex] || fallbacks[currentIndex % fallbacks.length]
    );
  }, [currentIndex, media]);

  const like = () => {
    setAnim(true);
    dispatch(toggleLike(post.id));
    setTimeout(() => setAnim(false), 500);
  };

  const save = () => dispatch(toggleSave(post.id));
  const submit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    dispatch(submitComment({ postId: post.id, content: comment.trim() }));
    setComment("");
  };

  return (
    <article className="card rounded-lg mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar src={author?.avatar} size={36} />
          <div className="text-sm">
            <div className="font-semibold">{author?.username}</div>
            <div className="muted text-[12px]">{timeAgo(post.ts)}</div>
          </div>
        </div>
        <button aria-label="More">
          <MoreHorizontal />
        </button>
      </div>

      {/* Media */}

      <div className="relative" onDoubleClick={like}>
        <img
          src={imgSrc}
          alt="post"
          className="w-full object-cover max-h-[600px] bg-gray-100 dark:bg-neutral-800"
          loading="lazy"
          onError={() => setImgSrc(fallbacks[currentIndex % fallbacks.length])}
        />

        {media.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((i) => i - 1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {currentIndex < media.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((i) => i + 1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
              >
                <ChevronRight size={18} />
              </button>
            )}
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1">
              {media.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === currentIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-4">
          <button aria-label="Like" onClick={like}>
            <Heart
              className={post.likedByMe ? "fill-insta-red text-insta-red" : ""}
            />
          </button>
          <button aria-label="Comment">
            <MessageCircle />
          </button>
          <button aria-label="Share">
            <Send />
          </button>
          <button onClick={save} className="ml-auto" aria-label="Save">
            <Bookmark
              className={post.savedByMe ? "fill-black dark:fill-white" : ""}
            />
          </button>
        </div>
        <div className="font-semibold text-sm mt-2">
          {formatNumber(post.likes)} lượt thích
        </div>
        <div className="text-sm mt-1">
          <span className="font-semibold mr-2">{author?.username}</span>
          {showFull ? post.caption : post.caption?.slice(0, 120)}
          {post.caption?.length > 120 && (
            <button
              className="text-gray-500 ml-1"
              onClick={() => setShowFull((v) => !v)}
            >
              {showFull ? "Thu gọn" : "Xem thêm"}
            </button>
          )}
        </div>

        {/* Comments */}
        <div className="text-sm muted mt-2">
          Xem {post.comments.length} bình luận
        </div>
        <ul className="text-sm mt-2 space-y-1">
          {post.comments.slice(-2).map((c) => (
            <li key={c.id}>
              <span className="font-semibold mr-2">
                {users.find((u) => u.id === c.userId)?.username}
              </span>
              {c.content}
            </li>
          ))}
        </ul>
      </div>

      <form
        onSubmit={submit}
        className="px-4 py-3 border-t border-gray-200 dark:border-neutral-800 flex gap-3"
      >
        <input
          className="flex-1 bg-transparent outline-none text-sm"
          placeholder="Thêm bình luận..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button
          className="text-insta-primary text-sm font-semibold"
          disabled={!comment.trim()}
        >
          Đăng
        </button>
      </form>
    </article>
  );
}
