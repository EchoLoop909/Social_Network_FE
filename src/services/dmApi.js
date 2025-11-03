import { mockApiCall } from "./apiMock";
import { threadsSeed, users } from "./data/seed";

export function getThreads() {
  return mockApiCall(() => {
    const enriched = threadsSeed.map((t) => ({
      ...t,
      partner: users.find((u) => u.id !== "u_me" && t.users.includes(u.id)),
    }));
    return { threads: enriched };
  });
}

export function getMessages(threadId) {
  return mockApiCall(() => {
    const t = threadsSeed.find((x) => x.id === threadId);
    if (!t) throw new Error("Thread not found");
    return { threadId, messages: t.messages };
  });
}

export function sendMessage(threadId, text) {
  return mockApiCall(() => {
    const t = threadsSeed.find((x) => x.id === threadId);
    if (!t) throw new Error("Thread not found");
    const m = { id: "m_" + Date.now(), from: "u_me", text, ts: Date.now() };
    t.messages.push(m);
    t.unreadCount = 0;
    return { threadId, message: m };
  });
}
