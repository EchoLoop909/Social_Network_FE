import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Loader2, X, ImagePlus, Plus, GripVertical, Hash } from "lucide-react";
import Modal from "../../components/Modal";
import { createPostThunk } from "../../store/feedSlice";
import { uploadMedia } from "../../services/postApi";
import { searchUsers } from "../../services/followershipApi";
import { searchHashtags } from "../../services/hashtagApi";

const PLACEHOLDER = "https://via.placeholder.com/40?text=?";

export default function CreatePostDialog({ open, onClose }) {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]); // { id, file, url, isVideo }
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [sharing, setSharing] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  // ===== Gợi ý @mention khi gõ trong nội dung =====
  const taRef = useRef(null);
  const [mentionQuery, setMentionQuery] = useState(null); // chuỗi sau '@' đang gõ | null
  const [mentionAnchor, setMentionAnchor] = useState(0);   // vị trí ký tự '@'
  const [mentionResults, setMentionResults] = useState([]);
  const [mentionLoading, setMentionLoading] = useState(false);

  // ===== Gợi ý #hashtag khi gõ trong nội dung (giống @mention) =====
  const [hashtagQuery, setHashtagQuery] = useState(null); // chuỗi sau '#' đang gõ | null
  const [hashtagAnchor, setHashtagAnchor] = useState(0);   // vị trí ký tự '#'
  const [hashtagResults, setHashtagResults] = useState([]);
  const [hashtagLoading, setHashtagLoading] = useState(false);

  const reset = () => {
    items.forEach((it) => URL.revokeObjectURL(it.url));
    setItems([]); setCaption(""); setVisibility("PUBLIC"); setSharing(false);
    setDragIdx(null); setOverIdx(null);
    setMentionQuery(null); setMentionResults([]); setMentionAnchor(0);
    setHashtagQuery(null); setHashtagResults([]); setHashtagAnchor(0);
  };
  const close = () => { reset(); onClose(); };

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    const mapped = picked.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2)}`,
      file: f, url: URL.createObjectURL(f), isVideo: f.type.startsWith("video"),
    }));
    setItems((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };
  const removeAt = (i) => setItems((prev) => {
    const it = prev[i]; if (it) URL.revokeObjectURL(it.url);
    return prev.filter((_, idx) => idx !== i);
  });

  const onDragStart = (i) => setDragIdx(i);
  const onDragOver = (e, i) => { e.preventDefault(); if (i !== overIdx) setOverIdx(i); };
  const onDrop = (i) => {
    setItems((prev) => {
      if (dragIdx === null || dragIdx === i) return prev;
      const next = [...prev]; const [m] = next.splice(dragIdx, 1); next.splice(i, 0, m); return next;
    });
    setDragIdx(null); setOverIdx(null);
  };

  // Phát hiện token @đang-gõ ngay trước con trỏ
  const detectMention = (val, caret) => {
    const upto = val.slice(0, caret);
    const m = /@([A-Za-z0-9._]*)$/.exec(upto);
    if (m) {
      const at = caret - m[0].length;
      const prevCh = at > 0 ? val[at - 1] : " ";
      if (at === 0 || /\s/.test(prevCh)) {
        setMentionAnchor(at);
        setMentionQuery(m[1]);
        return;
      }
    }
    setMentionQuery(null);
    setMentionResults([]);
  };

  // Phát hiện token #đang-gõ ngay trước con trỏ
  const detectHashtag = (val, caret) => {
    const upto = val.slice(0, caret);
    const m = /#([\p{L}0-9_]*)$/u.exec(upto);
    if (m) {
      const at = caret - m[0].length;
      const prevCh = at > 0 ? val[at - 1] : " ";
      if (at === 0 || /\s/.test(prevCh)) {
        setHashtagAnchor(at);
        setHashtagQuery(m[1]);
        return;
      }
    }
    setHashtagQuery(null);
    setHashtagResults([]);
  };

  const onCaptionChange = (e) => {
    setCaption(e.target.value);
    detectMention(e.target.value, e.target.selectionStart);
    detectHashtag(e.target.value, e.target.selectionStart);
  };

  // Tìm user khi gõ @... (debounce)
  useEffect(() => {
    if (mentionQuery == null || mentionQuery.length < 1) { setMentionResults([]); return; }
    setMentionLoading(true);
    const t = setTimeout(async () => {
      try { setMentionResults((await searchUsers(mentionQuery)).slice(0, 6)); }
      catch { setMentionResults([]); } finally { setMentionLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  // Tìm hashtag khi gõ #... (debounce)
  useEffect(() => {
    if (hashtagQuery == null || hashtagQuery.length < 1) { setHashtagResults([]); return; }
    setHashtagLoading(true);
    const t = setTimeout(async () => {
      try { setHashtagResults((await searchHashtags(hashtagQuery)).slice(0, 6)); }
      catch { setHashtagResults([]); } finally { setHashtagLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [hashtagQuery]);

  // Chọn 1 user -> chèn @username vào đúng vị trí đang gõ
  const pickMention = (u) => {
    const before = caption.slice(0, mentionAnchor);
    const after = caption.slice(mentionAnchor + 1 + (mentionQuery ? mentionQuery.length : 0));
    const next = `${before}@${u.username} ${after}`;
    setCaption(next);
    setMentionQuery(null); setMentionResults([]);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  // Chọn 1 hashtag -> chèn #name vào đúng vị trí đang gõ
  const pickHashtag = (h) => {
    const before = caption.slice(0, hashtagAnchor);
    const after = caption.slice(hashtagAnchor + 1 + (hashtagQuery ? hashtagQuery.length : 0));
    const next = `${before}#${h.name} ${after}`;
    setCaption(next);
    setHashtagQuery(null); setHashtagResults([]);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const share = async () => {
    if (items.length === 0 && !caption.trim()) {
      alert("Nhập nội dung hoặc chọn ảnh/video");
      return;
    }
    setSharing(true);
    try {
      let media = [];
      if (items.length > 0) media = await uploadMedia(items.map((it) => it.file));
      // BE tự tag các @username trong nội dung + gửi thông báo -> không cần gọi tag riêng
      await dispatch(createPostThunk({ text: caption, visibility, media })).unwrap();
      close();
    } catch (e) {
      alert("Đăng bài thất bại: " + e);
      setSharing(false);
    }
  };

  const hasSelection = items.length > 0;

  return (
    <Modal open={open} onClose={close}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Tạo bài viết mới</h2>
        <button onClick={close} className="text-gray-500 hover:opacity-70"><X size={20} /></button>
      </div>

      {/* Media (tùy chọn) */}
      {!hasSelection ? (
        <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800">
          <ImagePlus size={40} className="text-gray-400" />
          <span className="px-4 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg text-sm">Chọn ảnh/video (tùy chọn)</span>
          <span className="text-xs text-gray-400">Hoặc chỉ cần nhập nội dung bên dưới</span>
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />
        </label>
      ) : (
        <div>
          <p className="text-xs text-gray-400 mb-2">Kéo để sắp thứ tự · di chuột vào ảnh để xóa.</p>
          <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
            {items.map((p, i) => (
              <div key={p.id} draggable
                onDragStart={() => onDragStart(i)} onDragOver={(e) => onDragOver(e, i)} onDrop={() => onDrop(i)}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                className={`group relative rounded overflow-hidden cursor-grab active:cursor-grabbing border-2 transition
                  ${overIdx === i && dragIdx !== null ? "border-insta-primary" : "border-transparent"} ${dragIdx === i ? "opacity-50" : ""}`}>
                {p.isVideo ? (
                  <video src={p.url} className="object-cover w-full aspect-square pointer-events-none" />
                ) : (
                  <img src={p.url} alt="" className="object-cover w-full aspect-square pointer-events-none" />
                )}
                <span className="absolute top-1 left-1 bg-black/60 text-white text-[11px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">{i + 1}</span>
                <span className="absolute bottom-1 left-1 bg-black/50 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition"><GripVertical size={12} /></span>
                <button type="button" onClick={() => removeAt(i)} className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><X size={12} /></button>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center gap-1 aspect-square rounded border-2 border-dashed border-gray-300 dark:border-neutral-700 text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800">
              <Plus size={20} /><span className="text-[11px]">Thêm</span>
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
        </div>
      )}

      {/* Nội dung + gợi ý @mention */}
      <div className="relative mt-3">
        <textarea
          ref={taRef}
          placeholder="Bạn đang nghĩ gì? Gõ @ để nhắc đến người khác, # để gắn hashtag..."
          className="w-full min-h-[90px] border border-gray-300 dark:border-neutral-700 rounded-lg p-2 bg-transparent outline-none text-sm"
          value={caption}
          onChange={onCaptionChange}
          onKeyUp={(e) => { detectMention(e.target.value, e.target.selectionStart); detectHashtag(e.target.value, e.target.selectionStart); }}
          onClick={(e) => { detectMention(e.target.value, e.target.selectionStart); detectHashtag(e.target.value, e.target.selectionStart); }}
        />
        {mentionQuery != null && mentionQuery.length >= 1 && (
          <div className="absolute z-20 left-2 right-2 mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {mentionLoading ? (
              <div className="p-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Đang tìm...</div>
            ) : mentionResults.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">Không tìm thấy người dùng.</div>
            ) : (
              mentionResults.map((u) => (
                <button key={u.id} type="button" onClick={() => pickMention(u)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 text-left">
                  <img src={u.photo || PLACEHOLDER} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">@{u.username}</div>
                    {u.name && <div className="text-xs text-gray-500 truncate">{u.name}</div>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
        {hashtagQuery != null && hashtagQuery.length >= 1 && (
          <div className="absolute z-20 left-2 right-2 mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {hashtagLoading ? (
              <div className="p-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Đang tìm...</div>
            ) : hashtagResults.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">Chưa có hashtag nào khớp — bấm Chia sẻ sẽ tự tạo hashtag mới.</div>
            ) : (
              hashtagResults.map((h) => (
                <button key={h.id} type="button" onClick={() => pickHashtag(h)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 text-left">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center shrink-0"><Hash size={16} /></div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">#{h.name}</div>
                    <div className="text-xs text-gray-500 truncate">{h.postCount || 0} bài viết</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <select value={visibility} onChange={(e) => setVisibility(e.target.value)}
        className="mt-3 w-full border border-gray-300 dark:border-neutral-700 rounded-lg p-2 bg-transparent text-sm">
        <option value="PUBLIC">Công khai</option>
        <option value="FOLLOWERS">Người theo dõi</option>
        <option value="FRIENDS">Bạn bè</option>
        <option value="PRIVATE">Chỉ mình tôi</option>
      </select>

      <button className="mt-3 w-full px-3 py-2 bg-neutral-900 hover:bg-black text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        onClick={share} disabled={sharing}>
        {sharing && <Loader2 size={16} className="animate-spin" />}
        {sharing ? "Đang đăng..." : "Chia sẻ"}
      </button>
    </Modal>
  );
}
