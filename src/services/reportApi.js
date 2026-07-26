import { instance } from "./api";

// Tầng gọi API báo cáo vi phạm (ReportController, prefix /report).

/** Danh mục lý do báo cáo (report_reasons) — hiện cho user chọn khi báo cáo bài viết. */
export async function getReportReasons() {
  const env = await instance.get("/report/reasons");
  return Array.isArray(env?.Object) ? env.Object : [];
}

/** Gửi báo cáo 1 bài viết. reporterId lấy từ token, không cần truyền lên. */
export async function reportPost(postId, reportReasonId, extraInformation) {
  const env = await instance.post("/report/insert", { postId, reportReasonId, extraInformation });
  return env?.Errors?.message || "SUBMIT REPORT SUCCESS";
}
