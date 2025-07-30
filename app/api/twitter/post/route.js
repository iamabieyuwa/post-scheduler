// app/api/twitter/post/route.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getValidTwitterAccessToken } from '../../../lib/twitter'

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const firebaseToken = cookieStore.get("firebase_token")?.value;

    if (!firebaseToken) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(firebaseToken);
    const uid = decoded.uid;

    const body = await req.json();
    const tweetText = body.text;

    if (!tweetText) {
      return NextResponse.json({ error: "Missing tweet text" }, { status: 400 });
    }

    // ✅ Refresh if needed
    const accessToken = await getValidTwitterAccessToken(uid);

    // 🐦 Post to Twitter
    const twitterRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: tweetText }),
    });

    const result = await twitterRes.json();

    if (!twitterRes.ok) {
      console.error("Twitter API error", result);
      return NextResponse.json({ error: "Failed to post tweet", details: result }, { status: 500 });
    }

    return NextResponse.json({ success: true, tweet: result.data });
  } catch (err) {
    console.error("Twitter post error", err);
    return NextResponse.json({ error: "Something went wrong", message: err.message }, { status: 500 });
  }
}
