import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getStories, markStorySeen } from "../services/storyApi";

export const fetchStories = createAsyncThunk("stories/fetch", async () => {
  const { stories } = await getStories();
  return stories;
});

export const seenStory = createAsyncThunk("stories/seen", async (storyId) => {
  await markStorySeen(storyId);
  return storyId;
});

const slice = createSlice({
  name: "stories",
  initialState: { items: [], status: "idle" },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchStories.fulfilled, (s, a) => {
      s.items = a.payload;
      s.status = "succeeded";
    });
    b.addCase(seenStory.fulfilled, (s, a) => {
      const st = s.items.find((x) => x.id === a.payload);
      if (st) st.seen = true;
    });
  },
});

export default slice.reducer;
