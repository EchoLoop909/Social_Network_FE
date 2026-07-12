import { X, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import MediaCarousel from "./MediaCarousel";
import CommentSection from "./CommentSection";
import ReactionButton from "./ReactionButton";
import { formatNumber } from "../../utils/formatNumber";
import { timeAgo } from "../../utils/timeAgo";

/** Modal chi tiết bài viết: media bên trái, thông tin + bình luận bên phải. */
export default function PostModal({ post, open, onClose, currentUserId }) {
  return (
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
            className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-4xl h-[86vh] flex overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 text-white/90 sm:text-gray-500 hover:opacity-70"
            >
              <X size={24} />
            </button>

            {/* Cột media */}
            {post.media && post.media.length > 0 && (
              <div className="hidden sm:flex flex-1 bg-black">
                <MediaCarousel media={post.media} className="h-full" />
              </div>
            )}

            {/* Cột thông tin + bình luận */}
            <div className="w-full sm:w-[380px] flex flex-col shrink-0">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
                <img
                  src={post.author.avatar}
                  alt={post.author.username}
                  className="w-9 h-9 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://ui-avatars.com/api/?name=" + post.author.username;
                  }}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{post.author.username}</div>
                  <div className="text-xs text-gray-400">{timeAgo(post.ts)}</div>
                </div>
              </div>

              {/* Caption + media (mobile) */}
              <div className="px-4 pt-3 shrink-0">
                {post.media && post.media.length > 0 && (
                  <div className="sm:hidden mb-3 rounded-lg overflow-hidden aspect-square">
                    <MediaCarousel media={post.media} className="h-full" />
                  </div>
                )}
                {post.caption && (
                  <p className="text-sm whitespace-pre-wrap break-words mb-2">
                    <span className="font-semibold mr-2">{post.author.username}</span>
                    {post.caption}
                  </p>
                )}
              </div>

              {/* Hàng thao tác */}
              <div className="px-4 py-2 border-y border-gray-200 dark:border-neutral-800 flex items-center gap-5 shrink-0">
                <ReactionButton post={post} />
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MessageCircle size={20} /> {formatNumber(post.commentCount || 0)}
                </span>
                <span className="ml-auto text-sm font-semibold">
                  {formatNumber(post.likes || 0)} lượt thích
                </span>
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
  );
}
