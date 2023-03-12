import { store } from '@/app/store';
import {
  setUserAsSignedIn,
  setUserAsSignedOut,
  setUserEmail,
  setUserName,
} from '@/features/userSlice/userSlice';
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { app } from './config';
import { connectUserToDB } from './database';

const provider = new GoogleAuthProvider();
const auth = getAuth(app);
const mode = import.meta.env.VITE_MODE as 'dev' | 'prod';

if (mode === 'dev') {
  console.log('dev mode: auth emulator');
  connectAuthEmulator(auth, 'http://localhost:8882');
}

// handle auth changes

onAuthStateChanged(auth, (user) => {
  const isSignedIn = user;
  if (isSignedIn) {
    store.dispatch(setUserAsSignedIn(user.uid));
    store.dispatch(setUserEmail(user.email));
    store.dispatch(setUserName(user.displayName));
    connectUserToDB();
  } else {
    store.dispatch(setUserAsSignedOut());
  }
});

export const createEmailUser = async (email: string, password: string, name: string) =>
  await createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      store.dispatch(setUserName(name));
    })
    .catch((error) => {
      throw error;
    });

export const signInEmailUser = async (email: string, password: string) =>
  await signInWithEmailAndPassword(auth, email, password).catch((error) => {
    throw error;
  });

export const signUserInWithGooglePopup = () => signInWithPopup(auth, provider);

// .then((result) => {
// if (result === null) throw Error('--> Google Signin failed.');
// google access token: access the Google API
// const credential = GoogleAuthProvider.credentialFromResult(result);
// const token = credential.accessToken;
// The signed-in user info.
// const user = result.user;
// IdP data available using getAdditionalUserInfo(result)
// const additionalInfo = getAdditionalUserInfo(result);
// console.log(additionalInfo);
// })
// .catch((error) => {
// const errorCode = error.code;
// const errorMessage = error.message;
// const email = error.customData.email;
// // The AuthCredential type that was used.
// const credential = GoogleAuthProvider.credentialFromError(error);
// });

export const signUserOutFromFirebase = () => signOut(auth);
// .then(() => {
// })
// .catch((error) => {
// });
