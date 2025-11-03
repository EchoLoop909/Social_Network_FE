import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import logger from "redux-logger";

// slices
import auth from "./authSlice";
import feed from "./feedSlice";
import stories from "./storySlice";
import suggest from "./suggestSlice";
import notifications from "./notifSlice";
import dm from "./dmSlice";
import ui from "./uiSlice";
import profile from "./profileSlice";
import explore from "./exploreSlice";
import reels from "./reelsSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["ui", "feed"],
};

const rootReducer = combineReducers({
  auth,
  feed,
  stories,
  suggest,
  notifications,
  dm,
  ui,
  profile,
  explore,
  reels,
});

const persisted = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persisted,
  // RTK v2: middleware phải là callback
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true, // thunk đã có sẵn trong default
      serializableCheck: {
        // cần ignore các action của redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(process.env.NODE_ENV === "development" ? [logger] : []),
});

export const persistor = persistStore(store);

// (tuỳ chọn) cung cấp store cho eventBus & đồng bộ theme ngay lúc khởi động
if (typeof window !== "undefined") {
  window.__store__ = store;
  document.documentElement.classList.toggle(
    "dark",
    store.getState().ui.theme === "dark"
  );
}
