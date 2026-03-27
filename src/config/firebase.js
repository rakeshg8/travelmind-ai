import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { KEYS } from "./keys";

const firebaseConfig = {
  apiKey: KEYS.FIREBASE_API_KEY,
  authDomain: KEYS.FIREBASE_AUTH_DOMAIN,
  projectId: KEYS.FIREBASE_PROJECT_ID,
  appId: KEYS.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
