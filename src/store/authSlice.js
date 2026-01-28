// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import { getStoredTokens } from "../services/authApi";

// // Lấy me dựa trên access_token đã có (nếu có)
// export const fetchMe = createAsyncThunk("auth/fetchMe", async () => {
//   const tokens = getStoredTokens();
//   if (!tokens?.access_token) throw new Error("No access token");
//   const res = await fetch("/api/me", {
//     headers: { Authorization: `Bearer ${tokens.access_token}` },
//   });
//   if (!res.ok) throw new Error("Fetch me failed");
//   return await res.json(); // { id, username, ... }
// });

// const authSlice = createSlice({
//   name: "auth",
//   initialState: {
//     user: null,
//     tokens: getStoredTokens(), // có thể là null
//     status: "idle",
//   },
//   reducers: {
//     setTokens(state, action) {
//       state.tokens = action.payload || null;
//       if (action.payload) {
//         localStorage.setItem("auth_tokens", JSON.stringify(action.payload));
//       } else {
//         localStorage.removeItem("auth_tokens");
//       }
//     },
//     logout(state) {
//       state.user = null;
//       state.tokens = null;
//       localStorage.removeItem("auth_tokens");
//     },
//   },
//   extraReducers: (b) => {
//     b.addCase(fetchMe.pending, (s) => {
//       s.status = "loading";
//     });
//     b.addCase(fetchMe.fulfilled, (s, a) => {
//       s.user = a.payload;
//       s.status = "succeeded";
//     });
//     b.addCase(fetchMe.rejected, (s) => {
//       s.status = "failed";
//       s.user = null;
//     });
//   },
// });

// export const { setTokens, logout } = authSlice.actions;
// export default authSlice.reducer;


import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getStoredTokens } from "../services/authApi";

// Giữ nguyên fetchMe cũ của bạn (nếu bạn muốn dùng Redux để gọi API)
export const fetchMe = createAsyncThunk("auth/fetchMe", async () => {
  const tokens = getStoredTokens();
  if (!tokens?.access_token) throw new Error("No access token");
  const res = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!res.ok) throw new Error("Fetch me failed");
  return await res.json(); 
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    tokens: getStoredTokens(), 
    status: "idle",
  },
  reducers: {
    // --- PHẦN BỔ SUNG QUAN TRỌNG ĐÂY ---
    setCredentials(state, action) {
      // Hàm này dùng để App.js ném dữ liệu user vào Redux
      state.user = action.payload;
      state.status = "succeeded";
    },
    // ------------------------------------

    setTokens(state, action) {
      state.tokens = action.payload || null;
      if (action.payload) {
        localStorage.setItem("auth_tokens", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("auth_tokens");
      }
    },
    logout(state) {
      state.user = null;
      state.tokens = null;
      localStorage.removeItem("auth_tokens");
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (s) => {
      s.status = "loading";
    });
    b.addCase(fetchMe.fulfilled, (s, a) => {
      s.user = a.payload;
      s.status = "succeeded";
    });
    b.addCase(fetchMe.rejected, (s) => {
      s.status = "failed";
      s.user = null;
    });
  },
});

// --- NHỚ EXPORT setCredentials Ở ĐÂY ---
export const { setTokens, logout, setCredentials } = authSlice.actions;

export default authSlice.reducer;