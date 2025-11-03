import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStories } from "../../store/storySlice";
import Avatar from "../../components/Avatar";

export default function StoryRail({ onOpen }) {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.stories);
  useEffect(() => {
    dispatch(fetchStories());
  }, [dispatch]);

  return (
    <div className="flex gap-4 px-4 py-3 overflow-x-auto scroll-thin">
      {items.map((s) => (
        <button key={s.id} onClick={() => onOpen(s.id)} className="text-xs">
          <div className="mx-auto w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-yellow-400">
            <div className={`rounded-full p-[2px] bg-white`}>
              <Avatar src={`/favicon.ico`} size={56} alt="" ring={false} />
            </div>
          </div>
          <div className="mt-1 text-center truncate w-16">
            {s.seen ? <span className="text-gray-400">Đã xem</span> : "Mới"}
          </div>
        </button>
      ))}
    </div>
  );
}
