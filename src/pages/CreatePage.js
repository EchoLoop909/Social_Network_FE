import { useDispatch } from "react-redux";
import { createPostThunk } from "../store/feedSlice";

export default function CreatePage() {
  const dispatch = useDispatch();
  const onSubmit = (e) => {
    e.preventDefault();
    const caption = e.target.caption.value;
    dispatch(createPostThunk({ files: [], caption }));
    e.target.reset();
    alert("Đã tạo bài (mock) và hiện đầu feed!");
  };
  return (
    <div className="p-6 max-w-xl">
      <div className="text-lg font-semibold mb-4">Tạo bài viết</div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="caption"
          className="w-full border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 bg-transparent outline-none"
          placeholder="Chú thích…"
        />
        <button className="px-3 py-2 rounded-lg bg-insta-primary text-white">
          Đăng
        </button>
      </form>
    </div>
  );
}
