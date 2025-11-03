import { useSelector } from "react-redux";

export default function SavedPage() {
  const { items } = useSelector((s) => s.feed);
  const saved = items.filter((p) => p.savedByMe);
  return (
    <div className="p-6 grid grid-cols-3 gap-2 max-w-[950px]">
      {saved.map((p) => (
        <img
          key={p.id}
          src={p.images[0]}
          alt=""
          className="w-full h-64 object-cover rounded"
        />
      ))}
      {!saved.length && <div className="text-gray-500">Chưa lưu bài nào.</div>}
    </div>
  );
}
