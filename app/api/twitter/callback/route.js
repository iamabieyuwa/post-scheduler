import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import "../../../lib/firebase-admin"; // sets up admin app

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // 🍪 Get verifier and Firebase ID token from cookies
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("twitter_code_verifier")?.value;
  const firebaseToken = cookieStore.get("firebase_token")?.value;

  if (!codeVerifier || !firebaseToken) {
    return NextResponse.json({ error: "Missing verifier or token" }, { status: 400 });
  }

  // ✅ Verify Firebase token and extract UID
  let uid;
  try {
    const decoded = await getAuth().verifyIdToken(firebaseToken);
    uid = decoded.uid;
  } catch (err) {
    console.error("Failed to verify Firebase token", err);
    return NextResponse.json({ error: "Invalid Firebase token" }, { status: 401 });
  }

  // 🎫 Exchange code for Twitter tokens
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "http://localhost:3000/api/twitter/callback",
      client_id: process.env.TWITTER_CLIENT_ID,
      code_verifier: codeVerifier,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.json(
      { error: "Token exchange failed", details: tokenData },
      { status: 500 }
    );
  }

  // 👤 Fetch Twitter user info
  const userInfoRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const userInfo = await userInfoRes.json();

  if (!userInfo.data) {
    return NextResponse.json(
      { error: "Failed to fetch Twitter user info", details: userInfo },
      { status: 500 }
    );
  }

  // 💾 Save to Firestore using Admin SDK (bypasses Firestore rules)
  const adminDb = getFirestore();
  await adminDb.collection("users").doc(uid).set(
    {
      twitterTokens: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
      },
      connectedAccounts: {
        twitter: true,
      },
      twitterProfile: {
        id: userInfo.data.id,
        name: userInfo.data.name,
        username: userInfo.data.username,
      },
    },
    { merge: true }
  );

  return NextResponse.redirect(new URL("/connect", req.url));

}
