// app/api/twitter/refresh/route.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase-admin/firestore";
import "../../../lib/firebase-admin"; // initializes admin SDK

export async function GET() {
  const cookieStore = cookies();
  const firebaseToken = cookieStore.get("firebase_token")?.value;

  if (!firebaseToken) {
    return NextResponse.redirect("/?error=missing_token");
  }

  // ✅ Verify Firebase token
  let uid;
  try {
    const decoded = await getAuth().verifyIdToken(firebaseToken);
    uid = decoded.uid;
  } catch (err) {
    console.error("Invalid Firebase token", err);
    return NextResponse.redirect("/?error=invalid_token");
  }

  // 🔍 Get refresh_token from Firestore
  const db = getFirestore();
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return NextResponse.redirect("/?error=user_not_found");
  }

  const data = userSnap.data();
  const refreshToken = data?.twitterTokens?.refresh_token;

  if (!refreshToken) {
    return NextResponse.redirect("/?error=missing_refresh_token");
  }

  // ♻️ Exchange refresh token for new access token
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.TWITTER_CLIENT_ID,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error("Failed to refresh token", tokenData);
    return NextResponse.redirect("/?error=refresh_failed");
  }

  // 💾 Save new token data
  await setDoc(
    userRef,
    {
      twitterTokens: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? refreshToken, // fallback if Twitter didn't return new one
        expires_in: tokenData.expires_in,
      },
    },
    { merge: true }
  );

  return NextResponse.redirect("/dashboard?refreshed=true");
}
