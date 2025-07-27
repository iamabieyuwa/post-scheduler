import { getFirestore, doc, getDoc, setDoc } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";

// ✅ Initialize Firebase Admin once
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export async function getValidTwitterToken(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User not found");

  const { twitterTokens } = snap.data();
  if (!twitterTokens) throw new Error("Twitter tokens missing");

  const now = Date.now();
  const isValid = twitterTokens.expires_at && twitterTokens.expires_at > now;

  if (isValid) {
    return twitterTokens.access_token;
  }

  // 🌀 Refresh token logic
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: twitterTokens.refresh_token,
      client_id: process.env.TWITTER_CLIENT_ID,
    }),
  });

  const newData = await res.json();

  if (!newData.access_token) {
    throw new Error("Failed to refresh Twitter token");
  }

  await setDoc(
    userRef,
    {
      twitterTokens: {
        access_token: newData.access_token,
        refresh_token: newData.refresh_token || twitterTokens.refresh_token,
        expires_in: newData.expires_in,
        expires_at: Date.now() + newData.expires_in * 1000,
      },
    },
    { merge: true }
  );

  return newData.access_token;
}
