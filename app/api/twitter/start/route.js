// app/api/twitter/start/route.js
import { NextResponse } from "next/server";

// Helper: generate UUID (for state, in real apps use secure CSRF protection)
function generateRandomString() {
  return [...Array(32)].map(() => Math.floor(Math.random() * 36).toString(36)).join("");
}

export async function GET() {
  const state = generateRandomString();
  const codeVerifier = generateRandomString();
  const codeChallenge = codeVerifier; // In production, hash this with SHA-256 and base64url it

  // Save `codeVerifier` and `state` to cookies (or Firebase later)

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID,
    redirect_uri: "http://localhost:3000/api/twitter/callback",
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "plain", // use "S256" in real apps
  });

  const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

  return NextResponse.redirect(twitterAuthUrl);
}
