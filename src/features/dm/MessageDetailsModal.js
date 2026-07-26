import { useState } from "react";
import Modal from "../../components/Modal";
import { avatarSrc } from "../../utils/avatar";
import { reactionByType } from "../feed/reactions";
import { X } from "lucide-react";

/**
 * Modal "Chi tiết" cho 1 tin nhắn trong DM — 2 tab: Đã xem (ai đọc tới tin này)
 * và Cảm xúc (ai thả cảm xúc gì). Nhận thẳng dữ liệu đã có sẵn ở DMLayout state
 * (seenBy từ readState, reactions từ getReactions("MESSAGE", id)) — không tự gọi API.
 */
export default function MessageDetailsModal({ open, onClose, seenBy = [], likes = [], reactionSummary = {} }) {
  const [tab, setTab] = useState("SEEN");

  if (!open) return null;

  const reactionTotal = Object.values(reactionSummary).reduce((a, b) => a + Number(b || 0), 0);

  return (
    <Modal open onClose={onClose}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <TabBtn active={tab === "SEEN"} onClick={() => setTab("SEEN")}>
            Đã xem <span className="ml-1 text-gray-500">{seenBy.length}</span>
          </TabBtn>
          <TabBtn active={tab === "REACTIONS"} onClick={() => setTab("REACTIONS")}>
            Cảm xúc <span className="ml-1 text-gray-500">{reactionTotal}</span>
          </TabBtn>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 hover:opacity-70 shrink-0">
          <X size={18} />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {tab === "SEEN" ? (
          seenBy.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">Chưa có ai đọc tin này.</div>
          ) : (
            seenBy.map((p) => (
              <div key={p.userId} className="w-full flex items-center gap-3 px-2 py-2">
                <img src={avatarSrc(p)} alt="" className="w-9 h-9 rounded-full object-cover bg-gray-200 shrink-0" />
                <div className="text-sm font-semibold truncate">{p.username || "Người dùng"}</div>
              </div>
            ))
          )
        ) : likes.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">Chưa có ai thả cảm xúc.</div>
        ) : (
          likes.map((l) => {
            const u = l.user || {};
            const emoji = reactionByType[l.reactionType]?.emoji;
            return (
              <div key={(u.id || "") + l.reactionType} className="w-full flex items-center gap-3 px-2 py-2">
                <div className="relative shrink-0">
                  <img src={avatarSrc({ photo: u.photo, username: u.username || u.name })} alt="" className="w-9 h-9 rounded-full object-cover bg-gray-200" />
                  {emoji && (
                    <span className="absolute -bottom-1 -right-1 text-sm bg-white dark:bg-neutral-900 rounded-full leading-none">
                      {emoji}
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold truncate">{u.username || u.name || "Người dùng"}</div>
              </div>
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
