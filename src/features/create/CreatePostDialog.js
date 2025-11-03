import { useState } from "react";
import Modal from "../../components/Modal";
import { createPostThunk } from "../../store/feedSlice";
import { useDispatch } from "react-redux";

export default function CreatePostDialog({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const dispatch = useDispatch();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setStep(2);
    }
  };

  const share = () => {
    dispatch(createPostThunk({ files: [preview], caption }));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      {step === 1 ? (
        <div className="text-center py-20">
          <h2 className="text-lg font-semibold mb-4">Tạo bài viết mới</h2>
          <label className="px-4 py-2 bg-insta-primary text-white rounded cursor-pointer">
            Chọn ảnh từ máy
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <img
            src={preview}
            alt=""
            className="rounded-lg object-cover w-full"
          />
          <div className="flex flex-col">
            <textarea
              placeholder="Viết chú thích..."
              className="flex-1 border border-gray-300 dark:border-neutral-700 rounded-lg p-2 bg-transparent outline-none"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <button
              className="mt-2 px-3 py-2 bg-insta-primary text-white rounded-lg"
              onClick={share}
            >
              Chia sẻ
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
