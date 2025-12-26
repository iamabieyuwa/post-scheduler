import * as dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import { initFirebaseAdmin } from '../lib/firebase-admin.js';
import { uploadMediaToTwitter } from '../utils/uploadMediaToTwitter.js';

dotenv.config();

export async function postScheduledTweets() {
  const db = initFirebaseAdmin();
  if (!db) return;

  // Initialize Twitter Client with OAuth 1.0a (API Keys + Access Tokens)
  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_KEY_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

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
      // 1. Process Media (Cloudinary URLs)
      const media = Array.isArray(post.media) ? post.media : [];
      const mainMediaIds = [];

      for (const file of media) {
        const twitterMediaId = await uploadMediaToTwitter(file.url);
        if (twitterMediaId) mainMediaIds.push(twitterMediaId);
      }

      const thread = post.postFormat?.thread || [];
      const isThread = thread.length > 0;
      let lastTweetId = null;

      if (isThread) {
        // --- THREAD LOGIC ---
        for (let i = 0; i < thread.length; i++) {
          const block = thread[i];
          
          // ✅ FIX: Initialize tweetOptions for every block
          const tweetOptions = {};

          // Attach media only to the first tweet of the thread
          if (i === 0 && mainMediaIds.length > 0) {
            tweetOptions.media = { media_ids: mainMediaIds };
          }

          // Reply to the previous tweet in the thread
          if (i > 0 && lastTweetId) {
            tweetOptions.reply = { in_reply_to_tweet_id: lastTweetId };
          }

          const result = await twitterClient.v2.tweet(block.text || '', tweetOptions);
          lastTweetId = result.data.id;

          // Mandatory 5s cooldown between thread parts to avoid 429
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } else {
        // --- SINGLE TWEET LOGIC ---
        // ✅ FIX: Initialize tweetOptions here
        const tweetOptions = {};
        if (mainMediaIds.length > 0) {
          tweetOptions.media = { media_ids: mainMediaIds };
        }

        const result = await twitterClient.v2.tweet(post.content || '', tweetOptions);
        lastTweetId = result.data.id;
      }

      // Success Update
      await db.collection('posts').doc(postId).update({
        status: 'posted',
        twitterId: lastTweetId,
        postedAt: new Date().toISOString(),
        error: null
      });

      console.log(`✅ Successfully posted: ${postId}`);

      // General cooldown between separate posts
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (err) {
      console.error(`❌ Failed to post ${postId}:`, err.message);

      // 🚨 RATE LIMIT GUARD: Exit immediately if we hit a 429
      if (err.code === 429) {
        console.error("🛑 Rate limit hit. Exiting function to avoid longer block.");
        return; 
      }

      await db.collection('posts').doc(postId).update({
        status: 'failed',
        error: err.message,
        failedAt: new Date().toISOString(),
      });
    }
  }
}