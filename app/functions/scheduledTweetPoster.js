import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { getValidTwitterToken } from '../utils/getValidTwitterAccessToken.js';

dotenv.config();

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export async function postScheduledTweets() {
  const now = new Date();

  // 1. Get due posts that haven't been posted yet
  const snapshot = await db
    .collection('posts')
    .where('postNow', '==', false)
    .where('scheduledAt', '<=', now.toISOString())
    .where('status', '==', 'pending')
    .get();

  if (snapshot.empty) {
    console.log('⏳ No scheduled tweets to post at this time.');
    return;
  }

  for (const docSnap of snapshot.docs) {
    const post = docSnap.data();
    const postId = docSnap.id;

    try {
      // 2. Get user's Twitter OAuth2 tokens
      const userDoc = await db.collection('users').doc(post.userId).get();
      const userData = userDoc.data();
      const tokens = userData?.twitterTokens;

      if (!tokens?.access_token || !tokens?.refresh_token) {
        throw new Error(`User ${post.userId} missing Twitter tokens`);
      }

      // 3. Get valid access token (refresh if needed)
      const accessToken = await getValidTwitterToken(post.userId);

      // 4. Post to Twitter v2 (text-only for now)
      const tweetText = post.content || '[Empty post]';

      const twitterRes = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweetText }),
      });

      const tweetResult = await twitterRes.json();

      if (!twitterRes.ok) {
        throw new Error(`Twitter API error: ${JSON.stringify(tweetResult)}`);
      }

      // 5. Update post status
      await db.collection('posts').doc(postId).update({
        status: 'posted',
        postedAt: new Date().toISOString(),
        twitterId: tweetResult.data?.id || null,
      });

      console.log(`✅ Posted successfully: ${postId}`);
    } catch (err) {
      console.error(`❌ Failed to post ${postId}:`, err.message);

      await db.collection('posts').doc(postId).update({
        status: 'failed',
        error: err.message,
        failedAt: new Date().toISOString(),
      });
    }
  }
}