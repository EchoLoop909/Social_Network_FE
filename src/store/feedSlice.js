import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getFeed } from "../services/feedApi";
import * as likeApi from "../services/likeApi";
import * as postApi from "../services/postApi";

// --- 1. THUNK LẤY FEED (API thật) ---
export const fetchFeed = createAsyncThunk(
  "feed/fetch",
  async (cursor, { getState, rejectWithValue }) => {
    try {
      const { feed } = getState();
      const currentCursor = cursor ?? feed.nextCursor ?? 0;
      const res = await getFeed({ cursor: currentCursor, limit: 10 });
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// --- 2. REACTION (Like 6 loại) ---
// react: tạo mới hoặc đổi loại cảm xúc cho bài viết
export const reactPost = createAsyncThunk(
  "feed/react",
  async ({ postId, reactionType }, { getState, rejectWithValue }) => {
    try {
      const post = getState().feed.items.find((p) => p.id === postId);
      const prev = post?.myReaction ?? null;
      await likeApi.react("POST", postId, reactionType);
      return { postId, reactionType, prev };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// unreact: gỡ cảm xúc của user hiện tại
export const unreactPost = createAsyncThunk(
  "feed/unreact",
  async ({ postId }, { getState, rejectWithValue }) => {
    try {
      const post = getState().feed.items.find((p) => p.id === postId);
      const prev = post?.myReaction ?? null;
      await likeApi.unlike("POST", postId);
      return { postId, prev };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// --- 3. TẠO / SỬA / XOÁ BÀI ---
export const createPostThunk = createAsyncThunk(
  "feed/createPost",
  async (dto, { dispatch, rejectWithValue }) => {
    try {
      await postApi.createPost(dto);
      // insert không trả về bài mới -> nạp lại feed từ đầu
      dispatch(fetchFeed(0));
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updatePostThunk = createAsyncThunk(
  "feed/updatePost",
  async (dto, { rejectWithValue }) => {
    try {
      await postApi.updatePost(dto);
      return dto; // { id, text, isPinned }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deletePostThunk = createAsyncThunk(
  "feed/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      await postApi.deletePost(postId);
      return postId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Share (repost nội bộ) 1 bài viết. share không trả về bài mới -> nạp lại feed từ đầu
// (giống createPostThunk) để bài share mới + share_count cập nhật xuất hiện.
export const sharePostThunk = createAsyncThunk(
  "feed/sharePost",
  async ({ originalPostId, text }, { dispatch, rejectWithValue }) => {
    try {
      await postApi.sharePost({ originalPostId, text });
      dispatch(fetchFeed(0));
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// --- 4. SLICE ---
const feedSlice = createSlice({
  name: "feed",
  initialState: {
    items: [],
    nextCursor: 0,
    status: "idle",
    error: null,
  },
  reducers: {
    // Đặt cảm xúc hiện tại của user (nạp từ /like/my-reaction), KHÔNG đổi số đếm
    setMyReaction(state, action) {
      const { postId, reactionType } = action.payload;
      const post = state.items.find((p) => p.id === postId);
      if (post) post.myReaction = reactionType;
    },
    // Cập nhật số comment khi thêm/xoá (delta = +1 / -1)
    incCommentCount(state, action) {
      const { postId, delta } = action.payload;
      const post = state.items.find((p) => p.id === postId);
      if (post) post.commentCount = Math.max(0, (post.commentCount || 0) + delta);
    },
    // Đồng bộ số comment thật (từ totalElements) — BE không maintain commentCount
    setCommentCount(state, action) {
      const { postId, count } = action.payload;
      const post = state.items.find((p) => p.id === postId);
      if (post) post.commentCount = count;
    },
    // Lưu bài (local-only, BE chưa có API save)
    toggleSaveLocal(state, action) {
      const post = state.items.find((p) => p.id === action.payload);
      if (post) post.savedByMe = !post.savedByMe;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { posts, nextCursor } = action.payload;
        if (action.meta.arg === 0 || action.meta.arg === 1) {
          state.items = posts;
        } else {
          state.items = [...state.items, ...posts];
        }
        state.nextCursor = nextCursor;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Reaction thành công -> cập nhật myReaction + số like
      .addCase(reactPost.fulfilled, (state, action) => {
        const { postId, reactionType, prev } = action.payload;
        const post = state.items.find((p) => p.id === postId);
        if (!post) return;
        if (prev == null) post.likes = (post.likes || 0) + 1; // thả mới
        post.myReaction = reactionType; // đổi loại thì count giữ nguyên
      })
      .addCase(unreactPost.fulfilled, (state, action) => {
        const { postId, prev } = action.payload;
        const post = state.items.find((p) => p.id === postId);
        if (!post) return;
        if (prev != null) post.likes = Math.max(0, (post.likes || 0) - 1);
        post.myReaction = null;
      })
      // Sửa bài -> patch text/isPinned tại chỗ
      .addCase(updatePostThunk.fulfilled, (state, action) => {
        const { id, text, isPinned, visibility } = action.payload;
        const post = state.items.find((p) => p.id === id);
        if (!post) return;
        if (text !== undefined) post.caption = text;
        if (isPinned !== undefined) post.isPinned = !!isPinned;
        if (visibility) post.visibility = visibility;
      })
      // Xoá bài -> gỡ khỏi danh sách
      .addCase(deletePostThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export const { setMyReaction, incCommentCount, setCommentCount, toggleSaveLocal } =
  feedSlice.actions;
export default feedSlice.reducer;
