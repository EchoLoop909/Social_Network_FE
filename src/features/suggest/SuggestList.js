import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchSuggestions, followToggle } from "../../store/suggestSlice";
import Avatar from "../../components/Avatar";

export default function SuggestList() {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.suggest);

  useEffect(() => {
    if (!items.length) dispatch(fetchSuggestions());
  }, [dispatch, items.length]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">Gợi ý cho bạn</div>
        <button className="text-xs">Xem tất cả</button>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((s) => (
          <li key={s.id} className="flex items-center gap-3">
            <Avatar src={s.user.avatar} size={36} />
            <div className="text-sm flex-1">
              <div className="font-semibold">{s.user.username}</div>
              <div className="text-gray-400 text-[12px]">{s.user.name}</div>
            </div>
            <button
              onClick={() => dispatch(followToggle(s.id))}
              className={`text-sm font-semibold ${
                s.followed ? "text-gray-400" : "text-insta-primary"
              }`}
            >
              {s.followed ? "Đang theo dõi" : "Theo dõi"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
