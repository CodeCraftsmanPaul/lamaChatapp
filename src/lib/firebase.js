// console.log(import.meta.env.VITE_API_KEY);

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "lumachat-5cb42.firebaseapp.com",
  projectId: "lumachat-5cb42",
  storageBucket: "lumachat-5cb42.appspot.com",
  messagingSenderId: "856931045054",
  appId: "1:856931045054:web:e5395c75f78de9bd70d8ef",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
