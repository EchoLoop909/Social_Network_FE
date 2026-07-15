import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Trash2, X, ChevronLeft, ChevronRight, Loader2, AlertCircle, Check, Star } from "lucide-react";
import Modal from "../components/Modal";
import { getStories, createStory, deleteStory, uploadStoryMedia } from "../services/storyRealApi";

const PLACEHOLDER = "https://via.placeholder.com/64?text=?";

function displayName(u) {
  if (!u) return "Người dùng";
  const full = [u.lastname, u.firstname].filter(Boolean).join(" ").trim();
  return full || u.name || u.username || "Người dùng";
}

function fmt(dt) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString("vi-VN");
  } catch {
    return dt;
  }
}

export default function StoriesPage() {
  const [ownerId, setOwnerId] = useState(""); // rỗng = story của mình
  const [ownerInput, setOwnerInput] = useState("");
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [viewIdx, setViewIdx] = useState(null); // null = đóng viewer
  const [busyId, setBusyId] = useState(null);

  // Modal đăng story
  const [openCreate, setOpenCreate] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploaded, setUploaded] = useState(null); // { url, type }
  const [caption, setCaption] = useState("");
  const [isArchived, setIsArchived] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // id của mình (từ 'sub' trong access_token) để biết story nào được phép xóa
  const meId = useMemo(() => {
    try {
      const t = JSON.parse(localStorage.getItem("auth_tokens") || "null");
      if (!t?.access_token) return null;
      return JSON.parse(atob(t.access_token.split(".")[1]))?.sub || null;
    } catch {
      return null;
    }
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

  useEffect(() => {
    load();
  }, [load]);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  // Chọn file -> preview + upload lấy URL
  async function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploaded(null);
    setUploading(true);
    setErr("");
    try {
      const media = await uploadStoryMedia(f);
      if (!media?.url) throw new Error("Upload không trả về URL");
      setUploaded({ url: media.url, type: media.type || (f.type.startsWith("video") ? "VIDEO" : "IMAGE") });
    } catch (e2) {
      setErr(e2?.message || "Upload media thất bại");
    } finally {
      setUploading(false);
    }
  }

  function resetCreate() {
    setFile(null);
    setPreview("");
    setUploaded(null);
    setCaption("");
    setIsArchived(false);
    setUploading(false);
    setSubmitting(false);
  }

  async function onSubmitCreate() {
    if (!uploaded?.url) return;
    setSubmitting(true);
    setErr("");
    try {
      await createStory({
        mediaUrl: uploaded.url,
        mediaType: uploaded.type,
        caption: caption.trim() || null,
        isArchived,
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
        // điều chỉnh viewer nếu đang mở
        setViewIdx((idx) => {
          if (idx == null) return idx;
          if (next.length === 0) return null;
          return Math.min(idx, next.length - 1);
        });
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

      {/* Xem story của user khác theo id (bỏ trống = của bạn) */}
      <div className="flex gap-2 mb-5">
        <input
          value={ownerInput}
          onChange={(e) => setOwnerInput(e.target.value)}
          placeholder="Nhập userId để xem story người khác (bỏ trống = của bạn)"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setOwnerId(ownerInput.trim())}
          className="bg-gray-200 dark:bg-neutral-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-300"
        >
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
        <div className="flex items-center gap-2 text-gray-500 py-20 justify-center">
          <Loader2 className="animate-spin" /> Đang tải...
        </div>
      ) : stories.length === 0 ? (
        <div className="text-sm text-gray-500 py-16 text-center border rounded-xl bg-white dark:bg-neutral-800">
          Chưa có story nào.
        </div>
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
                    <span className="absolute top-1 right-1 bg-yellow-400 text-black rounded-full p-1" title="Highlight">
                      <Star size={12} />
                    </span>
                  )}
                </div>
              </button>
              <div className="mt-1 flex items-center gap-1">
                <img src={s.user?.photo || PLACEHOLDER} alt="" className="w-5 h-5 rounded-full object-cover bg-gray-200" />
                <span className="text-xs truncate flex-1">{displayName(s.user)}</span>
              </div>
              {canDelete(s) && (
                <button
                  disabled={busyId === s.id}
                  onClick={() => onDelete(s)}
                  className="mt-1 w-full flex items-center justify-center gap-1 text-xs text-red-600 hover:bg-red-50 rounded py-1 disabled:opacity-50"
                >
                  {busyId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Xóa
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ============ Viewer ============ */}
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
                <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Star size={12} /> Highlight
                </span>
              )}
              <button onClick={() => setViewIdx(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="aspect-[9/16] max-h-[70vh] mx-auto bg-black rounded-xl overflow-hidden flex items-center justify-center">
              {viewing.mediaType === "VIDEO" ? (
                <video src={viewing.mediaUrl} className="w-full h-full object-contain" controls autoPlay />
              ) : (
                <img src={viewing.mediaUrl} alt="" className="w-full h-full object-contain" />
              )}
            </div>

            {viewing.caption && <div className="mt-2 text-sm">{viewing.caption}</div>}
            <div className="mt-1 text-xs text-gray-400">Hết hạn: {fmt(viewing.expiresAt)}</div>

            {/* Điều hướng */}
            <button
              onClick={() => setViewIdx((i) => Math.max(0, i - 1))}
              disabled={viewIdx === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 disabled:opacity-30"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => setViewIdx((i) => Math.min(stories.length - 1, i + 1))}
              disabled={viewIdx === stories.length - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 disabled:opacity-30"
            >
              <ChevronRight size={22} />
            </button>

            {canDelete(viewing) && (
              <button
                disabled={busyId === viewing.id}
                onClick={() => onDelete(viewing)}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-lg py-2 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
              >
                {busyId === viewing.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Xóa story
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* ============ Modal đăng story ============ */}
      <Modal open={openCreate} onClose={() => { setOpenCreate(false); resetCreate(); }}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Đăng story</h2>
            <button onClick={() => { setOpenCreate(false); resetCreate(); }} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full">
              <X size={20} />
            </button>
          </div>

          {!preview ? (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-xl py-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800">
              <Plus size={28} className="text-gray-400" />
              <span className="text-sm text-gray-500">Chọn ảnh hoặc video</span>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={onPickFile} />
            </label>
          ) : (
            <div className="aspect-[9/16] max-h-[50vh] mx-auto bg-black rounded-xl overflow-hidden flex items-center justify-center relative">
              {file?.type?.startsWith("video") ? (
                <video src={preview} className="w-full h-full object-contain" controls />
              ) : (
                <img src={preview} alt="" className="w-full h-full object-contain" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white gap-2 text-sm">
                  <Loader2 className="animate-spin" /> Đang tải lên...
                </div>
              )}
            </div>
          )}

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Chú thích (tùy chọn)..."
            rows={2}
            maxLength={2200}
            className="mt-3 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="mt-2 flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} />
            Lưu vào Highlights (không tự xóa sau 24h)
          </label>

          <button
            disabled={!uploaded?.url || uploading || submitting}
            onClick={onSubmitCreate}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />} Đăng
          </button>
        </div>
      </Modal>
    </div>
  );
}
