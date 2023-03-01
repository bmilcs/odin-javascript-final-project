import { store } from '@/app/store';
import {
  setUserAsSignedIn,
  setUserAsSignedOut,
  setUserEmail,
  setUserName,
} from '@/features/userSlice/userSlice';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { app } from './config';
import { connectUserToDB } from './database';

const provider = new GoogleAuthProvider();
const auth = getAuth(app);

// handle auth changes

onAuthStateChanged(auth, (user) => {
  const isSignedIn = user;
  if (isSignedIn) {
    store.dispatch(setUserAsSignedIn(user.uid));
    store.dispatch(setUserEmail(user.email));
    store.dispatch(setUserName(user.displayName));
    connectUserToDB();
    // console.log(user.toJSON());
  } else {
    // user signed out
    store.dispatch(setUserAsSignedOut());
  }
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
// Handle Errors here.
// const errorCode = error.code;
// const errorMessage = error.message;
// // The email of the user's account used.
// const email = error.customData.email;
// // The AuthCredential type that was used.
// const credential = GoogleAuthProvider.credentialFromError(error);
// ...
// });

export const signUserOutFromFirebase = () => signOut(auth);
// .then(() => {
//   // Sign-out successful.
// })
// .catch((error) => {
//   // An error happened.
// });
