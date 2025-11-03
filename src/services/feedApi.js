import { mockApiCall } from "./apiMock";
import { posts, currentUser, users } from "./data/seed";

/**
 * Lấy danh sách bài đăng.
 */
export function getFeed({ cursor = 0, limit = 5 } = {}) {
  return mockApiCall(() => {
    const startIndex = cursor;
    const endIndex = Math.min(startIndex + limit, posts.length);
    const hasMore = endIndex < posts.length;

    return {
      posts: posts.slice(startIndex, endIndex),
      nextCursor: hasMore ? endIndex : null,
      currentUser,
      users,
    };
  });
}

export function likePost(postId) {
  return mockApiCall(() => {
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error("Không tìm thấy bài đăng.");

    post.likedByMe = !post.likedByMe;
    post.likes += post.likedByMe ? 1 : -1;

    return { postId, likes: post.likes, likedByMe: post.likedByMe };
  });
}

export function savePost(postId) {
  return mockApiCall(() => {
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error("Không tìm thấy bài đăng.");
    post.savedByMe = !post.savedByMe;
    return { postId, savedByMe: post.savedByMe };
  });
}

export function addComment(postId, content) {
  return mockApiCall(() => {
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error("Không tìm thấy bài đăng.");
    const c = {
      id: "c_" + Math.random().toString(36).slice(2),
      userId: "u_me",
      content,
      ts: Date.now(),
    };
    post.comments.push(c);
    return { postId, comment: c };
  });
}

export function createPost({ files, caption }) {
  return mockApiCall(() => {
    const p = {
      id: "p" + (posts.length + 1),
      authorId: "u_me",
      images: files?.length ? files : [posts[0].images[0]],
      likes: 0,
      likedByMe: false,
      savedByMe: false,
      caption: caption || "",
      ts: Date.now(),
      comments: [],
    };
    posts.unshift(p);
    return { post: p };
  });
}
