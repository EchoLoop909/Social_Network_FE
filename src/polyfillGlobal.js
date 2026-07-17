// Phải chạy TRƯỚC khi sockjs-client được nạp: nó tham chiếu biến `global`
// vốn không tồn tại trên trình duyệt (CRA5). Gán global = window để tránh lỗi "global is not defined".
if (typeof window.global === "undefined") {
  window.global = window;
}
