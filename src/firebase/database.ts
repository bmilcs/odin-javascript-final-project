import { store } from "@/app/store";
import { app } from "./config";
import {
  logUserData,
  setUserEmail,
  setUserFavorites,
  setUserId,
  setUserName,
  userEmail,
  userFavorites,
  userId,
  userName,
  UserState,
} from "@/features/userSlice/userSlice";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const db = getFirestore(app);
const usersCollectionRef = collection(db, "users");
let userDocRef: any;
let userDocSnap: any;

export const connectDatabase = async () => {
  const uid = userId(store.getState());
  userDocRef = doc(usersCollectionRef, uid);
  userDocSnap = await getDoc(userDocRef);
  const isNewUser = !userDocSnap.exists();

  if (isNewUser) {
    createNewUser();
  } else {
    loadUserData();
  }
};

const createNewUser = async () => {
  const state = store.getState();
  const id = userId(state);
  const email = userEmail(state);
  const name = userName(state);
  const favorites = userFavorites(state);

  await setDoc(userDocRef, {
    id,
    name,
    email,
    favorites,
  });
};

const loadUserData = async () => {
  const { id, name, favorites, email }: UserState = userDocSnap.data();
  store.dispatch(setUserId(id));
  store.dispatch(setUserName(name));
  store.dispatch(setUserFavorites(favorites));
  store.dispatch(setUserEmail(email));
  store.dispatch(logUserData());
};

export const addFavoriteToDB = async (favorite: string) => {
  await updateDoc(userDocRef, {
    favorites: arrayUnion(favorite),
  });
};

export const removeFavoriteFromDB = async (favorite: string) => {
  await updateDoc(userDocRef, {
    favorites: arrayRemove(favorite),
  });
};
