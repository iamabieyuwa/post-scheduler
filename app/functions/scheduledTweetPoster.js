import * as dotenv from 'dotenv';
import { initFirebaseAdmin } from '../lib/firebase-admin.js';
import { getValidTwitterAccessToken } from '../lib/twitter.js';
import { uploadMediaToTwitter } from '../utils/uploadMediaToTwitter.js';

dotenv.config();

export async function postScheduledTweets() {
  const db = initFirebaseAdmin();
  if (!db) return;

  const now = new Date();

  const snapshot = await db
    .collection('posts')
    .where('status', '==', 'pending')
    .where('scheduledAt', '<=', now.toISOString())
    .get();

  if (snapshot.empty) {
    console.log('⏳ No pending tweets to post.');
    return;
  }

  for (const doc of snapshot.docs) {
    const post = doc.data();
    const postId = doc.id;

    try {
      const accessToken = await getValidTwitterAccessToken(post.userId);
      if (!accessToken) throw new Error("Could not refresh Twitter token");

      // 1. Process Main Media (Cloudinary URLs)
      const media = Array.isArray(post.media) ? post.media : [];
      const mainMediaIds = [];

      for (const file of media) {
        // file.url comes from your Cloudinary DB structure
        const twitterMediaId = await uploadMediaToTwitter(file.url, accessToken);
        if (twitterMediaId) mainMediaIds.push(twitterMediaId);
      }

      const thread = post.postFormat?.thread || [];
      const isThread = thread.length > 0;
      let firstTweetId = null;

      if (isThread) {
        // --- THREAD LOGIC ---
        for (let i = 0; i < thread.length; i++) {
          const block = thread[i];
          const tweetData = { text: block.text || '' };

          // Handle media inside thread blocks
          if (block.images?.length) {
            const blockMediaIds = [];
            for (const imgUrl of block.images) {
              const mId = await uploadMediaToTwitter(imgUrl, accessToken);
              if (mId) blockMediaIds.push(mId);
            }
            if (blockMediaIds.length > 0) tweetData.media = { media_ids: blockMediaIds };
          } 
          // If it's the first tweet of a thread, attach the main media
          else if (i === 0 && mainMediaIds.length > 0) {
            tweetData.media = { media_ids: mainMediaIds };
          }

          const response = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              i === 0 ? tweetData : { ...tweetData, reply: { in_reply_to_tweet_id: firstTweetId } }
            ),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(`Twitter Thread Error: ${JSON.stringify(result)}`);
          if (i === 0) firstTweetId = result.data?.id;
        }
      } else {
        // --- SINGLE TWEET LOGIC ---
        const payload = { text: post.content || '' };
        if (mainMediaIds.length > 0) {
          payload.media = { media_ids: mainMediaIds };
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
        if (!res.ok) throw new Error(`Twitter API Error: ${JSON.stringify(result)}`);
        firstTweetId = result.data?.id;
      }

      // Success Update
      await db.collection('posts').doc(postId).update({
        status: 'posted',
        twitterId: firstTweetId || null,
        postedAt: new Date().toISOString(),
        error: null // Clear previous errors
      });

      console.log(`✅ Successfully posted: ${postId}`);

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