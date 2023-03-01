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

export interface IComedian {
  favorites: number;
  profile_path: string;
  name: string;
  id: number;
  dateAdded: string;
}

export interface IComedianList {
  [key: string]: IComedian;
}

export const getLatestComediansFromDB = async () => {
  const latestComediansDocRef = doc(db, 'comedians', 'latest');
  const docSnap = await getDoc(latestComediansDocRef);
  return docSnap.exists() && (docSnap.data() as IComedianList);
};

//
// specials related functions
//

export interface IComedySpecial {
  comedian: string;
  backdrop_path: string;
  poster_path: string;
  comedianId: number;
  release_date: string;
  id: number;
  title: string;
}

export interface ComedySpecialsList {
  [id: string]: IComedySpecial;
}

export const getLatestSpecialsFromDB = async () => {
  const latestSpecialsDocRef = doc(db, 'specials', 'latest');
  const docSnap = await getDoc(latestSpecialsDocRef);
  return docSnap.exists() && (docSnap.data() as ComedySpecialsList);
};

export const getUpcomingSpecialsFromDB = async () => {
  const upcomingSpecialsDocRef = doc(db, 'specials', 'upcoming');
  const docSnap = await getDoc(upcomingSpecialsDocRef);
  return docSnap.exists() && (docSnap.data() as ComedySpecialsList);
};

//
// standup specials related functions
//

// TODO: save locally > persist through refresh

const allSpecials: number[] = [];
const allSpecialsDocRef = doc(db, 'specials', 'all');

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
