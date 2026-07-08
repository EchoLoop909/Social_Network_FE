import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { toggleLike } from "../../store/feedSlice";

export default function PostCard({ post }) {
  const dispatch = useDispatch();

  const author = post._author || post.author || {
    id: "unknown",
    username: "Người dùng",
    avatar: "https://via.placeholder.com/40",
  };

  const [isLiked, setIsLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [saved, setSaved] = useState(post.savedByMe);

  const handleLike = () => {
    setIsLiked((v) => !v);
    setLikeCount((prev) => (!isLiked ? prev + 1 : prev - 1));
    dispatch(toggleLike(post.id));
  };

  const timeAgo = post.ts ? new Date(post.ts).toLocaleString("vi-VN") : "";
  const avatar =
    author.avatar || `https://ui-avatars.com/api/?name=${author.username}`;

  return (
    <article className="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg mb-6">
      {/* HEADER */}
      <div className="flex items-center px-3 py-2.5">
        <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-400 mr-3 shrink-0">
          <img
            src={avatar}
            alt={author.username}
            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black"
            onError={(e) => {
              e.target.src = "https://ui-avatars.com/api/?name=" + author.username;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm">{author.username}</span>
          <span className="text-gray-400 text-xs ml-2">• {timeAgo}</span>
        </div>
        <button className="text-gray-600 dark:text-gray-300 hover:opacity-60">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* ẢNH */}
      {post.images && post.images.length > 0 && (
        <div className="w-full bg-black flex items-center justify-center overflow-hidden aspect-square border-y border-gray-100 dark:border-neutral-800">
          <img
            src={post.images[0]}
            alt="Nội dung bài viết"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ACTIONS */}
      <div className="px-3 pt-2">
        <div className="flex justify-between mb-2">
          <div className="flex gap-4">
            <button onClick={handleLike} className="hover:opacity-60 transition">
              <Heart
                size={26}
                className={isLiked ? "fill-red-500 text-red-500" : ""}
              />
            </button>
            <button className="hover:opacity-60 transition">
              <MessageCircle size={26} />
            </button>
            <button className="hover:opacity-60 transition">
              <Send size={26} />
            </button>
          </div>
          <button
            onClick={() => setSaved((v) => !v)}
            className="hover:opacity-60 transition"
          >
            <Bookmark size={26} className={saved ? "fill-current" : ""} />
          </button>
        </div>

        <div className="font-semibold text-sm mb-1">{likeCount} lượt thích</div>

        <div className="text-sm">
          <span className="font-semibold mr-2">{author.username}</span>
          <span>{post.caption}</span>
        </div>

        {post.comments && post.comments.length > 0 ? (
          <div className="text-gray-500 text-sm mt-1 cursor-pointer">
            Xem tất cả {post.comments.length} bình luận
          </div>
        ) : (
          <div className="text-gray-400 text-xs mt-1">Chưa có bình luận nào</div>
        )}

        <div className="text-gray-400 text-[11px] uppercase mt-2 pb-3">
          {timeAgo}
        </div>
      </div>
    </article>
  );
}
