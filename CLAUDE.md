# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Đây là repo **frontend** của project SocialNetwork. Repo backend nằm ở thư mục ngang hàng `../Social_Network_BE`.

## ⚠️ BẮT BUỘC: Xin phép trước khi sửa code

**KHÔNG được tự ý tạo mới / sửa / xóa bất kỳ file code nào.** Trước mọi thay đổi code, PHẢI trình bày rõ kế hoạch (đụng file nào, sửa gì, vì sao) và **chờ người dùng đồng ý rõ ràng** rồi mới thực hiện — người dùng muốn review trước. Đọc/phân tích/giải thích code và chạy lệnh chỉ đọc thì không cần hỏi.

## Lệnh thường dùng

- Cài đặt: `npm install`
- Chạy server dev: `npm start` — cổng **3000**, gọi BE tại `http://localhost:8888` (đổi bằng biến `REACT_APP_BE_URL`)
- Build: `npm run build`
- Test (Jest qua react-scripts): `npm test`; chạy một file: `npm test -- FeedList`

## Kiến trúc Frontend

Cấu trúc theo feature trong `src/`: `components/` (UI dùng chung), `features/` (feed, dm, stories, notifications, search, suggest, create), `pages/` (container cho route), `layouts/MainLayout`, `services/` (tầng API), `store/` (Redux slice), `utils/`.

**State:** Redux Toolkit với mỗi domain một slice (`authSlice`, `feedSlice`, `dmSlice`, …) gộp trong `store/index.js`. Lưu bền qua `redux-persist` nhưng **chỉ `ui` và `feed` nằm trong whitelist** — các slice khác chỉ ở bộ nhớ. `redux-logger` bật ở môi trường development. Store được expose ra `window.__store__` cho `eventBus`.

**Backend thật vs. mock (phân biệt then chốt):** FE là dạng lai.
- Gọi BE thật (qua `services/api.js` / `authApi.js` / `feedApi.js`, base URL từ `config.js`): auth (login/register/logout) và feed bài viết. `feedApi.normalizePost` ánh xạ payload `Object` từ BE sang shape UI và điền các giá trị tạm (likes/comments) mà BE chưa trả về.
- **Mock** với độ trễ giả lập qua `services/apiMock.js` + `services/data/seed.js`: `dmApi`, `notifApi`, `storyApi`, `searchApi`, `userApi`. Coi các file này là fixture, không phải hợp đồng với BE.

**Nối auth:** token lưu trong `localStorage` với key **`auth_tokens`** (phải đồng bộ giữa `App.js`, `authApi.js`, và interceptor axios trong `api.js`). Request interceptor gắn `Authorization: Bearer <access_token>`; khi gặp 401 sẽ xóa token đã lưu. `authApi.extractError` bóc tách envelope lỗi của BE. Bảo vệ route bằng `RequireAuth` trong `App.js`, chặn dựa trên `state.auth.tokens.access_token`. Lưu ý `src/keycloak.js` (keycloak-js) có tồn tại nhưng luồng login đang dùng là proxy qua BE, không gọi keycloak-js trực tiếp.

**Styling:** Tailwind CSS (cấu hình trong `tailwind.config.js`, dark mode bật/tắt bằng class `dark` trên `<html>` điều khiển bởi `ui.theme`) kết hợp component Ant Design (`antd`).
