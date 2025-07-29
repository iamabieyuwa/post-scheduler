import { TwitterApi } from 'twitter-api-v2';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

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
// Upload media file from a public URL to Twitter
async function uploadMedia(twitterClient, mediaList = []) {
  const uploadedIds = [];

  for (const media of mediaList) {
    try {
      const res = await fetch(media.url);
      const buffer = await res.arrayBuffer();

      const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(buffer), {
        mimeType: media.type,
      });

      uploadedIds.push(mediaId);
    } catch (e) {
      console.error('❌ Media upload failed:', e.message);
    }
  }

  return uploadedIds;
}

export async function postScheduledTweets() {
  const now = new Date();

  // 1. Get due posts that haven't been posted yet
  const snapshot = await db
    .collection('posts')
    .where('postNow', '==', false)
    .where('scheduledAt', '<=', now.toISOString())
    .where('status', '==', 'pending') // 🔥 Safer than using '!='
    .get();

  if (snapshot.empty) {
    console.log('⏳ No scheduled tweets to post at this time.');
    return;
  }

  for (const docSnap of snapshot.docs) {
    const post = docSnap.data();
    const postId = docSnap.id;

    try {
      // 2. Get user's connected Twitter account
      const userDoc = await db.collection('users').doc(post.userId).get();
      const twitter = userDoc.data()?.connectedAccounts?.twitter;

      if (!twitter) throw new Error(`User ${post.userId} not connected to Twitter`);

      const twitterClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: twitter.accessToken,
        accessSecret: twitter.accessSecret,
      });

      // 3. Media Upload (if any)
      let globalMediaIds = [];
      if (Array.isArray(post.media) && post.media.length > 0) {
        globalMediaIds = await uploadMedia(twitterClient, post.media);
      }

      // 4. Thread Posting
      const thread = post.postFormat?.thread;
      let tweetResponse = null;

      if (Array.isArray(thread) && thread.length > 0) {
        let lastTweetId = null;

        for (const block of thread) {
          const text = block.text?.trim() || "";
          if (!text && !block.images?.length) continue;

          let blockMediaIds = [];
          if (Array.isArray(block.images) && block.images.length > 0) {
            blockMediaIds = await uploadMedia(twitterClient, block.images);
          }

          const tweet = await twitterClient.v2.tweet({
            text: text || "(image only)",
            reply: lastTweetId ? { in_reply_to_tweet_id: lastTweetId } : undefined,
            media: blockMediaIds.length ? { media_ids: blockMediaIds } : undefined,
          });

          lastTweetId = tweet.data.id;
        }
      } else {
        // 5. Fallback Single Post
        tweetResponse = await twitterClient.v2.tweet({
          text: post.content || "[Empty post]",
          media: globalMediaIds.length ? { media_ids: globalMediaIds } : undefined,
        });
      }

      // 6. Update post status
      await db.collection('posts').doc(postId).update({
        status: 'posted',
        postedAt: new Date().toISOString(),
        twitterId: tweetResponse?.data?.id || null,
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
