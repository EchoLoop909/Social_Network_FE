import { useNavigate } from "react-router-dom";
import { searchUsers } from "../services/followershipApi";

/**
 * Hiển thị text, biến @username thành link xanh -> bấm vào chuyển sang trang cá nhân của user đó.
 * Vì route hồ sơ dùng id, khi bấm sẽ tra username -> id rồi điều hướng.
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

  const parts = String(text).split(/(@[A-Za-z0-9._]+)/g);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith("@") && p.length > 1 ? (
          <span key={i} onClick={(e) => goUser(p.slice(1), e)} className="text-red-500 cursor-pointer hover:underline">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
}
