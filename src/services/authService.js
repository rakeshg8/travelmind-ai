import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import { supabase } from "../config/supabase";

export const authService = {
  async signup(email, password, profileData = {}) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (profileData.name) {
      await updateProfile(credential.user, { displayName: profileData.name });
    }
    await this.upsertUserProfile(credential.user.uid, {
      email: credential.user.email,
      name: profileData.name || credential.user.displayName || "",
      phone: profileData.phone || "",
      travel_style: profileData.travel_style || "mid",
      interests: profileData.interests || [],
    });
    return credential.user;
  },

  async login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  },

  async loginWithGoogle() {
    const credential = await signInWithPopup(auth, googleProvider);
    await this.upsertUserProfile(credential.user.uid, {
      email: credential.user.email,
      name: credential.user.displayName || "Google User",
    });
    return credential.user;
  },

  async logout() {
    await signOut(auth);
  },

  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  async upsertUserProfile(uid, data) {
    const payload = {
      id: uid,
      ...data,
    };
    const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });
    if (error) {
      throw error;
    }
  },
};
