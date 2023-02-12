import { RootState } from "@/app/store";
import { createSlice } from "@reduxjs/toolkit";

export type UserState = {
  id: string;
  name: string;
  email: string;
  favorites: string[];
  isSignedIn?: boolean;
};

const initialState: UserState = {
  id: "",
  name: "",
  email: "",
  favorites: [],
  isSignedIn: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUserFavorite: (state, { payload }) => {
      state.favorites.push(payload);
    },
    removeUserFavorite: (state, { payload }) => {
      state.favorites = state.favorites.filter((fav) => fav !== payload);
    },
    setUserFavorites: (state, { payload }) => {
      state.favorites = payload;
    },
    setUserName: (state, { payload }) => {
      state.name = payload;
    },
    setUserEmail: (state, { payload }) => {
      state.email = payload;
    },
    setUserId: (state, { payload }) => {
      state.id = payload;
    },
    setUserAsSignedIn: (state, { payload }) => {
      state.isSignedIn = true;
      state.id = payload;
    },
    setUserAsSignedOut: (state) => {
      state.isSignedIn = false;
      state.email = "";
      state.name = "";
    },
    logUserData: (state) => {
      console.log("name:", state.name);
      console.log("id:", state.id);
      console.log("email:", state.email);
      console.log("favorites:", state.favorites);
      console.log("isSignedIn:", state.isSignedIn);
    },
  },
});

export const userId = (state: RootState) => state.user.id;
export const userName = (state: RootState) => state.user.name;
export const userEmail = (state: RootState) => state.user.email;
export const userFavorites = (state: RootState) => state.user.favorites;
export const isUserSignedIn = (state: RootState) => state.user.isSignedIn;

export const {
  addUserFavorite,
  logUserData,
  removeUserFavorite,
  setUserFavorites,
  setUserName,
  setUserEmail,
  setUserId,
  setUserAsSignedIn,
  setUserAsSignedOut,
} = userSlice.actions;

export default userSlice.reducer;
