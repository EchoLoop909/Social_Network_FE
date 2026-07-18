import { useState, useEffect } from "react";
import { X, Search, Loader2, Check } from "lucide-react";
import Modal from "../../components/Modal";
import { searchUsers } from "../../services/followershipApi";

const PLACEHOLDER = "https://via.placeholder.com/40?text=?";

/**
 * Hộp chọn người để gắn thẻ (dùng chung). Trả về danh sách user đã chọn qua onConfirm.
 * Props: open, onClose, onConfirm(users), initial=[]
 */
export default function TagPeopleDialog({ open, onClose, onConfirm, initial = [] }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(initial);

  useEffect(() => { if (open) setSelected(initial); /* eslint-disable-next-line */ }, [open]);

  useEffect(() => {
    if (!open) return;
    const s = q.trim();
    if (!s) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try { setResults((await searchUsers(s)).slice(0, 8)); }
      catch { /* ignore */ } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [q, open]);

  const toggle = (u) => setSelected((prev) => (prev.some((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]));
  const isSel = (u) => selected.some((x) => x.id === u.id);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Gắn thẻ người</h2>
        <button onClick={onClose} className="text-gray-500 hover:opacity-70"><X size={20} /></button>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((u) => (
            <span key={u.id} className="flex items-center gap-1 bg-blue-50 text-blue-600 rounded-full pl-2 pr-1 py-0.5 text-sm">
              @{u.username}
              <button onClick={() => toggle(u)} className="hover:bg-blue-100 rounded-full"><X size={13} /></button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-2">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm người để gắn thẻ..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-sm outline-none" />
      </div>

      <div className="max-h-64 overflow-y-auto">
        {searching ? (
          <div className="p-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Đang tìm...</div>
        ) : results.length === 0 && q.trim() ? (
          <div className="p-3 text-sm text-gray-500">Không tìm thấy.</div>
        ) : (
          results.map((u) => (
            <button key={u.id} onClick={() => toggle(u)} className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-left rounded-lg">
              <img src={u.photo || PLACEHOLDER} alt="" className="w-9 h-9 rounded-full object-cover bg-gray-200" />
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{u.username}</div></div>
              {isSel(u) && <Check size={18} className="text-blue-600" />}
            </button>
          ))
        )}
      </div>

      <button onClick={() => { onConfirm(selected); onClose(); }}
        className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold">
        Xong{selected.length ? ` (${selected.length})` : ""}
      </button>
    </Modal>
  );
}
