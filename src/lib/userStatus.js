import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const setUserOnlineStatus = async (userId, isOnline) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      online: isOnline,
    });
  } catch (err) {
    console.error("Failed to update user status:", err);
  }
};
