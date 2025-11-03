import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getFeed,
  likePost,
  savePost,
  addComment,
  createPost,
} from "../services/feedApi";

export const fetchFeed = createAsyncThunk(
  "feed/fetch",
  async (cursor, { getState }) => {
    const { feed } = getState();
    const cur = cursor ?? feed.nextCursor ?? 0;
    const res = await getFeed({ cursor: cur, limit: 5 });
    return res;
  }
);

export const toggleLike = createAsyncThunk("feed/like", async (postId) => {
  return await likePost(postId);
});

export const toggleSave = createAsyncThunk("feed/save", async (postId) => {
  return await savePost(postId);
});

export const submitComment = createAsyncThunk(
  "feed/comment",
  async ({ postId, content }) => {
    return await addComment(postId, content);
  }
);

export const createPostThunk = createAsyncThunk(
  "feed/createPost",
  async (payload) => {
    return await createPost(payload);
  }
);

const slice = createSlice({
  name: "feed",
  initialState: {
    items: [],
    nextCursor: 0,
    users: [],
    status: "idle",
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchFeed.pending, (s) => {
      s.status = "loading";
    });
    b.addCase(fetchFeed.fulfilled, (s, a) => {
      const { posts, nextCursor, users } = a.payload;
      s.items = [...s.items, ...posts];
      s.nextCursor = nextCursor;
      s.users = users;
      s.status = "succeeded";
    });
    b.addCase(toggleLike.fulfilled, (s, a) => {
      const p = s.items.find((x) => x.id === a.payload.postId);
      if (p) {
        p.likedByMe = a.payload.likedByMe;
        p.likes = a.payload.likes;
      }
    });
    b.addCase(toggleSave.fulfilled, (s, a) => {
      const p = s.items.find((x) => x.id === a.payload.postId);
      if (p) p.savedByMe = a.payload.savedByMe;
    });
    b.addCase(submitComment.fulfilled, (s, a) => {
      const p = s.items.find((x) => x.id === a.payload.postId);
      if (p) p.comments.push(a.payload.comment);
    });
    b.addCase(createPostThunk.fulfilled, (s, a) => {
      s.items.unshift(a.payload.post);
    });
  },
});

export default slice.reducer;
