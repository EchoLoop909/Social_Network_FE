import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, Trash2, X, ChevronLeft, ChevronRight, Loader2, AlertCircle, Check, Star, Music, Smile, Type, Eye } from "lucide-react";
import Modal from "../components/Modal";
import { getStories, createStory, deleteStory, uploadStoryAudio, recordStoryView, getStoryViewers } from "../services/storyRealApi";

const PLACEHOLDER = "https://via.placeholder.com/64?text=?";
const EMOJIS = ["😍", "😂", "🔥", "❤️", "👍", "🎉", "😎", "🥳", "✨", "😢", "😮", "💯"];
let STICKER_SEQ = 1;

function displayName(u) {
  if (!u) return "Người dùng";
  const full = [u.lastname, u.firstname].filter(Boolean).join(" ").trim();
  return full || u.name || u.username || "Người dùng";
}
function fmt(dt) {
  if (!dt) return "";
  try { return new Date(dt).toLocaleString("vi-VN"); } catch { return dt; }
}
// Parse metadata JSON an toàn -> object overlay (hoặc {})
function parseMeta(raw) {
  if (!raw) return {};
  try { return typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return {}; }
}

export default function StoriesPage() {
  const [ownerId, setOwnerId] = useState("");
  const [ownerInput, setOwnerInput] = useState("");
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [viewIdx, setViewIdx] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [viewers, setViewers] = useState(null); // { loading, list } | null (đóng)

  // ===== Trình biên tập story =====
  const [openCreate, setOpenCreate] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [expiresInHours, setExpiresInHours] = useState(24);
  const [isArchived, setIsArchived] = useState(false);

  const [captionText, setCaptionText] = useState("");
  const [captionColor, setCaptionColor] = useState("#ffffff");
  const [captionPos, setCaptionPos] = useState({ x: 0.5, y: 0.85 });

  const [stickers, setStickers] = useState([]); // { id, value, x, y }
  const [music, setMusic] = useState(null); // { url, title }
  const [musicUploading, setMusicUploading] = useState(false);

  const canvasRef = useRef(null);
  const dragRef = useRef(null); // { type:'caption'|'sticker', id }

  const meId = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem("auth_tokens") || "null");
      if (!t?.access_token) return null;
      return JSON.parse(atob(t.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))?.sub || null;
    } catch { return null; }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      setStories(await getStories(ownerId));
    } catch (e) {
      setErr(e?.message || "Tải story thất bại");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  // Khi mở xem story của NGƯỜI KHÁC -> ghi nhận lượt xem vào story_views (idempotent).
  useEffect(() => {
    const s = viewIdx != null ? stories[viewIdx] : null;
    if (s && meId && s.user?.id && s.user.id !== meId) {
      recordStoryView(s.id);
    }
  }, [viewIdx, stories, meId]);

  const openViewers = async (storyId) => {
    setViewers({ loading: true, list: [] });
    try {
      const list = await getStoryViewers(storyId);
      setViewers({ loading: false, list });
    } catch {
      setViewers({ loading: false, list: [] });
    }
  };

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function resetCreate() {
    setFile(null); setPreview("");
    setSubmitting(false);
    setExpiresInHours(24); setIsArchived(false);
    setCaptionText(""); setCaptionColor("#ffffff"); setCaptionPos({ x: 0.5, y: 0.85 });
    setStickers([]); setMusic(null); setMusicUploading(false);
  }

  // Chỉ chọn file + xem trước cục bộ; file thật sẽ gửi thẳng lúc "Đăng" (BE upload Cloudinary).
  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setErr("");
    e.target.value = "";
  }

  async function onPickMusic(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setMusicUploading(true);
    setErr("");
    try {
      const url = await uploadStoryAudio(f);
      if (!url) throw new Error("Upload nhạc thất bại");
      setMusic({ url, title: f.name });
    } catch (e2) {
      setErr(e2?.message || "Upload nhạc thất bại");
    } finally {
      setMusicUploading(false);
    }
    e.target.value = "";
  }

  // ===== Kéo-thả overlay trong canvas =====
  function onCanvasPointerMove(e) {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    x = Math.min(1, Math.max(0, x));
    y = Math.min(1, Math.max(0, y));
    if (dragRef.current.type === "caption") setCaptionPos({ x, y });
    else setStickers((prev) => prev.map((s) => (s.id === dragRef.current.id ? { ...s, x, y } : s)));
  }
  const endDrag = () => { dragRef.current = null; };

  const addSticker = (value) =>
    setStickers((prev) => [...prev, { id: STICKER_SEQ++, value, x: 0.5, y: 0.4 }]);
  const removeSticker = (id) => setStickers((prev) => prev.filter((s) => s.id !== id));

  async function onSubmitCreate() {
    if (!file) return;
    setSubmitting(true);
    setErr("");
    try {
      const metadata = {};
      if (captionText.trim()) {
        metadata.caption = { text: captionText.trim(), x: captionPos.x, y: captionPos.y, color: captionColor, fontSize: 22 };
      }
      if (stickers.length) {
        metadata.stickers = stickers.map((s) => ({ value: s.value, x: s.x, y: s.y, size: 40 }));
      }
      if (music?.url) metadata.music = { url: music.url, title: music.title };

      await createStory({
        file,
        caption: captionText.trim() || null,
        isArchived,
        expiresInHours: Number(expiresInHours) || 24,
        metadata: Object.keys(metadata).length ? JSON.stringify(metadata) : null,
      });
      setOpenCreate(false);
      resetCreate();
      flash("Đã đăng story");
      await load();
    } catch (e) {
      setErr(e?.message || "Đăng story thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(story) {
    setBusyId(story.id);
    setErr("");
    try {
      await deleteStory(story.id);
      setStories((prev) => {
        const next = prev.filter((x) => x.id !== story.id);
        setViewIdx((idx) => (idx == null ? idx : next.length === 0 ? null : Math.min(idx, next.length - 1)));
        return next;
      });
      flash("Đã xóa story");
    } catch (e) {
      setErr(e?.message || "Xóa story thất bại");
    } finally {
      setBusyId(null);
    }
  }

  const viewing = viewIdx != null ? stories[viewIdx] : null;
  const viewMeta = parseMeta(viewing?.metadata);
  const canDelete = (s) => meId && s?.user?.id === meId;

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Tin (Story)</h1>
        <button
          onClick={() => { resetCreate(); setOpenCreate(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          <Plus size={18} /> Đăng story
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        <input
          value={ownerInput}
          onChange={(e) => setOwnerInput(e.target.value)}
          placeholder="Nhập userId để xem story người khác (bỏ trống = của bạn)"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={() => setOwnerId(ownerInput.trim())} className="bg-gray-200 dark:bg-neutral-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-300">
          Xem
        </button>
      </div>

      {err && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          <AlertCircle size={18} className="mt-0.5" /> <span>{err}</span>
        </div>
      )}
      {toast && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
          <Check size={18} className="mt-0.5" /> <span>{toast}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-20 justify-center"><Loader2 className="animate-spin" /> Đang tải...</div>
      ) : stories.length === 0 ? (
        <div className="text-sm text-gray-500 py-16 text-center border rounded-xl bg-white dark:bg-neutral-800">Chưa có story nào.</div>
      ) : (
        <div className="flex gap-4 flex-wrap">
          {stories.map((s, i) => (
            <div key={s.id} className="w-[110px]">
              <button onClick={() => setViewIdx(i)} className="block w-full">
                <div className="w-[110px] h-[170px] rounded-xl overflow-hidden bg-black relative ring-2 ring-pink-500">
                  {s.mediaType === "VIDEO" ? (
                    <video src={s.mediaUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={s.mediaUrl} alt="" className="w-full h-full object-cover" />
                  )}
                  {s.isArchived && (
                    <span className="absolute top-1 right-1 bg-yellow-400 text-black rounded-full p-1" title="Highlight"><Star size={12} /></span>
                  )}
                  {parseMeta(s.metadata).music && (
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white rounded-full p-1" title="Có nhạc"><Music size={12} /></span>
                  )}
                </div>
              </button>
              <div className="mt-1 flex items-center gap-1">
                <img src={s.user?.photo || PLACEHOLDER} alt="" className="w-5 h-5 rounded-full object-cover bg-gray-200" />
                <span className="text-xs truncate flex-1">{displayName(s.user)}</span>
              </div>
              {canDelete(s) && (
                <button disabled={busyId === s.id} onClick={() => onDelete(s)}
                  className="mt-1 w-full flex items-center justify-center gap-1 text-xs text-red-600 hover:bg-red-50 rounded py-1 disabled:opacity-50">
                  {busyId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Xóa
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ============ Viewer (render overlay + nhạc) ============ */}
      <Modal open={viewing != null} onClose={() => setViewIdx(null)}>
        {viewing && (
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <img src={viewing.user?.photo || PLACEHOLDER} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-200" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{displayName(viewing.user)}</div>
                <div className="text-xs text-gray-400">{fmt(viewing.createdAt)}</div>
              </div>
              {viewing.isArchived && (
                <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5 flex items-center gap-1"><Star size={12} /> Highlight</span>
              )}
              <button onClick={() => setViewIdx(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"><X size={20} /></button>
            </div>

            <div className="aspect-[9/16] max-h-[70vh] mx-auto bg-black rounded-xl overflow-hidden flex items-center justify-center relative">
              {viewing.mediaType === "VIDEO" ? (
                <video src={viewing.mediaUrl} className="w-full h-full object-contain" controls autoPlay />
              ) : (
                <img src={viewing.mediaUrl} alt="" className="w-full h-full object-contain" />
              )}

              {/* caption overlay */}
              {viewMeta.caption?.text && (
                <div
                  className="absolute font-bold text-center px-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none"
                  style={{
                    left: `${(viewMeta.caption.x ?? 0.5) * 100}%`,
                    top: `${(viewMeta.caption.y ?? 0.85) * 100}%`,
                    transform: "translate(-50%,-50%)",
                    color: viewMeta.caption.color || "#fff",
                    fontSize: (viewMeta.caption.fontSize || 22) + "px",
                    maxWidth: "90%",
                  }}
                >
                  {viewMeta.caption.text}
                </div>
              )}

              {/* stickers overlay */}
              {(viewMeta.stickers || []).map((st, i) => (
                <div key={i} className="absolute pointer-events-none"
                  style={{
                    left: `${(st.x ?? 0.5) * 100}%`,
                    top: `${(st.y ?? 0.4) * 100}%`,
                    transform: "translate(-50%,-50%)",
                    fontSize: (st.size || 40) + "px",
                  }}
                >
                  {st.value}
                </div>
              ))}

              {/* nhạc */}
              {viewMeta.music?.url && (
                <>
                  <audio src={viewMeta.music.url} autoPlay loop />
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-xs rounded-full px-2 py-1 flex items-center gap-1 max-w-[70%] truncate">
                    <Music size={12} /> {viewMeta.music.title || "Nhạc"}
                  </span>
                </>
              )}
            </div>

            <div className="mt-1 text-xs text-gray-400">Hết hạn: {fmt(viewing.expiresAt)}</div>

            <button onClick={() => setViewIdx((i) => Math.max(0, i - 1))} disabled={viewIdx === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 disabled:opacity-30"><ChevronLeft size={22} /></button>
            <button onClick={() => setViewIdx((i) => Math.min(stories.length - 1, i + 1))} disabled={viewIdx === stories.length - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 disabled:opacity-30"><ChevronRight size={22} /></button>

            {canDelete(viewing) && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => openViewers(viewing.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-neutral-700 rounded-lg py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-neutral-600">
                  <Eye size={14} /> Người xem
                </button>
                <button disabled={busyId === viewing.id} onClick={() => onDelete(viewing)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-lg py-2 text-sm font-semibold hover:bg-red-100 disabled:opacity-50">
                  {busyId === viewing.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Xóa
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============ Modal danh sách người xem ============ */}
      {viewers && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
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

      {/* ============ Trình biên tập đăng story ============ */}
      <Modal open={openCreate} onClose={() => { setOpenCreate(false); resetCreate(); }}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Tạo story</h2>
            <button onClick={() => { setOpenCreate(false); resetCreate(); }} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"><X size={20} /></button>
          </div>

          {!preview ? (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-xl py-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800">
              <Plus size={28} className="text-gray-400" />
              <span className="text-sm text-gray-500">Chọn ảnh hoặc video</span>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={onPickFile} />
            </label>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Canvas biên tập: kéo caption/sticker */}
              <div
                ref={canvasRef}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={endDrag}
                onPointerLeave={endDrag}
                className="aspect-[9/16] max-h-[45vh] mx-auto bg-black rounded-xl overflow-hidden flex items-center justify-center relative select-none touch-none"
              >
                {file?.type?.startsWith("video") ? (
                  <video src={preview} className="w-full h-full object-contain pointer-events-none" />
                ) : (
                  <img src={preview} alt="" className="w-full h-full object-contain pointer-events-none" />
                )}
                {submitting && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white gap-2 text-sm"><Loader2 className="animate-spin" /> Đang đăng...</div>
                )}

                {/* caption có thể kéo */}
                {captionText.trim() && (
                  <div
                    onPointerDown={(e) => { e.preventDefault(); dragRef.current = { type: "caption" }; }}
                    className="absolute font-bold text-center px-2 cursor-move drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    style={{ left: `${captionPos.x * 100}%`, top: `${captionPos.y * 100}%`, transform: "translate(-50%,-50%)", color: captionColor, fontSize: "22px", maxWidth: "90%" }}
                  >
                    {captionText}
                  </div>
                )}

                {/* stickers có thể kéo */}
                {stickers.map((s) => (
                  <div key={s.id}
                    onPointerDown={(e) => { e.preventDefault(); dragRef.current = { type: "sticker", id: s.id }; }}
                    onDoubleClick={() => removeSticker(s.id)}
                    title="Kéo để di chuyển, nhấp đúp để xóa"
                    className="absolute cursor-move"
                    style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, transform: "translate(-50%,-50%)", fontSize: "40px" }}
                  >
                    {s.value}
                  </div>
                ))}
              </div>

              {/* Caption */}
              <div className="flex items-center gap-2">
                <Type size={18} className="text-gray-400" />
                <input value={captionText} onChange={(e) => setCaptionText(e.target.value)} placeholder="Caption (kéo trên ảnh để đặt vị trí)..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="color" value={captionColor} onChange={(e) => setCaptionColor(e.target.value)} title="Màu chữ" className="w-9 h-9 rounded cursor-pointer border" />
              </div>

              {/* Stickers */}
              <div className="flex items-center gap-2 flex-wrap">
                <Smile size={18} className="text-gray-400" />
                {EMOJIS.map((em) => (
                  <button key={em} onClick={() => addSticker(em)} className="text-xl hover:scale-110 transition" title="Thêm sticker">{em}</button>
                ))}
              </div>

              {/* Nhạc */}
              <div className="flex items-center gap-2">
                <Music size={18} className="text-gray-400" />
                {music ? (
                  <div className="flex-1 flex items-center gap-2 text-sm">
                    <span className="truncate flex-1">{music.title}</span>
                    <audio src={music.url} controls className="h-8" />
                    <button onClick={() => setMusic(null)} className="text-red-600 text-xs">Bỏ</button>
                  </div>
                ) : (
                  <label className="flex-1 text-sm text-blue-600 cursor-pointer hover:underline flex items-center gap-2">
                    {musicUploading ? <><Loader2 size={14} className="animate-spin" /> Đang tải nhạc...</> : "Thêm nhạc (chọn file audio)"}
                    <input type="file" accept="audio/*" className="hidden" onChange={onPickMusic} />
                  </label>
                )}
              </div>

              {/* Thời gian hết hạn + Highlight */}
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  Hết hạn sau
                  <input type="number" min={1} max={168} value={expiresInHours}
                    onChange={(e) => setExpiresInHours(e.target.value)}
                    className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800" />
                  giờ
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} /> Lưu Highlight
                </label>
              </div>

              <button disabled={!file || submitting} onClick={onSubmitCreate}
                className="mt-1 w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {submitting && <Loader2 size={16} className="animate-spin" />} Đăng
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
