Ứng dụng Instagram Clone (React + Redux + Tailwind)

Đây là mã nguồn cho ứng dụng Instagram Clone, được xây dựng theo kiến trúc Front-end hiện đại với React, Redux Toolkit, và Tailwind CSS.

Tất cả các hàm API được mock (giả lập) với độ trễ để mô phỏng hành vi của ứng dụng thực tế.

⚙️ Cài đặt & Khởi chạy

Để chạy ứng dụng, bạn cần có Node.js (phiên bản >= 18) và npm.

Bước 1: Cài đặt Dependencies

Mở terminal trong thư mục gốc của dự án và chạy lệnh:

npm install

Bước 2: Khởi chạy Ứng dụng

Sau khi cài đặt xong, khởi chạy ứng dụng:

npm start

Ứng dụng sẽ tự động mở trong trình duyệt tại http://localhost:3000.

📁 Cấu trúc Project

Dự án được tổ chức theo cấu trúc feature-first, tuân thủ các quy ước Redux và React:

/src
/assets (Hình ảnh mock, icon custom)
/components (UI dùng chung: Button, Modal, Avatar...)
/features (Logic theo tính năng: feed, auth, dm...)
/layouts (Bố cục trang: MainLayout)
/pages (Container cho các Route)
/services (Các hàm gọi API Mock)
/store (Cấu hình Redux Store, Slices)
/styles (CSS toàn cục)
/utils (Các hàm tiện ích)
App.js
index.js
# Social_Network_FE
