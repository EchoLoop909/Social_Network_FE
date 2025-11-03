import { useEffect, useState } from "react";
import { getNotifications } from "../../services/notifApi";

export default function NotificationPanel() {
  const [data, setData] = useState({
    thisWeek: [],
    thisMonth: [],
    earlier: [],
  });

  useEffect(() => {
    getNotifications().then(setData);
  }, []);

  const Section = ({ title, items }) => (
    <>
      <h3 className="text-sm font-semibold text-gray-500 mb-3 mt-2">{title}</h3>
      <ul className="space-y-4">
        {items.map((n) => (
          <li key={n.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={n.avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="text-sm min-w-0">
                <span className="font-semibold">{n.title}</span>{" "}
                <span className="truncate inline-block max-w-[220px] align-bottom">
                  {n.text}
                </span>
                <div className="text-gray-400 text-[12px]">{n.time}</div>
              </div>
            </div>
            {n.action === "follow-back" ? (
              <button className="text-sm bg-insta-primary text-white px-3 py-1 rounded">
                Theo dõi lại
              </button>
            ) : n.thumb ? (
              <img
                src={n.thumb}
                className="w-14 h-14 rounded object-cover"
                alt=""
              />
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Thông báo</h2>
      <Section title="Tuần này" items={data.thisWeek} />
      <Section title="Tháng này" items={data.thisMonth} />
      <Section title="Trước đó" items={data.earlier} />
    </div>
  );
}
