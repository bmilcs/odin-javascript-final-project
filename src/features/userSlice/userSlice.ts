import { RootState } from '@/app/store';
import { createSlice, current } from '@reduxjs/toolkit';

type UserState = {
  id: string;
  name: string;
  email: string;
  favorites: string[];
  notifications: INotification[];
  isSignedIn?: boolean;
};

const initialState: UserState = {
  id: '',
  name: '',
  email: '',
  favorites: [],
  notifications: [],
  isSignedIn: false,
};

export interface INotification {
  comedian: {
    id: number;
    name: string;
    profile_path: string;
  };
  data: {
    backdrop_path: string;
    id: number;
    poster_path: string;
    release_date: string;
    title: string;
  };
}

export const userSlice = createSlice({
  name: 'user',
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
    toggleUserFavorite: (state, { payload }) => {
      const favorites = state.favorites;
      const favoriteId = payload;

      if (favorites.includes(favoriteId)) {
        state.favorites = state.favorites.filter((fav) => fav !== favoriteId);
      } else {
        state.favorites.push(favoriteId);
      }
    },
    setUserNotifications: (state, { payload }) => {
      state.notifications = payload;
    },
    removeUserNotification: (state, { payload: specialId }) => {
      const notifications = current(state.notifications);

      state.notifications = notifications
        .slice()
        .filter((notification) => notification.data.id !== specialId);
    },
    clearUserNotifications: (state, { payload }) => {
      state.notifications = payload;
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
      state.email = '';
      state.name = '';
    },
    logUserData: (state) => {
      console.log('name:', state.name);
      console.log('id:', state.id);
      console.log('email:', state.email);
      console.log('favorites:', state.favorites);
      console.log('isSignedIn:', state.isSignedIn);
    },
  },
});

export const userId = (state: RootState) => state.user.id;
export const userName = (state: RootState) => state.user.name;
export const userEmail = (state: RootState) => state.user.email;
export const userFavorites = (state: RootState) => state.user.favorites;
export const userNotifications = (state: RootState) => state.user.notifications;
export const isUserSignedIn = (state: RootState) => state.user.isSignedIn;

export const {
  logUserData,
  addUserFavorite,
  setUserNotifications,
  removeUserNotification,
  clearUserNotifications,
  removeUserFavorite,
  setUserFavorites,
  setUserName,
  setUserEmail,
  setUserId,
  setUserAsSignedIn,
  setUserAsSignedOut,
  toggleUserFavorite,
} = userSlice.actions;

export default userSlice.reducer;
