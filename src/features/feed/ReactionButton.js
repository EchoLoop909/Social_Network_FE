import { useState } from "react";
import { useDispatch } from "react-redux";
import { ThumbsUp } from "lucide-react";
import ReactionPicker from "./ReactionPicker";
import { reactionByType } from "./reactions";
import { reactPost, unreactPost } from "../../store/feedSlice";

/**
 * Nút thả cảm xúc cho 1 bài viết. Đọc trạng thái từ `post` (item trong store),
 * ghi qua thunk reactPost / unreactPost. Hover hiện bảng 6 cảm xúc.
 */
export default function ReactionButton({ post, showLabel = true }) {
  const dispatch = useDispatch();
  const [hover, setHover] = useState(false);
  const current = post.myReaction ? reactionByType[post.myReaction] : null;

  const pick = (type) => {
    setHover(false);
    dispatch(reactPost({ postId: post.id, reactionType: type }));
  };

  const toggleDefault = () => {
    if (post.myReaction) dispatch(unreactPost({ postId: post.id }));
    else dispatch(reactPost({ postId: post.id, reactionType: "LIKE" }));
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && <ReactionPicker onPick={pick} />}
      <button
        onClick={toggleDefault}
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
