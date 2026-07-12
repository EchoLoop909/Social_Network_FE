import { useState } from "react";
import { useDispatch } from "react-redux";
import Modal from "../../components/Modal";
import { updatePostThunk } from "../../store/feedSlice";

/** Modal sửa bài viết: chỉnh nội dung text + ghim bài. */
export default function EditPostDialog({ open, onClose, post }) {
  const dispatch = useDispatch();
  const [text, setText] = useState(post?.caption || "");
  const [isPinned, setIsPinned] = useState(!!post?.isPinned);
  const [visibility, setVisibility] = useState(post?.visibility || "PUBLIC");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await dispatch(updatePostThunk({ id: post.id, text, isPinned, visibility })).unwrap();
      onClose();
    } catch (e) {
      alert("Sửa bài thất bại: " + e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-3">Chỉnh sửa bài viết</h2>
      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nội dung bài viết..."
        className="w-full resize-none border border-gray-300 dark:border-neutral-700 rounded-lg p-3 bg-transparent outline-none text-sm"
      />
      <div className="mt-3">
        <label className="block text-sm mb-1">Quyền xem</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="w-full border border-gray-300 dark:border-neutral-700 rounded-lg p-2 bg-transparent text-sm"
        >
          <option value="PUBLIC">Công khai</option>
          <option value="FOLLOWERS">Người theo dõi</option>
          <option value="PRIVATE">Chỉ mình tôi</option>
        </select>
      </div>

      <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
        <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
        Ghim bài viết
      </label>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-neutral-700">
          Huỷ
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-insta-primary text-white disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </Modal>
  );
}
