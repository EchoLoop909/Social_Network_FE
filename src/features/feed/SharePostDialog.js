import { useState } from "react";
import { useDispatch } from "react-redux";
import Modal from "../../components/Modal";
import SharedOriginalCard from "./SharedOriginalCard";
import { sharePostThunk } from "../../store/feedSlice";

/**
 * Modal share (repost nội bộ) 1 bài viết: nhập caption riêng (optional) rồi share.
 * originalPostId = post.id (bài đang bấm share). BE tự trỏ id_original_post về đúng
 * bài này và tăng share_count của nó.
 */
export default function SharePostDialog({ open, onClose, post }) {
  const dispatch = useDispatch();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  // Bài xem trước bên trong: nếu post đang là 1 lượt share thì hiển thị chính nó
  // (author + caption của người share); nếu là bài thường thì dựng shape gọn từ post.
  const preview = {
    author: post.author,
    caption: post.caption,
    media: post.media,
  };

  const submit = async () => {
    setSaving(true);
    try {
      await dispatch(sharePostThunk({ originalPostId: post.id, text })).unwrap();
      setText("");
      onClose();
    } catch (e) {
      alert("Share bài thất bại: " + e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-3">Chia sẻ bài viết</h2>

      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Viết gì đó về bài này... (không bắt buộc)"
        className="w-full resize-none border border-gray-300 dark:border-neutral-700 rounded-lg p-3 bg-transparent outline-none text-sm mb-2"
      />

      {/* Xem trước bài sẽ được share (hiển thị như card lồng) */}
      <SharedOriginalCard original={preview} />

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-neutral-700"
        >
          Huỷ
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-insta-primary text-white disabled:opacity-50"
        >
          {saving ? "Đang chia sẻ..." : "Chia sẻ"}
        </button>
      </div>
    </Modal>
  );
}
