import { useNavigate } from "react-router-dom";
import { searchUsers } from "../services/followershipApi";

// Bắt cùng lúc @mention (chữ, số, dấu chấm, gạch dưới) và #hashtag (chữ có dấu, số, gạch dưới).
const TOKEN = /(@[A-Za-z0-9._]+|#[\p{L}0-9_]+)/gu;

/**
 * Hiển thị text, biến @username thành link đỏ -> chuyển sang trang cá nhân của user đó,
 * và #hashtag thành link xanh -> chuyển sang trang /hashtag/:name liệt kê bài viết cùng thẻ.
 */
export default function MentionText({ text, className = "" }) {
  const navigate = useNavigate();
  if (text == null) return null;

  const goUser = async (username, e) => {
    e.stopPropagation();
    try {
      const list = await searchUsers(username);
      const u = list.find((x) => (x.username || "").toLowerCase() === username.toLowerCase()) || list[0];
      if (u) navigate(`/u/${u.id}`);
    } catch { /* ignore */ }
  };

  const goHashtag = (name, e) => {
    e.stopPropagation();
    navigate(`/hashtag/${encodeURIComponent(name.toLowerCase())}`);
  };

  const parts = String(text).split(TOKEN);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith("@") && p.length > 1) {
          return (
            <span key={i} onClick={(e) => goUser(p.slice(1), e)} className="text-red-500 cursor-pointer hover:underline">
              {p}
            </span>
          );
        }
        if (p.startsWith("#") && p.length > 1) {
          return (
            <span key={i} onClick={(e) => goHashtag(p.slice(1), e)} className="text-blue-500 cursor-pointer hover:underline">
              {p}
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
