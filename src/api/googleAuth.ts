import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import app from "../firebase";

export async function getFirebaseGoogleIdToken() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(getAuth(app), provider);
  return result.user.getIdToken();
}
