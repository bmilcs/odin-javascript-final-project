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
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { COMEDIAN_DATA } from "@/data/comedians";
import { IDiscoverMovieResult } from "@/api/TMDB";

const db = getFirestore(app);
const allUsersCollectionRef = collection(db, "users");

//
// user-related functions
//

let userDocRef: any;
let userDocSnap: any;

// invoked on auth state change: when a user logs in
export const connectUserToDB = async () => {
  const uid = userId(store.getState());
  userDocRef = doc(allUsersCollectionRef, uid);
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

//
// content-related functions
//

// TODO: save locally > persist through refresh
const allSpecials: number[] = [];

const specialsCollectionRef = collection(db, "specials");

// retrieve a list of all docs in the standup db collection
// occurs once on initial page load
export const getAllSpecialsFromDB = async () => {
  const querySnapshot = await getDocs(specialsCollectionRef);
  querySnapshot.forEach((doc) => {
    const tmdbId = Number.parseInt(doc.id);
    if (!allSpecials.includes(tmdbId)) allSpecials.push(tmdbId);
  });
};

// on opening a comedian's page, all specials for that comedian are saved
// to the db: /specials/{tmdbId} IF they don't already exist
export const addSpecialToDB = async (
  special: IDiscoverMovieResult,
  comedianId: number,
  comedianName: string
) => {
  const id = special.id;
  const title = special.title;

  if (!comedianId || !id) return;

  const specialDocRef = doc(specialsCollectionRef, `${id}`);
  await setDoc(specialDocRef, {
    id: id,
    title: title,
    comedian: comedianName,
    comedianId: comedianId,
  }).then(() => {
    // add special to local variable allSpecials
    if (!allSpecials.includes(id)) allSpecials.push(id);
  });
  // userDocSnap = await getDoc(userDocRef);
};

export const doesSpecialExistInDB = (specialId: number) => {
  return allSpecials.includes(specialId) ? true : false;
};
