import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { authSlice } from "../feature/authSlice";
import { api } from "./api";
import storage from "redux-persist/lib/storage";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import { persistStore } from "redux-persist";
import { mediaSlice } from "../feature/mediaSlice";
import { profileSlice } from "../feature/profileSlice";
import { socketSlice } from "../feature/socketSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "cart", "checkout"],
};

const rootReducer = combineReducers({
  auth: authSlice.reducer,
  media: mediaSlice.reducer,
  profile: profileSlice.reducer,
  socket: socketSlice.reducer,
  [api.reducerPath]: api.reducer,
});

export type RootReducer = ReturnType<typeof rootReducer>;

const persistedReducer = persistReducer<RootReducer>(
  persistConfig,
  rootReducer,
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const persistor = persistStore(store);
