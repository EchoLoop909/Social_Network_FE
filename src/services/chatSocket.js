import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { BE_URL } from "../config";

/**
 * Tạo + kết nối STOMP client qua SockJS tới /ws.
 * onConnect: callback gọi khi kết nối thành công (để subscribe topic).
 * Trả về client (nhớ client.deactivate() khi unmount).
 */
export function connectChat(onConnect) {
  const client = new Client({
    webSocketFactory: () => new SockJS(BE_URL + "/ws"),
    reconnectDelay: 3000, // tự kết nối lại sau 3s nếu rớt
    onConnect,
    // onStompError: (f) => console.error("STOMP error", f),
  });
  client.activate();
  return client;
}
