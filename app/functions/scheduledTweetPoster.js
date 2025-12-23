import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
// <-- Use the actual helper exported by the repo
import { getValidTwitterAccessToken } from '../lib/twitter.js';
import { uploadMediaToTwitter } from '../utils/uploadMediaToTwitter.js'; // <-- helper required

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

  const snapshot = await db
    .collection('posts')
    // ✅ REMOVED: .where('postNow', '==', false)
    .where('status', '==', 'pending') // Only look for things not yet sent
    .where('scheduledAt', '<=', now.toISOString()) // Whose time has arrived
    .get();

  if (snapshot.empty) {
    console.log('⏳ No pending tweets to post.');
    return;
  }

  for (const doc of snapshot.docs) {
    const post = doc.data();
    const postId = doc.id;

    try {
      const userDoc = await db.collection('users').doc(post.userId).get();
      const userData = userDoc.data();
      const tokens = userData?.twitterTokens;

      if (!tokens?.access_token || !tokens?.refresh_token) {
        throw new Error('Missing Twitter tokens');
      }

      // <-- call the correctly named helper
      const accessToken = await getValidTwitterAccessToken(post.userId);

      const media = Array.isArray(post.media) ? post.media : [];
      const mediaIds = [];

      for (const file of media) {
        const mediaId = await uploadMediaToTwitter(file.url, accessToken);
        if (mediaId) mediaIds.push(mediaId);
      }

      const thread = post.postFormat?.thread || [];
      const isThread = thread.length > 0;

      let firstTweetId = null;

      if (isThread) {
        for (let i = 0; i < thread.length; i++) {
          const block = thread[i];
          const tweetData = {
            text: block.text || '',
          };

          if (block.images?.length) {
            const blockMediaIds = [];
            for (const imgUrl of block.images) {
              const mediaId = await uploadMediaToTwitter(imgUrl, accessToken);
              if (mediaId) blockMediaIds.push(mediaId);
            }
            if (blockMediaIds.length > 0) {
              tweetData.media = { media_ids: blockMediaIds };
            }
          }

          const response = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              i === 0
                ? tweetData
                : { ...tweetData, reply: { in_reply_to_tweet_id: firstTweetId } }
            ),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(`Twitter API error: ${JSON.stringify(result)}`);
          }

          if (i === 0) {
            firstTweetId = result.data?.id;
          }
        }
      } else {
        const payload = {
          text: post.content || '',
        };

        if (mediaIds.length > 0) {
          payload.media = { media_ids: mediaIds };
        }

        const res = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(`Twitter API error: ${JSON.stringify(result)}`);
        }

        firstTweetId = result.data?.id;
      }

      await db.collection('posts').doc(postId).update({
        status: 'posted',
        twitterId: firstTweetId || null,
        postedAt: new Date().toISOString(),
      });

      console.log(`✅ Posted: ${postId}`);
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