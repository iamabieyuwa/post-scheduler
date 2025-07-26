import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Adjust path as needed

// Call this after successful login/signup and email verification
export async function redirectAfterAuth(user, router) {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    let connected = false;
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (
        data.connectedAccounts &&
        data.connectedAccounts.twitter &&
        data.connectedAccounts.instagram
      ) {
        connected = true;
      }
    }
    if (connected) {
      router.push("/dashboard");
    } else {
      router.push("/connect");
    }
  } catch (err) {
    // fallback: go to /connect if Firestore fails
    router.push("/connect");
  }
}