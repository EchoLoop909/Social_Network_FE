import { useState } from "react";
import { useDispatch } from "react-redux";
import { ThumbsUp } from "lucide-react";
import ReactionPicker from "./ReactionPicker";
import { reactionByType } from "./reactions";
import { reactPost, unreactPost } from "../../store/feedSlice";

/**
 * Nút thả cảm xúc cho 1 bài viết (6 loại: LIKE/HEART/HAHA/WOW/SAD/ANGRY).
 * - Hover (desktop) HOẶC bấm/chạm nút -> hiện bảng 6 cảm xúc.
 * - Chọn 1 cảm xúc -> thả; chọn lại đúng cảm xúc đang có -> bỏ.
 * Đọc trạng thái từ `post` (item trong store), ghi qua thunk reactPost / unreactPost.
 */
export default function ReactionButton({ post, showLabel = true }) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const current = post.myReaction ? reactionByType[post.myReaction] : null;

  const pick = (type) => {
    setOpen(false);
    if (type === post.myReaction) {
      dispatch(unreactPost({ postId: post.id })); // chọn lại cảm xúc cũ -> bỏ thích
    } else {
      dispatch(reactPost({ postId: post.id, reactionType: type }));
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {open && (
        <>
          {/* Nền trong suốt: chạm/bấm ra ngoài là đóng bảng cảm xúc (dành cho mobile) */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ReactionPicker onPick={pick} />
        </>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 hover:opacity-70 transition ${current ? current.color + " font-semibold" : ""}`}
      >
        {current ? (
          <span className="text-xl leading-none">{current.emoji}</span>
        ) : (
          <ThumbsUp size={22} />
        )}
        {showLabel && <span className="text-sm">{current ? current.label : "Thích"}</span>}
      </button>
    </div>
  );
}
