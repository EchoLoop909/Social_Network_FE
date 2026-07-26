import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Loader2, Hash } from "lucide-react";
import PostCard from "../features/feed/PostCard";
import { getPostsByHashtag } from "../services/feedApi";
import { setHashtagPosts, appendHashtagPosts, clearHashtagPosts } from "../store/feedSlice";
import useInfiniteScroll from "../utils/useInfiniteScroll";

/**
 * Trang liệt kê bài viết theo hashtag (route /hashtag/:name), bấm vào #tag trong bài viết sẽ tới đây.
 * Danh sách bài đi qua Redux (feed.hashtagPosts) — nhờ vậy like/comment cập nhật ngay, không cần F5.
 */
export default function HashtagPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const posts = useSelector((s) => s.feed.hashtagPosts);
  const [nextCursor, setNextCursor] = useState(1);
  const [status, setStatus] = useState("loading"); // loading | succeeded | error

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    dispatch(clearHashtagPosts());
    (async () => {
      try {
        const { posts: p, nextCursor: nc } = await getPostsByHashtag(name, { cursor: 1 });
        if (!alive) return;
        dispatch(setHashtagPosts(p));
        setNextCursor(nc);
        setStatus("succeeded");
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => { alive = false; dispatch(clearHashtagPosts()); };
  }, [name, dispatch]);

  const moreRef = useInfiniteScroll(async () => {
    if (nextCursor == null || status === "loading") return;
    const { posts: p, nextCursor: nc } = await getPostsByHashtag(name, { cursor: nextCursor });
    dispatch(appendHashtagPosts(p));
    setNextCursor(nc);
  }, [name, nextCursor, status]);

  return (
    <div className="max-w-[600px] mx-auto pt-6 pb-16 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:opacity-70"
      >
        <ArrowLeft size={18} /> Quay lại
      </button>

      <div className="flex items-center gap-2 mb-6">
        <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
          <Hash size={20} />
        </div>
        <div>
          <div className="text-lg font-bold">#{name}</div>
          <div className="text-xs text-gray-500">{posts.length} bài viết{nextCursor != null ? "+" : ""}</div>
        </div>
      </div>

      {status === "loading" && posts.length === 0 && (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-10">
          <Loader2 className="animate-spin" size={16} /> Đang tải...
        </div>
      )}
      {status === "error" && (
        <div className="text-center text-red-500 py-10">Lỗi tải bài viết</div>
      )}
      {status === "succeeded" && posts.length === 0 && (
        <div className="text-center text-gray-400 py-10">Chưa có bài viết nào dùng hashtag này</div>
      )}

      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      <div ref={moreRef} className="h-10" />
    </div>
  );
}
