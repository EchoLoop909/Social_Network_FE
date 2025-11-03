import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getExplore } from "../services/searchApi";

export const fetchExplore = createAsyncThunk("explore/fetch", async () => {
  const { items } = await getExplore();
  return items;
});

const slice = createSlice({
  name: "explore",
  initialState: { items: [] },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchExplore.fulfilled, (s, a) => {
      s.items = a.payload;
    });
  },
});

export default slice.reducer;
