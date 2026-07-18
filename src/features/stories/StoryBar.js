import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, X, Loader2, Music, Type, Smile } from "lucide-react";
import Modal from "../../components/Modal";
import StoryViewerModal from "./StoryViewerModal";
import {
  getStories, createStory, deleteStory, setHighlight, uploadStoryAudio, getSeenStoryIds,
} from "../../services/storyRealApi";
import { getFriends } from "../../services/followershipApi";

const PLACEHOLDER = "https://via.placeholder.com/64?text=?";
const EMOJIS = ["😍", "😂", "🔥", "❤️", "👍", "🎉", "😎", "🥳", "✨", "😢", "😮", "💯"];
let STICKER_SEQ = 1;

function displayName(u) {
  if (!u) return "Người dùng";
  const full = [u.lastname, u.firstname].filter(Boolean).join(" ").trim();
  return full || u.name || u.username || "Người dùng";
}

export default function StoryBar({ meId, me }) {
  const [myStories, setMyStories] = useState([]);
  const [others, setOthers] = useState([]); // [{ user, stories }]
  const [loading, setLoading] = useState(true);
  const [viewStart, setViewStart] = useState(null); // index bắt đầu trong list phẳng | null

  // Tập id story đã xem — LẤY TỪ DB (story_view). Xóa record trong DB -> reload là viền reset.
  const [seen, setSeen] = useState(new Set());
  const markSeen = useCallback((id) => {
    // Cập nhật lạc quan trong bộ nhớ để viền đổi ngay sau khi xem (không ghi localStorage).
    if (!id) return;
    setSeen((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  // ===== Trình biên tập =====
  const [openCreate, setOpenCreate] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [isArchived, setIsArchived] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [captionColor, setCaptionColor] = useState("#ffffff");
  const [captionPos, setCaptionPos] = useState({ x: 0.5, y: 0.85 });
  const [stickers, setStickers] = useState([]);
  const [music, setMusic] = useState(null);
  const [musicUploading, setMusicUploading] = useState(false);
  const [err, setErr] = useState("");
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, friends, seenIds] = await Promise.all([
        getStories().catch(() => []),
        getFriends().catch(() => []),
        getSeenStoryIds().catch(() => []),
      ]);
      setSeen(new Set(Array.isArray(seenIds) ? seenIds : []));
      setMyStories(Array.isArray(mine) ? mine : []);
      const list = Array.isArray(friends) ? friends : [];
      const results = await Promise.all(
        list.map(async (f) => {
          try { const st = await getStories(f.id); return st && st.length ? { user: f, stories: st } : null; }
          catch { return null; }
        })
      );
      setOthers(results.filter(Boolean));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // List phẳng: story của mình trước, rồi tới bạn bè -> tự chuyển sang user khác khi xem hết 1 người.
  const flat = useMemo(() => {
    const arr = [];
    myStories.forEach((s) => arr.push(s));
    others.forEach((o) => o.stories.forEach((s) => arr.push(s)));
    return arr;
  }, [myStories, others]);

  const openByUser = (userId) => {
    const idx = flat.findIndex((s) => s.user?.id === userId);
    if (idx >= 0) setViewStart(idx);
  };

  // Xoá / bật-tắt Highlight cho story của mình (StoryViewerModal gọi lại)
  const onDelete = async (story) => {
    try { await deleteStory(story.id); setMyStories((prev) => prev.filter((x) => x.id !== story.id)); }
    catch { /* ignore */ }
  };
  const onToggleHighlight = async (story) => {
    const next = !story.isArchived;
    try {
      await setHighlight(story.id, next);
      setMyStories((prev) => prev.map((x) => (x.id === story.id ? { ...x, isArchived: next } : x)));
    } catch { /* ignore */ }
  };

  // ===== Composer helpers =====
  function resetCreate() {
    setFile(null); setPreview(""); setSubmitting(false);
    setExpiresInHours(24); setIsArchived(false);
    setCaptionText(""); setCaptionColor("#ffffff"); setCaptionPos({ x: 0.5, y: 0.85 });
    setStickers([]); setMusic(null); setMusicUploading(false); setErr("");
  }
  const openComposer = () => { resetCreate(); setOpenCreate(true); };

  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setErr("");
    e.target.value = "";
  }
  async function onPickMusic(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setMusicUploading(true); setErr("");
    try { const url = await uploadStoryAudio(f); if (!url) throw new Error("Upload nhạc thất bại"); setMusic({ url, title: f.name }); }
    catch (e2) { setErr(e2?.message || "Upload nhạc thất bại"); } finally { setMusicUploading(false); }
    e.target.value = "";
  }
  function onCanvasPointerMove(e) {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    x = Math.min(1, Math.max(0, x)); y = Math.min(1, Math.max(0, y));
    if (dragRef.current.type === "caption") setCaptionPos({ x, y });
    else setStickers((prev) => prev.map((s) => (s.id === dragRef.current.id ? { ...s, x, y } : s)));
  }
  const endDrag = () => { dragRef.current = null; };
  const addSticker = (value) => setStickers((prev) => [...prev, { id: STICKER_SEQ++, value, x: 0.5, y: 0.4 }]);
  const removeSticker = (id) => setStickers((prev) => prev.filter((s) => s.id !== id));

  async function onSubmitCreate() {
    if (!file) return;
    setSubmitting(true); setErr("");
    try {
      const metadata = {};
      if (captionText.trim()) metadata.caption = { text: captionText.trim(), x: captionPos.x, y: captionPos.y, color: captionColor, fontSize: 22 };
      if (stickers.length) metadata.stickers = stickers.map((s) => ({ value: s.value, x: s.x, y: s.y, size: 40 }));
      if (music?.url) metadata.music = { url: music.url, title: music.title };
      await createStory({
        file, caption: captionText.trim() || null, isArchived,
        expiresInHours: Number(expiresInHours) || 24,
        metadata: Object.keys(metadata).length ? JSON.stringify(metadata) : null,
      });
      setOpenCreate(false); resetCreate();
      await load();
    } catch (e) { setErr(e?.message || "Đăng story thất bại"); } finally { setSubmitting(false); }
  }

  const myAvatar = me?.photo || myStories[0]?.user?.photo || PLACEHOLDER;

  return (
    <div className="border-b border-gray-200 dark:border-neutral-800 mb-4">
      <div className="flex gap-4 px-2 py-4 overflow-x-auto scroll-thin">
        {/* Tin của bạn */}
        <button
          onClick={() => (myStories.length ? openByUser(meId) : openComposer())}
          className="flex flex-col items-center shrink-0 w-[70px]"
          title={myStories.length ? "Xem tin của bạn" : "Đăng tin"}
        >
          <div className="relative w-16 h-16">
            <div className={`w-16 h-16 rounded-full p-[2px] ${myStories.length ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" : "bg-gray-300 dark:bg-neutral-700"}`}>
              <img src={myAvatar} alt="" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black bg-gray-200" />
            </div>
            <span onClick={(e) => { e.stopPropagation(); openComposer(); }}
              className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-black" title="Đăng tin mới">
              <Plus size={12} />
            </span>
          </div>
          <span className="text-xs mt-1 truncate w-16 text-center">Tin của bạn</span>
        </button>

        {/* Story bạn bè */}
        {loading ? (
          <div className="flex items-center text-gray-400 px-2"><Loader2 size={16} className="animate-spin" /></div>
        ) : (
          others.map(({ user, stories }) => {
            const allSeen = stories.every((s) => seen.has(s.id));
            return (
              <button key={user.id} onClick={() => openByUser(user.id)} className="flex flex-col items-center shrink-0 w-[70px]" title={`Xem tin của ${displayName(user)}`}>
                <div className={`w-16 h-16 rounded-full p-[2px] ${allSeen ? "bg-gray-300 dark:bg-neutral-600" : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"}`}>
                  <img src={user.photo || PLACEHOLDER} alt="" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black bg-gray-200" />
                </div>
                <span className="text-xs mt-1 truncate w-16 text-center">{user.username || displayName(user)}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Viewer dùng chung */}
      {viewStart != null && (
        <StoryViewerModal
          key={viewStart}
          stories={flat}
          startIndex={viewStart}
          meId={meId}
          onClose={() => setViewStart(null)}
          onSeen={markSeen}
          onDelete={onDelete}
          onToggleHighlight={onToggleHighlight}
        />
      )}

      {/* Trình biên tập */}
      <Modal open={openCreate} onClose={() => { setOpenCreate(false); resetCreate(); }}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Tạo tin</h2>
            <button onClick={() => { setOpenCreate(false); resetCreate(); }} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"><X size={20} /></button>
          </div>
          {err && <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{err}</div>}

          {!preview ? (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-xl py-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800">
              <Plus size={28} className="text-gray-400" />
              <span className="text-sm text-gray-500">Chọn ảnh hoặc video</span>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={onPickFile} />
            </label>
          ) : (
            <div className="flex flex-col gap-3">
              <div ref={canvasRef} onPointerMove={onCanvasPointerMove} onPointerUp={endDrag} onPointerLeave={endDrag}
                className="aspect-[9/16] max-h-[45vh] mx-auto bg-black rounded-xl overflow-hidden flex items-center justify-center relative select-none touch-none">
                {file?.type?.startsWith("video") ? (
                  <video src={preview} className="w-full h-full object-contain pointer-events-none" />
                ) : (
                  <img src={preview} alt="" className="w-full h-full object-contain pointer-events-none" />
                )}
                {submitting && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white gap-2 text-sm"><Loader2 className="animate-spin" /> Đang đăng...</div>}
                {captionText.trim() && (
                  <div onPointerDown={(e) => { e.preventDefault(); dragRef.current = { type: "caption" }; }}
                    className="absolute font-bold text-center px-2 cursor-move drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    style={{ left: `${captionPos.x * 100}%`, top: `${captionPos.y * 100}%`, transform: "translate(-50%,-50%)", color: captionColor, fontSize: "22px", maxWidth: "90%" }}>
                    {captionText}
                  </div>
                )}
                {stickers.map((s) => (
                  <div key={s.id} onPointerDown={(e) => { e.preventDefault(); dragRef.current = { type: "sticker", id: s.id }; }} onDoubleClick={() => removeSticker(s.id)}
                    title="Kéo để di chuyển, nhấp đúp để xóa" className="absolute cursor-move"
                    style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, transform: "translate(-50%,-50%)", fontSize: "40px" }}>
                    {s.value}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Type size={18} className="text-gray-400" />
                <input value={captionText} onChange={(e) => setCaptionText(e.target.value)} placeholder="Caption (kéo trên ảnh để đặt vị trí)..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="color" value={captionColor} onChange={(e) => setCaptionColor(e.target.value)} title="Màu chữ" className="w-9 h-9 rounded cursor-pointer border" />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Smile size={18} className="text-gray-400" />
                {EMOJIS.map((em) => (<button key={em} onClick={() => addSticker(em)} className="text-xl hover:scale-110 transition" title="Thêm sticker">{em}</button>))}
              </div>

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

              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  Hết hạn sau
                  <input type="number" min={1} max={168} value={expiresInHours} onChange={(e) => setExpiresInHours(e.target.value)}
                    className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800" /> giờ
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
