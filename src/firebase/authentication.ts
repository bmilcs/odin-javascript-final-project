import { useAppSelector } from "@/app/hooks";
import { store } from "@/app/store";
import {
  setEmail,
  setName,
  setUserAsSignedIn,
  setUserAsSignedOut,
} from "@/features/userSlice/userSlice";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  getAdditionalUserInfo,
} from "firebase/auth";
import { app } from "./config";

const provider = new GoogleAuthProvider();
const auth = getAuth(app);

// handle auth changes

onAuthStateChanged(auth, (user) => {
  const isSignedIn = user;
  if (isSignedIn) {
    store.dispatch(setUserAsSignedIn(user.uid));
    store.dispatch(setEmail(user.email));
    store.dispatch(setName(user.displayName));
    console.log(user.toJSON());
  } else {
    // user is signed out
    store.dispatch(setUserAsSignedOut());
  }
});

export const signUserInWithGooglePopup = () =>
  signInWithPopup(auth, provider)
    .then((result) => {
      // google access token: access the Google API
      const credential = GoogleAuthProvider.credentialFromResult(result)!;
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      // IdP data available using getAdditionalUserInfo(result)
      const additionalInfo = getAdditionalUserInfo(result);
      console.log(additionalInfo);
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
    });

export const signUserOutFromFirebase = () => signOut(auth);
// .then(() => {
//   // Sign-out successful.
// })
// .catch((error) => {
//   // An error happened.
// });
