import { useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, X, ImagePlus } from "lucide-react";
import Modal from "../../components/Modal";
import { createPostThunk } from "../../store/feedSlice";
import { uploadMedia } from "../../services/postApi";

export default function CreatePostDialog({ open, onClose }) {
  const dispatch = useDispatch();
  const [files, setFiles] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // { url, isVideo }
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [sharing, setSharing] = useState(false);

  const reset = () => {
    setFiles([]);
    setPreviews([]);
    setCaption("");
    setVisibility("PUBLIC");
    setSharing(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setFiles(picked);
    setPreviews(
      picked.map((f) => ({ url: URL.createObjectURL(f), isVideo: f.type.startsWith("video") }))
    );
  };

  const share = async () => {
    if (files.length === 0 && !caption.trim()) {
      alert("Chọn ảnh/video hoặc nhập nội dung");
      return;
    }
    setSharing(true);
    try {
      let media = [];
      if (files.length > 0) {
        media = await uploadMedia(files); // [{url,type,width,height,durationSec,order}]
      }
      await dispatch(createPostThunk({ text: caption, visibility, media })).unwrap();
      close();
    } catch (e) {
      alert("Đăng bài thất bại: " + e);
      setSharing(false);
    }
  };

  const hasSelection = previews.length > 0;

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
          {/* Preview */}
          <div className="grid grid-cols-2 gap-1 max-h-72 overflow-y-auto">
            {previews.map((p, i) =>
              p.isVideo ? (
                <video key={i} src={p.url} className="rounded object-cover w-full aspect-square" />
              ) : (
                <img key={i} src={p.url} alt="" className="rounded object-cover w-full aspect-square" />
              )
            )}
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
