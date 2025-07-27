// functions/index.js (or .ts)

import * as functions from "firebase-functions";
import { postScheduledTweets } from "./scheduleTweetPoster.js"; // Adjust path as needed

export const runScheduledTweets = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context) => {
    try {
      await postScheduledTweets();
      console.log("✅ Scheduled tweets posted successfully.");
    } catch (error) {
      console.error("❌ Error posting scheduled tweets:", error);
    }
    return null;
  });
