import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getFeed } from "../services/feedApi";
import * as likeApi from "../services/likeApi";
import * as postApi from "../services/postApi";

// Áp 1 thao tác lên bài trong feed (items) VÀ bài đang xem chi tiết (viewing) nếu trùng id.
// Nhờ vậy like/comment ở trang /post/:id (PostDetailPage) cũng cập nhật ngay, không cần F5.
function eachTarget(state, id, fn) {
  const p = state.items.find((x) => x.id === id);
  if (p) fn(p);
  if (state.viewing && state.viewing.id === id) fn(state.viewing);
}

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

// Đếm tổng số cảm xúc THẬT của 1 bài (gọi lại API sau khi tương tác)
async function fetchLikeCount(postId) {
  try {
    const { reactionSummary } = await likeApi.getReactions("POST", postId, 1, 1);
    return Object.values(reactionSummary || {}).reduce((a, b) => a + Number(b || 0), 0);
  } catch {
    return null;
  }
}

// --- 2. REACTION (Like 6 loại) ---
export const reactPost = createAsyncThunk(
  "feed/react",
  async ({ postId, reactionType }, { rejectWithValue }) => {
    try {
      await likeApi.react("POST", postId, reactionType);
      const likes = await fetchLikeCount(postId); // gọi lại API lấy count thật
      return { postId, reactionType, likes };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const unreactPost = createAsyncThunk(
  "feed/unreact",
  async ({ postId }, { rejectWithValue }) => {
    try {
      await likeApi.unlike("POST", postId);
      const likes = await fetchLikeCount(postId);
      return { postId, likes };
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
      const newId = await postApi.createPost(dto);
      dispatch(fetchFeed(0));
      return newId; // trả id bài mới để FE gắn thẻ sau khi đăng
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
    viewing: null, // bài đang mở ở trang chi tiết (/post/:id)
    savedIds: [], // id các bài mình đã lưu (bookmark)
    nextCursor: 0,
    status: "idle",
    error: null,
  },
  reducers: {
    setSavedIds(state, action) {
      state.savedIds = Array.isArray(action.payload) ? action.payload : [];
    },
    setSaved(state, action) {
      if (!Array.isArray(state.savedIds)) state.savedIds = [];
      const { postId, saved } = action.payload;
      const has = state.savedIds.includes(postId);
      if (saved && !has) state.savedIds.push(postId);
      if (!saved && has) state.savedIds = state.savedIds.filter((x) => x !== postId);
    },
    // Bài đang xem chi tiết
    setViewingPost(state, action) {
      state.viewing = action.payload;
    },
    clearViewingPost(state) {
      state.viewing = null;
    },
    // Đặt cảm xúc hiện tại của user (nạp từ /like/my-reaction), KHÔNG đổi số đếm
    setMyReaction(state, action) {
      const { postId, reactionType } = action.payload;
      eachTarget(state, postId, (post) => { post.myReaction = reactionType; });
    },
    // Cập nhật số comment khi thêm/xoá (delta = +1 / -1)
    incCommentCount(state, action) {
      const { postId, delta } = action.payload;
      eachTarget(state, postId, (post) => { post.commentCount = Math.max(0, (post.commentCount || 0) + delta); });
    },
    // Đồng bộ số comment thật (từ totalElements)
    setCommentCount(state, action) {
      const { postId, count } = action.payload;
      eachTarget(state, postId, (post) => { post.commentCount = count; });
    },
    // Lưu bài (local-only)
    toggleSaveLocal(state, action) {
      eachTarget(state, action.payload, (post) => { post.savedByMe = !post.savedByMe; });
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
      .addCase(reactPost.fulfilled, (state, action) => {
        const { postId, reactionType, likes } = action.payload;
        eachTarget(state, postId, (post) => {
          post.myReaction = reactionType;
          if (likes != null) post.likes = likes; // count thật từ API
          else post.likes = (post.likes || 0) + 1; // dự phòng nếu gọi count lỗi
        });
      })
      .addCase(unreactPost.fulfilled, (state, action) => {
        const { postId, likes } = action.payload;
        eachTarget(state, postId, (post) => {
          post.myReaction = null;
          if (likes != null) post.likes = likes;
          else post.likes = Math.max(0, (post.likes || 0) - 1);
        });
      })
      .addCase(updatePostThunk.fulfilled, (state, action) => {
        const { id, text, isPinned, visibility } = action.payload;
        eachTarget(state, id, (post) => {
          if (text !== undefined) post.caption = text;
          if (isPinned !== undefined) post.isPinned = !!isPinned;
          if (visibility) post.visibility = visibility;
        });
      })
      .addCase(deletePostThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
        if (state.viewing && state.viewing.id === action.payload) state.viewing = null;
      });
  },
});

export const {
  setViewingPost, clearViewingPost, setMyReaction, incCommentCount, setCommentCount, toggleSaveLocal,
  setSavedIds, setSaved,
} = feedSlice.actions;
export default feedSlice.reducer;
