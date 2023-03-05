import { configureStore } from '@reduxjs/toolkit';
import allComediansReducer from '@/features/allComediansSlice/allComediansSlice';
import userReducer from '@/features/userSlice/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    allComedians: allComediansReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
