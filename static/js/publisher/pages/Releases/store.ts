import { configureStore } from '@reduxjs/toolkit';
import releasesReducers from "./reducers";

// redux toolkit includes thunk and devtools by default
export const store = configureStore({
  reducer: releasesReducers
});

// ReturnType<typeof store.getState> == ReleasesReduxState
export type DispatchFn = typeof store.dispatch;

