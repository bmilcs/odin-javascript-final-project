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
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const db = getFirestore(app);
const mode = import.meta.env.VITE_MODE as "dev" | "prod";

if (mode === "dev") {
  console.log("dev mode: connecting firestore emulator");
  connectFirestoreEmulator(db, "localhost", 8880);
}

//
// user-related functions
//

const allUsersCollectionRef = collection(db, "users");

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
  // store.dispatch(logUserData());
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
// comedian related functions
//

export const allComedians: number[] = [];

export const getAllComediansFromDB = async () => {
  const allComediansDocRef = doc(db, "comedians", "all");
  const docSnap = await getDoc(allComediansDocRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    for (const specialId of Object.keys(data)) {
      const tmdbId = Number.parseInt(specialId);
      if (!allComedians.includes(tmdbId)) allComedians.push(tmdbId);
    }
  }
};

export const getAllComedianIdsFromDB = async () => {
  if (allComedians.length === 0) await getAllComediansFromDB();
  return allComedians;
};

// adding comedians to the site:
// when a user wants to add a comedian to the db, the tmdb id of the comedian
// is written to the /comedians/toAdd document in firestore. a firebase cloud
// function is triggered on write & adds the comedian and their specials to the db

const comediansToAddDocRef = doc(db, "comedians", "toAdd");
export const addComedianToDB = async (personalId: number) => {
  await setDoc(comediansToAddDocRef, { personalId }, { merge: true });
};

//
// specials related functions
//

export interface IComedySpecial {
  comedian: string;
  imageId: string;
  comedianId: number;
  releaseDate: string;
  id: number;
  title: string;
}

export interface ComedySpecialsList {
  [id: string]: IComedySpecial;
}

export const getLatestSpecialsFromDB = async () => {
  const latestSpecialsDocRef = doc(db, "specials", "latest");
  const docSnap = await getDoc(latestSpecialsDocRef);
  return docSnap.exists() && (docSnap.data() as ComedySpecialsList);
};

export const getUpcomingSpecialsFromDB = async () => {
  const upcomingSpecialsDocRef = doc(db, "specials", "upcoming");
  const docSnap = await getDoc(upcomingSpecialsDocRef);
  return docSnap.exists() && (docSnap.data() as ComedySpecialsList);
};

//
// standup specials related functions
//

// TODO: save locally > persist through refresh

const allSpecials: number[] = [];
const allSpecialsDocRef = doc(db, "specials", "all");

export const getAllSpecialsFromDB = async () => {
  const docSnap = await getDoc(allSpecialsDocRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    for (const specialId of Object.keys(data)) {
      const tmdbId = Number.parseInt(specialId);
      if (!allSpecials.includes(tmdbId)) allSpecials.push(tmdbId);
    }
  }
};
