import { mockApiCall } from "./apiMock";
import { notificationsSeed } from "./data/seed";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const NOTIFS = {
  thisWeek: [
    {
      id: "n1",
      avatar: "https://picsum.photos/id/1011/80/80",
      title: "phamnamphong092012",
      text: "đã bắt đầu theo dõi bạn.",
      time: "1 ngày",
      action: "follow-back",
    },
    {
      id: "n2",
      avatar: "https://picsum.photos/id/1027/80/80",
      title: "vutienanhh",
      text: "đã bắt đầu theo dõi bạn.",
      time: "3 ngày",
      action: "follow-back",
    },
    {
      id: "n3",
      avatar: "https://picsum.photos/id/1020/80/80",
      title: "nquyn.hue",
      text: "đã thích tin của bạn.",
      time: "3 ngày",
      thumb: "https://picsum.photos/id/1044/56/56",
    },
  ],
  thisMonth: [
    {
      id: "n4",
      avatar: "https://picsum.photos/id/1005/80/80",
      title: "_bunsayhi",
      text: "đã bắt đầu theo dõi bạn.",
      time: "3 tuần",
      action: "follow-back",
    },
  ],
  earlier: [
    {
      id: "n5",
      avatar: "https://picsum.photos/id/1003/80/80",
      title: "Tin của bạn",
      text: "có 2 cảm xúc trên Facebook.",
      time: "21 thg 9",
    },
  ],
};

export async function getNotifications() {
  await wait(300);
  return NOTIFS;
}

export function markAllRead() {
  return mockApiCall(() => {
    notificationsSeed.forEach((n) => (n.read = true));
    return { ok: true };
  });
}
