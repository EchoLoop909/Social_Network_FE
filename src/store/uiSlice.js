import { createSlice } from "@reduxjs/toolkit";

const getSysDark = () =>
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const slice = createSlice({
  name: "ui",
  initialState: {
    theme: getSysDark() ? "dark" : "light",
    searchOpen: false,
  },
  reducers: {
    toggleTheme(s) {
      s.theme = s.theme === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", s.theme === "dark");
    },
    toggleSearch(s, a) {
      s.searchOpen = typeof a.payload === "boolean" ? a.payload : !s.searchOpen;
    },
  },
});

export const { toggleTheme, toggleSearch } = slice.actions;
export default slice.reducer;

// Áp dụng theme mặc định theo system ngay khi load module
document.documentElement.classList.toggle(
  "dark",
  slice.getInitialState().theme === "dark"
);
