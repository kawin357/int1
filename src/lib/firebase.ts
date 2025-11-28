import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase Configuration is READY!
// Google Sign-in Setup Steps (if not already done):
// 1. Go to Firebase Console: https://console.firebase.google.com/project/chatz-8ef27
// 2. Click "Authentication" in the left sidebar
// 3. Go to "Sign-in method" tab
// 4. Click on "Google" provider
// 5. Click "Enable" toggle
// 6. Add your support email
// 7. Under "Authorized domains", make sure your deployment domain is listed
// 8. Click "Save"

const firebaseConfig = {
  apiKey: "AIzaSyBON03HaLoBm-BcIJpAuBGWouhtxWQFu0M",
  authDomain: "chatz-8ef27.firebaseapp.com",
  projectId: "chatz-8ef27",
  storageBucket: "chatz-8ef27.firebasestorage.app",
  messagingSenderId: "778596421385",
  appId: "1:778596421385:web:e629d1667454c4adaf4dd8",
  measurementId: "G-SKQH92SZWT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;