import { mockApiCall } from "./apiMock";
import { users, exploreSeed } from "./data/seed";

// delay helper
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ACCOUNTS = [
  {
    id: "1",
    username: "vutienanhh",
    name: "Vũ Tiên Anh",
    avatar: "https://picsum.photos/id/64/80/80",
    note: "",
  },
  {
    id: "2",
    username: "xiaoyan2000",
    name: "Anh Yen Nguyen",
    avatar: "https://picsum.photos/id/65/80/80",
    note: "Đang theo dõi",
  },
  {
    id: "3",
    username: "cake.bymup",
    name: "Tiệm bánh Cake By Mup",
    avatar: "https://picsum.photos/id/66/80/80",
    note: "Có nq... theo dõi",
  },
  {
    id: "4",
    username: "metucakeshop",
    name: "Metu Cake Shop",
    avatar: "https://picsum.photos/id/67/80/80",
    note: "Có 7 người nữa theo dõi",
  },
  {
    id: "5",
    username: "lilicake.hn",
    name: "LiLi Cake sinh nhật Hà Nội",
    avatar: "https://picsum.photos/id/68/80/80",
    note: "Có nquyn.hue + 3",
  },
  {
    id: "6",
    username: "ngocpink.cake",
    name: "Ngoc Pink Cake",
    avatar: "https://picsum.photos/id/69/80/80",
    note: "Có nhungmiu... + 2",
  },
  {
    id: "7",
    username: "cake_july",
    name: "Cake July",
    avatar: "https://picsum.photos/id/70/80/80",
    note: "Có nquyn.hue + 3",
  },
];

let recent = [
  {
    id: "1",
    username: "vutienanhh",
    name: "Vũ Tiên Anh",
    avatar: "https://picsum.photos/id/64/80/80",
  },
  {
    id: "2",
    username: "xiaoyan2000",
    name: "Anh Yen Nguyen",
    avatar: "https://picsum.photos/id/65/80/80",
    subtitle: "Đang theo dõi",
  },
];

export async function searchAll(q) {
  await wait(350);
  const k = (q || "").toLowerCase();
  if (!k) return [];
  return ACCOUNTS.filter(
    (a) =>
      a.username.toLowerCase().includes(k) || a.name.toLowerCase().includes(k)
  );
}

export async function getRecent() {
  await wait(200);
  return recent;
}
export async function addRecent(item) {
  await wait(100);
  recent = [item, ...recent.filter((r) => r.id !== item.id)].slice(0, 8);
  return recent;
}
export async function removeRecent(id) {
  await wait(100);
  recent = recent.filter((r) => r.id !== id);
  return recent;
}
export async function clearRecent() {
  await wait(120);
  recent = [];
  return recent;
}

export function getExplore() {
  return mockApiCall(() => ({ items: exploreSeed }));
}
