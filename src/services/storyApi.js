import { mockApiCall } from "./apiMock";
import { stories } from "./data/seed";

export function getStories() {
  return mockApiCall(() => ({ stories }));
}

export function markStorySeen(storyId) {
  return mockApiCall(() => {
    const s = stories.find((x) => x.id === storyId);
    if (s) s.seen = true;
    return { storyId };
  });
}
