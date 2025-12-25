import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore'; // ✅ Removed doc, getDoc, setDoc
import { initFirebaseAdmin } from './firebase-admin';

// don't initialize at module import — call init at runtime
function getDb() {
  return initFirebaseAdmin();
}

export async function getValidTwitterAccessToken(uid) {
  const db = getDb();
  
  // 🛡️ Safety Check for build-time
  if (!db) return null;

  // ✅ Switched to Admin syntax: db.collection().doc()
  const userDocRef = db.collection('users').doc(uid);
  const userSnap = await userDocRef.get();
  
  if (!userSnap.exists) throw new Error('User not found');

  const userData = userSnap.data();
  const tokens = userData.twitterTokens;
  if (!tokens?.refresh_token) throw new Error('No refresh token found');

  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: process.env.TWITTER_CLIENT_ID,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error('Failed to refresh Twitter token');
  }

  // ✅ Switched to Admin syntax: .set() with merge
  await userDocRef.set(
    {
      twitterTokens: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? tokens.refresh_token,
        expires_in: tokenData.expires_in,
      },
    },
    { merge: true }
  );

  return tokenData.access_token;
}