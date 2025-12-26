import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
// ✅ Import the initialization function
import { initFirebaseAdmin } from "../../../lib/firebase-admin"; 

export async function GET(req) {
  // 1. CRITICAL: Initialize Firebase and get the DB instance immediately
  // This ensures the 'default' app is ready for getAuth() and getFirestore()
  let db;
  try {
    db = initFirebaseAdmin();
  } catch (error) {
    console.error("❌ Firebase Initialization failed:", error.message);
    return NextResponse.redirect(new URL("/connect?error=internal_server_error", req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/connect?error=missing_code", req.url));
  }

  const cookieStore = cookies();
  const codeVerifier = cookieStore.get("twitter_code_verifier")?.value;
  const firebaseToken = cookieStore.get("firebase_token")?.value;

  if (!codeVerifier || !firebaseToken) {
    return NextResponse.redirect(new URL("/connect?error=missing_verifier_or_token", req.url));
  }

  // 2. verifyIdToken now has a registered Firebase app to use
  let uid;
  try {
    const decoded = await getAuth().verifyIdToken(firebaseToken);
    uid = decoded.uid;
  } catch (err) {
    console.error("❌ Firebase Auth Verification Failed:", err.message);
    return NextResponse.redirect(new URL("/connect?error=firebase_auth_failed", req.url));
  }

  // 🎫 Exchange authorization code for access + refresh tokens
  let tokenData;
  try {
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://post-scheduler-pearl.vercel.app/api/twitter/callback",
        client_id: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error || "Token exchange failed");
    }
  } catch (err) {
    console.error("❌ Twitter token exchange failed", err);
    return NextResponse.redirect(new URL("/connect?error=token_exchange_failed", req.url));
  }

  const expiresAt = Date.now() + tokenData.expires_in * 1000;

  // 👤 Get Twitter user profile
  let userInfo;
  try {
    const userInfoRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    userInfo = await userInfoRes.json();
    if (!userInfo.data) {
      throw new Error("User info fetch failed");
    }
  } catch (err) {
    console.error("❌ Twitter user info fetch failed", err);
    return NextResponse.redirect(new URL("/connect?error=user_info_failed", req.url));
  }

  // 💾 Save to Firestore
  try {
    // db is already initialized at the top of the function
    await db.collection("users").doc(uid).set(
      {
        twitterTokens: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          expires_at: expiresAt,
          scope: tokenData.scope,
          token_type: tokenData.token_type,
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

    // ✅ CLEANUP: Remove temporary cookies after successful connection
    cookieStore.delete("twitter_code_verifier");
    // Only delete firebase_token if you don't need it for the rest of the session
  } catch (err) {
    console.error("❌ Firestore write failed", err);
    return NextResponse.redirect(new URL("/connect?error=firestore_write_failed", req.url));
  }

  return NextResponse.redirect(new URL("/connect?success=twitter_connected", req.url));
}