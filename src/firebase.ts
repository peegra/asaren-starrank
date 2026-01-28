import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-oHZKSvRGj5MRCmxG7yJ7r_Rbu7rPqEg",
  authDomain: "asaren-starrank.firebaseapp.com",
  projectId: "asaren-starrank",
  storageBucket: "asaren-starrank.firebasestorage.app",
  messagingSenderId: "142760528885",
  appId: "1:142760528885:web:a1ade05fa4a38193e1aebc",
  measurementId: "G-W7Y69S7CH6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally
// if (typeof window !== 'undefined') {
//   isSupported().then((supported) => {
//     if (supported) {
//       getAnalytics(app);
//     }
//   });
// }

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);