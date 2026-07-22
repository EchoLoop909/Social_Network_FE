import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Loader2 } from "lucide-react";
import Modal from "../../components/Modal";
import * as likeApi from "../../services/likeApi";
import { reactionByType } from "./reactions";
import { formatNumber } from "../../utils/formatNumber";

/**
 * Modal xem AI đã thả cảm xúc, PHÂN THEO LOẠI (Tất cả / 👍 / ❤️ / 😂 ...) — kiểu Facebook.
 * Dùng chung cho bài ở feed lẫn trang cá nhân. Tự gọi /like/list theo targetId.
 */
export default function ReactionsModal({ open, onClose, targetType = "POST", targetId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState([]);        // [{ user, reactionType }]
  const [summary, setSummary] = useState({});    // { LIKE: n, HEART: n, ... }
  const [tab, setTab] = useState("ALL");

  useEffect(() => {
    if (!open || !targetId) return;
    let alive = true;
    setLoading(true);
    setTab("ALL");
    likeApi
      .getReactions(targetType, targetId, 1, 100)
      .then((d) => {
        if (!alive) return;
        setLikes(Array.isArray(d.likes) ? d.likes : []);
        setSummary(d.reactionSummary || {});
      })
      .catch(() => {
        if (alive) { setLikes([]); setSummary({}); }
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [open, targetType, targetId]);

  if (!open) return null;

  const total = Object.values(summary).reduce((a, b) => a + Number(b || 0), 0);
  const types = Object.keys(summary).filter((t) => Number(summary[t]) > 0);
  const shown = tab === "ALL" ? likes : likes.filter((l) => l.reactionType === tab);

  const goUser = (id) => { if (id) { onClose?.(); navigate(`/u/${id}`); } };

  return (
    <Modal open onClose={onClose}>
      {/* Tabs theo loại cảm xúc */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <TabBtn active={tab === "ALL"} onClick={() => setTab("ALL")}>
            Tất cả <span className="ml-1 text-gray-500">{formatNumber(total)}</span>
          </TabBtn>
          {types.map((t) => (
            <TabBtn key={t} active={tab === t} onClick={() => setTab(t)}>
              <span className="text-lg leading-none">{reactionByType[t]?.emoji || "❤️"}</span>
              <span className="ml-1 text-gray-500">{formatNumber(summary[t])}</span>
            </TabBtn>
          ))}
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 hover:opacity-70 shrink-0">
          <X size={18} />
        </button>
      </div>

      {/* Danh sách người thả cảm xúc */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500 py-8">
            <Loader2 size={16} className="animate-spin" /> Đang tải...
          </div>
        ) : shown.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">Chưa có ai.</div>
        ) : (
          shown.map((l) => {
            const u = l.user || {};
            const emoji = reactionByType[l.reactionType]?.emoji;
            return (
              <button
                key={(u.id || "") + l.reactionType}
                onClick={() => goUser(u.id)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-left"
              >
                <div className="relative shrink-0">
                  <img
                    src={u.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.username || "U")}`}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover bg-gray-200"
                  />
                  {emoji && (
                    <span className="absolute -bottom-1 -right-1 text-sm bg-white dark:bg-neutral-900 rounded-full leading-none">
                      {emoji}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{u.username || "Người dùng"}</div>
                  {u.name && <div className="text-xs text-gray-500 truncate">{u.name}</div>}
                </div>
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}

const TabBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 ${
      active ? "border-blue-500 text-blue-600" : "border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-t"
    }`}
  >
    {children}
  </button>
);
