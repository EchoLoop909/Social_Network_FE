import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getSuggestions, toggleFollow } from "../services/userApi";

export const fetchSuggestions = createAsyncThunk("suggest/fetch", async () => {
  const { suggestions } = await getSuggestions();
  return suggestions;
});

export const followToggle = createAsyncThunk("suggest/toggle", async (id) => {
  const res = await toggleFollow(id);
  return res;
});

const slice = createSlice({
  name: "suggest",
  initialState: { items: [] },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchSuggestions.fulfilled, (s, a) => {
      s.items = a.payload;
    });
    b.addCase(followToggle.fulfilled, (s, a) => {
      const it = s.items.find((x) => x.id === a.payload.suggestId);
      if (it) it.followed = a.payload.followed;
    });
  },
});

export default slice.reducer;
