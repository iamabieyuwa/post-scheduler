import * as dotenv from "dotenv";
import { initFirebaseAdmin } from "../lib/firebase-admin.js";
import { getValidTwitterAccessToken } from "../lib/twitter.js";
import { uploadMediaToTwitter } from "../utils/uploadMediaToTwitter.js";

dotenv.config();

export async function postScheduledTweets() {
  // ✅ 1. Get the database instance
  const db = initFirebaseAdmin();

  // 🛡️ 2. Safety Check: If db is null (happens during Vercel build phase), exit early
  if (!db) {
    console.log("⚠️ Database not initialized (likely build phase). Skipping.");
    return;
  }

  const now = new Date();

  // Your existing query logic
  const snapshot = await db
    .collection("posts")
    .where("status", "==", "pending")
    .where("scheduledAt", "<=", now.toISOString())
    .get();

  if (snapshot.empty) {
    console.log("⏳ No pending tweets to post.");
    return;
  }

  for (const doc of snapshot.docs) {
    const post = doc.data();
    const postId = doc.id;

    try {
      const userDoc = await db.collection("users").doc(post.userId).get();
      const userData = userDoc.data();
      const tokens = userData?.twitterTokens;

      if (!tokens?.access_token || !tokens?.refresh_token) {
        throw new Error("Missing Twitter tokens");
      }

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
            text: block.text || "",
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

          const response = await fetch("https://api.twitter.com/2/tweets", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              i === 0
                ? tweetData
                : {
                    ...tweetData,
                    reply: { in_reply_to_tweet_id: firstTweetId },
                  }
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
          text: post.content || "",
          media: {
            media_ids: [mediaId], // Must be an array of strings inside an object
          },
        };

        if (mediaIds.length > 0) {
          payload.media = { media_ids: mediaIds };
        }

        const res = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(`Twitter API error: ${JSON.stringify(result)}`);
        }

        firstTweetId = result.data?.id;
      }

      // ✅ 3. Ensure we use the Admin-safe update method (your syntax here was already good)
      await db
        .collection("posts")
        .doc(postId)
        .update({
          status: "posted",
          twitterId: firstTweetId || null,
          postedAt: new Date().toISOString(),
        });

      console.log(`✅ Posted: ${postId}`);
    } catch (err) {
      console.error(`❌ Failed to post ${postId}:`, err.message);

      // ✅ Same safety here
      await db.collection("posts").doc(postId).update({
        status: "failed",
        error: err.message,
        failedAt: new Date().toISOString(),
      });
    }
  }
}
