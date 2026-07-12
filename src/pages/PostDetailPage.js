import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PostCard from "../features/feed/PostCard";
import { getPostById } from "../services/feedApi";

/**
 * Trang chi tiết 1 bài viết (route /post/:id). Fetch bài theo id rồi render lại
 * bằng PostCard để đồng nhất giao diện với feed (bao gồm cả card share lồng — nên
 * bấm card gốc trong 1 bài share ở đây vẫn điều hướng tiếp sang /post/<id> gốc).
 */
export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | succeeded | notfound | error

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    (async () => {
      try {
        const p = await getPostById(id);
        if (!alive) return;
        setPost(p);
        setStatus(p ? "succeeded" : "notfound");
      } catch (e) {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

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
