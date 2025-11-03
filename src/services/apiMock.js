// Độ trễ giả lập: 300ms đến 800ms
const MOCK_LATENCY = () => Math.random() * 500 + 300;

/**
 * Hàm bao bọc để giả lập cuộc gọi API.
 * @param {function} resolver - Hàm trả về dữ liệu thành công.
 * @param {boolean} [shouldFail=false] - Cờ để giả lập lỗi.
 * @returns {Promise<any>}
 */
export function mockApiCall(resolver, shouldFail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject({ message: "Lỗi kết nối hoặc dữ liệu không hợp lệ." });
      } else {
        try {
          const data = resolver();
          resolve(data);
        } catch (error) {
          reject({ message: `Lỗi xử lý mock: ${error.message}` });
        }
      }
    }, MOCK_LATENCY());
  });
}
