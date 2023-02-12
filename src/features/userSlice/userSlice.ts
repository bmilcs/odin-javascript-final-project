import { RootState } from "@/app/store";
import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

interface UserState {
  userId: string;
  name: string;
  email: string;
  favorites: string[];
  isSignedIn: boolean;
}

const initialState: UserState = {
  userId: uuid(),
  name: "",
  email: "",
  favorites: [],
  isSignedIn: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addFavorite: (state, { payload }) => {
      state.favorites.push(payload);
    },
    removeFavorite: (state, { payload }) => {
      state.favorites = state.favorites.filter((fav) => fav !== payload);
    },
    setFavorites: (state, { payload }) => {
      state.favorites = payload;
    },
    setName: (state, { payload }) => {
      state.name = payload;
    },
    setEmail: (state, { payload }) => {
      state.email = payload;
    },
    setUserId: (state, { payload }) => {
      state.userId = payload;
    },
    setUserAsSignedIn: (state, { payload }) => {
      state.isSignedIn = true;
      state.userId = payload;
    },
    setUserAsSignedOut: (state) => {
      state.isSignedIn = false;
      state.email = "";
      state.name = "";
    },
  },
});

export const userId = (state: RootState) => state.user.userId;
export const userName = (state: RootState) => state.user.name;
export const userEmail = (state: RootState) => state.user.email;
export const userFavorites = (state: RootState) => state.user.favorites;
export const isUserSignedIn = (state: RootState) => state.user.isSignedIn;

export const {
  addFavorite,
  removeFavorite,
  setFavorites,
  setName,
  setEmail,
  setUserId,
  setUserAsSignedIn,
  setUserAsSignedOut,
} = userSlice.actions;

export default userSlice.reducer;
