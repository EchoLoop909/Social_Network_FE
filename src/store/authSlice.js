import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMe } from "../services/userApi";

export const fetchMe = createAsyncThunk("auth/fetchMe", async () => {
  const { me } = await getMe();
  return me;
});

const slice = createSlice({
  name: "auth",
  initialState: { me: null, status: "idle" },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (s) => {
      s.status = "loading";
    });
    b.addCase(fetchMe.fulfilled, (s, a) => {
      s.me = a.payload;
      s.status = "succeeded";
    });
    b.addCase(fetchMe.rejected, (s) => {
      s.status = "failed";
    });
  },
});

export default slice.reducer;
