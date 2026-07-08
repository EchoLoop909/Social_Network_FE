import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getFeed } from "../services/feedApi"; // Import hàm lấy feed thật

// --- 1. THUNK LẤY FEED (Dùng API thật) ---
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

// --- 2. CÁC THUNK GIẢ LẬP (Để UI không bị lỗi) ---
export const createPostThunk = createAsyncThunk("feed/createPost", async (payload) => {
    return { ...payload, id: Date.now() }; // Fake return
});
export const toggleLike = createAsyncThunk("feed/like", async (postId) => { return { postId }; });
export const toggleSave = createAsyncThunk("feed/save", async (postId) => { return { postId }; });
export const submitComment = createAsyncThunk("feed/comment", async ({ postId }) => { return { postId }; });

// --- 3. SLICE ---
const feedSlice = createSlice({
  name: "feed",
  initialState: {
    items: [],
    nextCursor: 0,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => { state.status = "loading"; })
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
      });
  },
});

export default feedSlice.reducer;