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
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { COMEDIAN_DATA } from "@/data/comedians";
import { IDiscoverMovieResult } from "@/api/TMDB";

const db = getFirestore(app);

//
// run mode
//

const mode = import.meta.env.VITE_MODE as "dev" | "prod";

if (mode === "dev") {
  console.log("dev mode: connecting firestore emulator");
  connectFirestoreEmulator(db, "localhost", 8080);
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
// specials related functions
//

// TODO: save locally > persist through refresh

const allSpecials: number[] = [];
const allSpecialsDocRef = doc(db, "specials", "all");

// retrieve a list of all docs in the standup db collection
// occurs once on initial page load
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

// on opening a comedian's page, all specials for that comedian are saved
// to the db: /specials/{tmdbId} IF they don't already exist
export const addSpecialToDB = async (
  specials: IDiscoverMovieResult[],
  comedianId: number,
  comedianName: string
) => {
  if (!comedianId) return;

  // convert array of specials to a single object for merging to the db
  // reducing number of database writes
  const specialData = specials.reduce((prev, special) => {
    return {
      ...prev,
      [special.id!]: {
        id: special.id,
        title: special.title,
        imageId: special.poster_path,
        releaseDate: special.release_date,
        comedian: comedianName,
        comedianId: comedianId,
      },
    };
  }, {});

  await setDoc(allSpecialsDocRef, specialData, { merge: true }).then(() => {
    // add special to local variable allSpecials
    for (const specialId of Object.keys(specialData))
      allSpecials.push(Number(specialId));
  });
};

export const doesSpecialExistInDB = (specialId: number) => {
  return allSpecials.includes(specialId) ? true : false;
};

//
// comedian related functions
//

const allComediansDocRef = doc(db, "comedians", "all");
