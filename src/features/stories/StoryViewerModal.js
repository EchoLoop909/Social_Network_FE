import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, Music, Star, Trash2, Eye, Volume2, VolumeX, Play, Pause, Heart, Send, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { recordStoryView, getStoryViewers } from "../../services/storyRealApi";

const PLACEHOLDER = "https://via.placeholder.com/64?text=?";
const IMAGE_MS = 15000; // ảnh: 15s rồi tự chuyển
const TICK = 50;

function displayName(u) {
  if (!u) return "Người dùng";
  const full = [u.lastname, u.firstname].filter(Boolean).join(" ").trim();
  return full || u.name || u.username || "Người dùng";
}
function shortAgo(dt) {
  if (!dt) return "";
  try {
    const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
    if (m < 60) return `${Math.max(1, m)}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  } catch { return ""; }
}
function parseMeta(raw) { if (!raw) return {}; try { return typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return {}; } }

/**
 * Viewer story TOÀN MÀN HÌNH kiểu Instagram (nền đen, không viền trắng).
 * Props: stories, startIndex, meId, onClose, onSeen?, onDelete?, onToggleHighlight?
 */
export default function StoryViewerModal({ stories, startIndex = 0, meId, onClose, onSeen, onDelete, onToggleHighlight }) {
  const [i, setI] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewers, setViewers] = useState(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const seenRef = useRef(onSeen);
  seenRef.current = onSeen;

  const list = Array.isArray(stories) ? stories : [];
  const s = list[i] || null;

  const goNext = () => setI((p) => (p < list.length - 1 ? p + 1 : (onClose(), p)));
  const goPrev = () => setI((p) => Math.max(0, p - 1));

  // Giữ index trong biên khi danh sách đổi (vd sau khi xoá)
  useEffect(() => {
    if (list.length === 0) { onClose(); return; }
    if (i > list.length - 1) setI(list.length - 1);
  }, [list.length]);

  // Đổi story: reset tiến trình + đánh dấu đã xem + ghi view
  useEffect(() => {
    setProgress(0);
    setMenuOpen(false);
    if (!s) return;
    // Video: mặc định tắt tiếng (để trình duyệt cho tự phát). Ảnh+nhạc: mặc định bật tiếng để nghe được.
    setMuted(s.mediaType === "VIDEO");
    seenRef.current?.(s.id);
    if (meId && s.user?.id && s.user.id !== meId) recordStoryView(s.id);
  }, [i, s?.id, meId]);

  // Ảnh: chạy thanh tiến trình 15s (video dùng sự kiện của <video>). Tạm dừng thì đứng yên.
  useEffect(() => {
    if (!s || s.mediaType === "VIDEO" || paused) return;
    const step = TICK / IMAGE_MS;
    const id = setInterval(() => {
      setProgress((p) => {
        const np = p + step;
        if (np >= 1) { clearInterval(id); goNext(); return 1; }
        return np;
      });
    }, TICK);
    return () => clearInterval(id);
  }, [i, s?.id, paused]);

  // Tạm dừng/tiếp tục video + nhạc
  useEffect(() => {
    const v = videoRef.current, a = audioRef.current;
    if (paused) { v?.pause(); a?.pause(); }
    else { v?.play().catch(() => {}); a?.play().catch(() => {}); }
  }, [paused, i]);

  const openViewers = async (storyId) => {
    setViewers({ loading: true, list: [] });
    try { setViewers({ loading: false, list: await getStoryViewers(storyId) }); }
    catch { setViewers({ loading: false, list: [] }); }
  };
  const onDeleteClick = async () => { if (!onDelete || !s) return; setBusy(true); try { await onDelete(s); } finally { setBusy(false); setMenuOpen(false); } };
  const onHighlightClick = async () => { if (!onToggleHighlight || !s) return; setBusy(true); try { await onToggleHighlight(s); } finally { setBusy(false); setMenuOpen(false); } };

  if (!s) return null;
  const meta = parseMeta(s.metadata);
  const mine = meId && s.user?.id === meId;

  // Gom story liên tiếp theo user -> thanh tiến trình chỉ hiện đúng số story của user HIỆN TẠI.
  const groups = [];
  list.forEach((st, idx) => {
    const uid = st.user?.id;
    const last = groups[groups.length - 1];
    if (last && last.uid === uid) last.items.push(idx);
    else groups.push({ uid, items: [idx] });
  });
  const curGroup = groups.find((g) => g.items.includes(i)) || { items: [] };
  const localIndex = curGroup.items.indexOf(i);

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center" onClick={onClose}>
      {/* Khung dọc kiểu điện thoại, nền đen — không viền trắng */}
      <div
        className="relative w-full max-w-[420px] h-full sm:h-[95vh] bg-black sm:rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MEDIA phủ kín */}
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          {s.mediaType === "VIDEO" ? (
            <video
              key={s.id}
              ref={videoRef}
              src={s.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={muted}
              onTimeUpdate={(e) => { const d = e.target.duration; if (d) setProgress(e.target.currentTime / d); }}
              onEnded={goNext}
            />
          ) : (
            <img src={s.mediaUrl} alt="" className="w-full h-full object-contain" />
          )}

          {/* caption overlay */}
          {meta.caption?.text && (
            <div className="absolute font-bold text-center px-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none"
              style={{ left: `${(meta.caption.x ?? 0.5) * 100}%`, top: `${(meta.caption.y ?? 0.85) * 100}%`, transform: "translate(-50%,-50%)", color: meta.caption.color || "#fff", fontSize: (meta.caption.fontSize || 22) + "px", maxWidth: "90%" }}>
              {meta.caption.text}
            </div>
          )}
          {(meta.stickers || []).map((st, idx) => (
            <div key={idx} className="absolute pointer-events-none"
              style={{ left: `${(st.x ?? 0.5) * 100}%`, top: `${(st.y ?? 0.4) * 100}%`, transform: "translate(-50%,-50%)", fontSize: (st.size || 40) + "px" }}>
              {st.value}
            </div>
          ))}
          {meta.music?.url && <audio key={s.id + "-a"} ref={audioRef} src={meta.music.url} autoPlay loop muted={muted} />}
        </div>

        {/* Vùng chạm trái/phải để lùi/tiến */}
        <button aria-label="prev" className="absolute left-0 top-16 bottom-20 w-1/3 z-10" onClick={goPrev} />
        <button aria-label="next" className="absolute right-0 top-16 bottom-20 w-1/3 z-10" onClick={goNext} />

        {/* Mũi tên chuyển story */}
        {i > 0 && (
          <button onClick={goPrev} title="Tin trước"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/35 text-white rounded-full p-1.5">
            <ChevronLeft size={22} />
          </button>
        )}
        <button onClick={goNext} title="Tin sau"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/35 text-white rounded-full p-1.5">
          <ChevronRight size={22} />
        </button>

        {/* TRÊN: thanh tiến trình + header */}
        <div className="relative z-20 bg-gradient-to-b from-black/60 to-transparent pt-2 px-3">
          <div className="flex gap-1">
            {curGroup.items.map((_, k) => (
              <div key={k} className="flex-1 h-[3px] rounded-full bg-white/35 overflow-hidden">
                <div className="h-full bg-white" style={{ width: k < localIndex ? "100%" : k === localIndex ? `${progress * 100}%` : "0%" }} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 py-2 text-white">
            <img src={s.user?.photo || PLACEHOLDER} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-600" />
            <span className="font-semibold text-sm truncate">{s.user?.username || displayName(s.user)}</span>
            <span className="text-xs text-white/70">{shortAgo(s.createdAt)}</span>
            {s.isArchived && <Star size={13} className="text-yellow-400" />}
            <div className="ml-auto flex items-center gap-3">
              <button onClick={() => setPaused((p) => !p)} title={paused ? "Tiếp tục" : "Tạm dừng"} className="hover:opacity-70">
                {paused ? <Play size={20} /> : <Pause size={20} />}
              </button>
              {(s.mediaType === "VIDEO" || meta.music?.url) && (
                <button onClick={() => setMuted((m) => !m)} title={muted ? "Bật âm" : "Tắt âm"} className="hover:opacity-70">
                  {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              )}
              {mine && (onDelete || onToggleHighlight) && (
                <div className="relative">
                  <button onClick={() => setMenuOpen((v) => !v)} className="hover:opacity-70"><MoreHorizontal size={22} /></button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-8 z-20 w-44 bg-white text-gray-800 dark:bg-neutral-800 dark:text-neutral-100 rounded-lg shadow-lg py-1 text-sm">
                        {onToggleHighlight && (
                          <button disabled={busy} onClick={onHighlightClick} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50">
                            <Star size={15} /> {s.isArchived ? "Bỏ Highlight" : "Thêm Highlight"}
                          </button>
                        )}
                        <button onClick={() => { setMenuOpen(false); openViewers(s.id); }} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700">
                          <Eye size={15} /> Người xem
                        </button>
                        {onDelete && (
                          <button disabled={busy} onClick={onDeleteClick} className="flex items-center gap-2 w-full text-left px-3 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50">
                            <Trash2 size={15} /> Xóa tin
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              <button onClick={onClose} className="hover:opacity-70"><X size={22} /></button>
            </div>
          </div>
        </div>

        {/* chỉ báo có nhạc (không hiện tên file) */}
        {meta.music?.url && (
          <span className="absolute z-20 top-16 left-3 bg-black/50 text-white rounded-full p-1.5">
            <Music size={14} />
          </span>
        )}

        {/* DƯỚI: ô trả lời + tim + chia sẻ */}
        <div className="relative z-20 mt-auto bg-gradient-to-t from-black/60 to-transparent px-3 py-3">
          <div className="flex items-center gap-3">
            <input
              onClick={() => setPaused(true)}
              placeholder={`Trả lời ${s.user?.username || "..."}`}
              className="flex-1 bg-transparent border border-white/50 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/70 outline-none"
            />
            <button className="text-white hover:opacity-70" title="Thích"><Heart size={26} /></button>
            <button className="text-white hover:opacity-70" title="Chia sẻ"><Send size={24} /></button>
          </div>
        </div>
      </div>

      {/* Danh sách người xem */}
      {viewers && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewers(null)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-700 px-4 py-3">
              <span className="font-semibold flex items-center gap-2"><Eye size={16} /> Người đã xem</span>
              <button onClick={() => setViewers(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-2">
              {viewers.loading ? (
                <div className="flex items-center gap-2 text-gray-500 py-8 justify-center"><Loader2 className="animate-spin" size={16} /> Đang tải...</div>
              ) : viewers.list.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-10">Chưa có ai xem story này.</div>
              ) : (
                viewers.list.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-2 py-2">
                    <img src={u.photo || PLACEHOLDER} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{u.username}</div>
                      <div className="text-xs text-gray-500 truncate">{displayName(u)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
