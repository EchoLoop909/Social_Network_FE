import { useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, X, ImagePlus, Plus, GripVertical } from "lucide-react";
import Modal from "../../components/Modal";
import { createPostThunk } from "../../store/feedSlice";
import { uploadMedia } from "../../services/postApi";

export default function CreatePostDialog({ open, onClose }) {
  const dispatch = useDispatch();
  // Mỗi item: { id, file, url, isVideo } — 1 mảng duy nhất để xóa/sắp thứ tự luôn đồng bộ
  const [items, setItems] = useState([]);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [sharing, setSharing] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const reset = () => {
    items.forEach((it) => URL.revokeObjectURL(it.url));
    setItems([]);
    setCaption("");
    setVisibility("PUBLIC");
    setSharing(false);
    setDragIdx(null);
    setOverIdx(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  // Chọn file -> append vào danh sách (cho phép chọn thêm nhiều lần)
  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    const mapped = picked.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2)}`,
      file: f,
      url: URL.createObjectURL(f),
      isVideo: f.type.startsWith("video"),
    }));
    setItems((prev) => [...prev, ...mapped]);
    e.target.value = ""; // reset để chọn lại cùng 1 file vẫn kích hoạt onChange
  };

  // Xóa 1 ảnh khỏi danh sách (chưa gọi API nên chỉ xóa ở client)
  const removeAt = (i) => {
    setItems((prev) => {
      const it = prev[i];
      if (it) URL.revokeObjectURL(it.url);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  // Kéo-thả sắp thứ tự (bấm giữ để kéo)
  const onDragStart = (i) => setDragIdx(i);
  const onDragOver = (e, i) => {
    e.preventDefault();
    if (i !== overIdx) setOverIdx(i);
  };
  const onDrop = (i) => {
    setItems((prev) => {
      if (dragIdx === null || dragIdx === i) return prev;
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(i, 0, moved);
      return next;
    });
    setDragIdx(null);
    setOverIdx(null);
  };

  const share = async () => {
    if (items.length === 0 && !caption.trim()) {
      alert("Chọn ảnh/video hoặc nhập nội dung");
      return;
    }
    setSharing(true);
    try {
      let media = [];
      if (items.length > 0) {
        // Thứ tự file = thứ tự hiển thị đã sắp -> BE gán 'order' theo thứ tự này
        media = await uploadMedia(items.map((it) => it.file));
      }
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
        <button onClick={close} className="text-gray-500 hover:opacity-70">
          <X size={20} />
        </button>
      </div>

      {!hasSelection ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-xl">
          <ImagePlus size={48} className="mx-auto text-gray-400 mb-3" />
          <label className="px-4 py-2 bg-insta-primary text-white rounded-lg cursor-pointer inline-block">
            Chọn ảnh/video từ máy
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />
          </label>
          <p className="text-xs text-gray-400 mt-3">Có thể chọn nhiều tệp</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Preview + xóa + kéo sắp thứ tự */}
          <div>
            <p className="text-xs text-gray-400 mb-2">
              Kéo để sắp thứ tự · di chuột vào ảnh để xóa. Số ở góc là thứ tự đăng.
            </p>
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {items.map((p, i) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={() => onDrop(i)}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  className={`group relative rounded overflow-hidden cursor-grab active:cursor-grabbing border-2 transition
                    ${overIdx === i && dragIdx !== null ? "border-insta-primary" : "border-transparent"}
                    ${dragIdx === i ? "opacity-50" : ""}`}
                  title="Kéo để đổi thứ tự"
                >
                  {p.isVideo ? (
                    <video src={p.url} className="object-cover w-full aspect-square pointer-events-none" />
                  ) : (
                    <img src={p.url} alt="" className="object-cover w-full aspect-square pointer-events-none" />
                  )}

                  {/* Số thứ tự */}
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[11px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                    {i + 1}
                  </span>

                  {/* Tay cầm kéo */}
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition">
                    <GripVertical size={12} />
                  </span>

                  {/* Nút xóa */}
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    title="Xóa ảnh này"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Thêm ảnh */}
              <label className="flex flex-col items-center justify-center gap-1 aspect-square rounded border-2 border-dashed border-gray-300 dark:border-neutral-700 text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800">
                <Plus size={20} />
                <span className="text-[11px]">Thêm</span>
                <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFiles} />
              </label>
            </div>
          </div>

          {/* Nội dung */}
          <div className="flex flex-col">
            <textarea
              placeholder="Viết chú thích..."
              className="flex-1 min-h-[120px] border border-gray-300 dark:border-neutral-700 rounded-lg p-2 bg-transparent outline-none text-sm"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="mt-2 border border-gray-300 dark:border-neutral-700 rounded-lg p-2 bg-transparent text-sm"
            >
              <option value="PUBLIC">Công khai</option>
              <option value="FOLLOWERS">Người theo dõi</option>
              <option value="PRIVATE">Chỉ mình tôi</option>
            </select>
            <button
              className="mt-2 px-3 py-2 bg-insta-primary text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              onClick={share}
              disabled={sharing}
            >
              {sharing && <Loader2 size={16} className="animate-spin" />}
              {sharing ? "Đang đăng..." : "Chia sẻ"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
