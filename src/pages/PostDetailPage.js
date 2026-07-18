import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft } from "lucide-react";
import PostCard from "../features/feed/PostCard";
import { getPostById } from "../services/feedApi";
import { setViewingPost, clearViewingPost } from "../store/feedSlice";

/**
 * Trang chi tiết 1 bài viết (route /post/:id). Bài được nạp vào store (feed.viewing) rồi
 * render bằng PostCard — nhờ vậy like/comment (đi qua store) cập nhật NGAY, không cần F5.
 */
export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const post = useSelector((s) => s.feed.viewing);
  const [status, setStatus] = useState("loading"); // loading | succeeded | notfound | error

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    (async () => {
      try {
        const p = await getPostById(id);
        if (!alive) return;
        dispatch(setViewingPost(p || null));
        setStatus(p ? "succeeded" : "notfound");
      } catch (e) {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
      dispatch(clearViewingPost());
    };
  }, [id, dispatch]);

  return (
    <div className="max-w-[600px] mx-auto pt-6 pb-16 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:opacity-70"
      >
        <ArrowLeft size={18} /> Quay lại
      </button>

      {status === "loading" && (
        <div className="text-center text-gray-400 py-10">Đang tải...</div>
      )}
      {status === "notfound" && (
        <div className="text-center text-gray-400 py-10">Bài viết không tồn tại</div>
      )}
      {status === "error" && (
        <div className="text-center text-red-500 py-10">Lỗi tải bài viết</div>
      )}
      {status === "succeeded" && post && <PostCard post={post} />}
    </div>
  );
}
