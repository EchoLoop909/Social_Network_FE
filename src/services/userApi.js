import { mockApiCall } from "./apiMock";
import { currentUser, users, suggestions } from "./data/seed";

export function getMe() {
  return mockApiCall(() => ({ me: currentUser }));
}

export function getSuggestions() {
  return mockApiCall(() => {
    const enriched = suggestions.map((s) => ({
      ...s,
      user: users.find((u) => u.id === s.userId),
    }));
    return { suggestions: enriched };
  });
}

export function toggleFollow(suggestId) {
  return mockApiCall(() => {
    const s = suggestions.find((x) => x.id === suggestId);
    if (!s) throw new Error("Not found");
    s.followed = !s.followed;
    return { suggestId, followed: s.followed };
  });
}
