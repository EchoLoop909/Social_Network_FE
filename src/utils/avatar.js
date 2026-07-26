// Avatar dùng chung: có ảnh -> dùng ảnh; chưa có -> avatar chữ viết tắt theo tên/username
// (vd "Hiệp Hoàng" -> "HH"), khớp quy ước đã dùng ở StoryBar.js/HomePage.js.
export function avatarSrc(u) {
  return (
    u?.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || u?.username || "User")}`
  );
}
