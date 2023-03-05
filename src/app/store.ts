import allComediansReducer from '@/features/allComediansSlice/allComediansSlice';
import allSpecialsReducer from '@/features/allSpecialsSlice/allSpecialsSlice';
import userReducer from '@/features/userSlice/userSlice';
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    user: userReducer,
    allComedians: allComediansReducer,
    allSpecials: allSpecialsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
