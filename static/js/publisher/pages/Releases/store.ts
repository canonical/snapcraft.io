import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './slices';

// redux toolkit includes thunk and devtools by default
export const store = configureStore({
  reducer: rootReducer
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppAsyncThunkConfig = {
  dispatch: AppDispatch;
  state: RootState;
}
