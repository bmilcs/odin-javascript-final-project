import { store } from '@/app/store';
import {
  setUserEmail,
  setUserFavorites,
  setUserId,
  setUserName,
  userEmail,
  userFavorites,
  userId,
  userName,
} from '@/features/userSlice/userSlice';
import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from 'firebase/firestore';
import { app } from './config';

const db = getFirestore(app);
const mode = import.meta.env.VITE_MODE as 'dev' | 'prod';

if (mode === 'dev') {
  console.log('dev mode: connecting firestore emulator');
  connectFirestoreEmulator(db, 'localhost', 8880);
}

//
// comedian pages
//

interface IComedianPageResponse {
  personalData: IComedianPagePersonalData;
  specials: { [key: string]: IComedianPageSpecialOrAppearance };
  appearances: { [key: string]: IComedianPageSpecialOrAppearance };
}
export interface IComedianPagePersonalData {
  name: string;
  id: number;
  profile_path: string;
  biography: string;
  birthday: string;
  imdb_id: string;
}

export interface IComedianPageSpecialOrAppearance {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
}

export type TComedianPageSpecialAppearanceArray = IComedianPageSpecialOrAppearance[];

export const getComedianPageFromDB = async (id: number) => {
  const pageRef = doc(db, 'comedianPages', id.toString());
  const pageResponse = await getDoc(pageRef);
  if (pageResponse.exists()) {
    return pageResponse.data() as IComedianPageResponse;
  }
};

//
// specials pages
//

export interface ISpecialPageResponse {
  comedian: ISpecialPageComedianData;
  data: ISpecialPageData;
  otherContent: ISpecialPageOtherContent[];
}

export interface ISpecialPageComedianData {
  id: number;
  name: string;
  profile_path: string;
}
export interface ISpecialPageData {
  comedian: string;
  comedianId: number;
  profile_path: string;
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  runtime: string;
  status: string;
  overview: string;
  homepage: string;
  release_date: string;
  type: 'special' | 'appearance';
}

export interface ISpecialPageOtherContent {
  title: string;
  release_date: string;
  backdrop_path: string;
  poster_path: string;
  id: number;
}

export const getSpecialOrAppearancePageFromDB = async (specialId: number) => {
  const pageRef = doc(db, 'specialPages', specialId.toString());
  const pageResponse = await getDoc(pageRef);
  if (pageResponse.exists()) {
    return pageResponse.data() as ISpecialPageResponse;
  }
};

//
// user-related functions
//

const allUsersCollectionRef = collection(db, 'users');

let userDocRef: DocumentReference;
let userDocSnap: Promise<DocumentSnapshot<DocumentData>> | DocumentSnapshot<DocumentData>;

// invoked on auth state change: when a user logs in
export const connectUserToDB = async () => {
  const uid = userId(store.getState());
  userDocRef = doc(allUsersCollectionRef, uid);
  userDocSnap = await getDoc(userDocRef);
  const isNewUser = !userDocSnap.exists();

  if (isNewUser) {
    createNewUser();
  } else {
    loadUserData(userDocSnap as DocumentSnapshot<DocumentData>);
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

const loadUserData = async (snapshot: DocumentSnapshot<DocumentData>) => {
  const userData = snapshot.data();
  if (
    userData === undefined ||
    !userData.id ||
    !userData.name ||
    !userData.favorites ||
    !userData.email
  )
    return;

  const { id, name, favorites, email } = userData;
  store.dispatch(setUserId(id));
  store.dispatch(setUserName(name));
  store.dispatch(setUserFavorites(favorites));
  store.dispatch(setUserEmail(email));
  // store.dispatch(logUserData());
};

//
// comedian related functions
//

export interface IComedian {
  favorites: number;
  profile_path: string;
  name: string;
  id: number;
}

export interface IComedianMap {
  [key: string]: IComedian;
}

interface IComedianLatest extends IComedian {
  dateAdded: {
    seconds: number;
    nanoseconds: number;
  };
}

export interface IComedianLatestMap {
  [key: number]: IComedianLatest;
}

export const getLatestComediansFromDB = async () => {
  const latestComediansDocRef = doc(db, 'comedians', 'latest');
  const docSnap = await getDoc(latestComediansDocRef);
  return docSnap.exists() && (docSnap.data() as IComedianLatestMap);
};

export const getTopFavoriteComediansFromDB = async () => {
  const topFavoriteComediansDocRef = doc(db, 'comedians', 'topFavorites');
  const docSnap = await getDoc(topFavoriteComediansDocRef);
  return docSnap.exists() && (docSnap.data() as IComedianMap);
};

export const allComedians: number[] = [];

export const getAllComediansFromDB = async () => {
  const allComediansDocRef = doc(db, 'comedians', 'all');
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

//
// specials related functions
//

export interface ISpecial {
  backdrop_path: string;
  favorites: number;
  id: number;
  poster_path: string;
  release_date: string;
  title: string;
}

export interface ISpecialMap {
  [id: number]: ISpecial;
}

export interface ISpecialLatestUpcoming extends ISpecial {
  type: 'special' | 'appearance';
}

export interface ISpecialLatestUpcomingMap {
  [id: number]: ISpecialLatestUpcoming;
}

export interface ISpecialTopFavorites extends ISpecial {
  type: 'special' | 'appearance';
}

export interface ISpecialTopFavoritesMap {
  [id: number]: ISpecialTopFavorites;
}

export const getLatestSpecialsFromDB = async () => {
  const latestSpecialsDocRef = doc(db, 'specials', 'latest');
  const docSnap = await getDoc(latestSpecialsDocRef);
  return docSnap.exists() && (docSnap.data() as ISpecialLatestUpcomingMap);
};

export const getUpcomingSpecialsFromDB = async () => {
  const upcomingSpecialsDocRef = doc(db, 'specials', 'upcoming');
  const docSnap = await getDoc(upcomingSpecialsDocRef);
  return docSnap.exists() && (docSnap.data() as ISpecialLatestUpcomingMap);
};

export const getTopFavoriteSpecialsFromDB = async () => {
  const topFavoriteSpecialsDocRef = doc(db, 'specials', 'topFavorites');
  const docSnap = await getDoc(topFavoriteSpecialsDocRef);
  return docSnap.exists() && (docSnap.data() as ISpecialTopFavoritesMap);
};

//
// standup specials related functions
//

// const allSpecials: number[] = [];
// const allSpecialsDocRef = doc(db, 'specials', 'all');

// export const getAllSpecialsFromDB = async () => {
//   const docSnap = await getDoc(allSpecialsDocRef);

//   if (docSnap.exists()) {
//     const data = docSnap.data();

//     for (const specialId of Object.keys(data)) {
//       const tmdbId = Number.parseInt(specialId);
//       if (!allSpecials.includes(tmdbId)) allSpecials.push(tmdbId);
//     }
//   }
// };
