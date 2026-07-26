import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import Modal from "../../components/Modal";
import { getReportReasons, reportPost } from "../../services/reportApi";

/** Modal chọn lý do báo cáo 1 bài viết, gửi lên BE (ReportController). */
export default function ReportPostDialog({ open, onClose, postId }) {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [extra, setExtra] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(null);
    setExtra("");
    setDone(false);
    getReportReasons()
      .then(setReasons)
      .catch(() => setReasons([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await reportPost(postId, selected, extra.trim() || undefined);
      setDone(true);
    } catch (e) {
      alert("Gửi báo cáo thất bại: " + (e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Báo cáo bài viết</h2>
        <button onClick={onClose} className="text-gray-500 hover:opacity-70"><X size={20} /></button>
      </div>

      {done ? (
        <div className="py-6 text-center">
          <div className="text-sm font-medium mb-1">Đã gửi báo cáo, cảm ơn bạn.</div>
          <div className="text-xs text-gray-500 mb-4">Đội ngũ quản trị sẽ xem xét bài viết này.</div>
          <button onClick={onClose} className="px-4 py-2 bg-insta-primary text-white rounded-lg text-sm">Đóng</button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 text-gray-500 py-8">
          <Loader2 size={16} className="animate-spin" /> Đang tải...
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-2">Vì sao bạn báo cáo bài viết này?</p>
          <div className="max-h-64 overflow-y-auto space-y-1 mb-3">
            {reasons.map((r) => (
              <label
                key={r.id}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer text-sm"
              >
                <input
                  type="radio"
                  name="reportReason"
                  checked={selected === r.id}
                  onChange={() => setSelected(r.id)}
                />
                {r.reason}
              </label>
            ))}
            {reasons.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-4">Không tải được danh sách lý do.</div>
            )}
          </div>

          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Ghi chú thêm (không bắt buộc)..."
            className="w-full min-h-[60px] border border-gray-300 dark:border-neutral-700 rounded-lg p-2 bg-transparent outline-none text-sm mb-3"
          />

          <button
            onClick={submit}
            disabled={!selected || submitting}
            className="w-full px-3 py-2 bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </>
      )}
    </Modal>
  );
}
