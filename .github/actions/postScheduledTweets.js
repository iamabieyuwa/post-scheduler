
import { postScheduledTweets } from "../../app/functions/scheduledTweetPoster.js";

(async () => {
  try {
    await postScheduledTweets();
    console.log("✅ Scheduled tweets posted successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error posting scheduled tweets:", err);
    process.exit(1);
  }
})();