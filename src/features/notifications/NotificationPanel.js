import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { fetchNotifs, markAllNotifsRead, markOneRead, deleteOneNotif } from "../../store/notifSlice";

const PLACEHOLDER = "https://via.placeholder.com/80?text=?";

// Câu mô tả theo loại thông báo
function notifText(type) {
  switch (type) {
    case "MESSAGE": return "đã nhắn tin cho bạn.";
    case "LIKE": return "đã thích bài viết của bạn.";
    case "COMMENT": return "đã bình luận bài viết của bạn.";
    case "REPLY": return "đã trả lời bình luận của bạn.";
    case "FOLLOW": return "đã chấp nhận lời mời kết bạn.";
    case "FOLLOW_REQUEST": return "đã gửi cho bạn lời mời kết bạn.";
    case "TAG": return "đã nhắc đến bạn trong một bài viết.";
    case "REPORT": return "đã gửi một báo cáo bài viết mới.";
    default: return "có thông báo mới.";
  }
}

function fmtAgo(dt) {
  if (!dt) return "";
  try {
    const diff = Math.max(0, Date.now() - new Date(dt).getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return "vừa xong";
    if (m < 60) return `${m} phút`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} ngày`;
    const w = Math.floor(d / 7);
    return `${w} tuần`;
  } catch { return ""; }
}

export default function NotificationPanel({ onClose, onReportClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((s) => s.notifications.items);

  useEffect(() => {
    dispatch(fetchNotifs());
  }, [dispatch]);

  const onClickItem = (n) => {
    if (!n.isRead) dispatch(markOneRead(n.id));
    switch (n.type) {
      case "MESSAGE":
        navigate("/inbox");
        break;
      case "FOLLOW_REQUEST":
        // Ai đã gửi lời mời kết bạn cho mình -> mở tab "Lời mời kết bạn"
        navigate("/friends?tab=requests");
        break;
      case "FOLLOW":
        // Người đã chấp nhận -> mở trang cá nhân của họ (hoặc danh sách bạn bè)
        navigate(n.actorId ? `/u/${n.actorId}` : "/friends?tab=all");
        break;
      case "LIKE":
      case "COMMENT":
      case "REPLY":
      case "TAG":
        // Bài viết được tương tác / được nhắc đến (targetId = id bài viết)
        if (n.targetId) navigate(`/post/${n.targetId}`);
        break;
      case "REPORT":
        // Chỉ admin nhận loại này — để trang admin tự điều hướng sang tab "Báo cáo".
        if (onReportClick) onReportClick(n);
        break;
      default:
        break;
    }
    onClose?.();
  };

  // Nhóm theo mốc thời gian
  const now = Date.now();
  const buckets = { week: [], month: [], earlier: [] };
  items.forEach((n) => {
    const days = (now - new Date(n.createTime).getTime()) / 86400000;
    if (days <= 7) buckets.week.push(n);
    else if (days <= 30) buckets.month.push(n);
    else buckets.earlier.push(n);
  });

  const Section = ({ title, list }) =>
    list.length === 0 ? null : (
      <>
        <h3 className="text-sm font-semibold text-gray-500 mb-3 mt-4">{title}</h3>
        <ul className="space-y-4">
          {list.map((n) => (
            <li
              key={n.id}
              onClick={() => onClickItem(n)}
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-900 -mx-2 px-2 py-1 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img src={n.actorPhoto || PLACEHOLDER} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                <div className="text-sm min-w-0">
                  <span className="font-semibold">{n.actorName || "Ai đó"}</span>{" "}
                  <span>{notifText(n.type)}</span>
                  {n.message ? (
                    <div className="text-gray-500 truncate max-w-[220px]">{n.message}</div>
                  ) : null}
                  <div className="text-gray-400 text-[12px]">{fmtAgo(n.createTime)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.isRead ? <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> : null}
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch(deleteOneNotif(n.id)); }}
                  title="Xóa thông báo"
                  className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <X size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </>
    );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Thông báo</h2>
        {items.length > 0 && (
          <button onClick={() => dispatch(markAllNotifsRead())} className="text-sm text-blue-500 hover:text-blue-600">
            Đánh dấu đã đọc
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-gray-500 mt-4">Chưa có thông báo nào.</div>
      ) : (
        <>
          <Section title="Tuần này" list={buckets.week} />
          <Section title="Tháng này" list={buckets.month} />
          <Section title="Trước đó" list={buckets.earlier} />
        </>
      )}
    </div>
  );
}
