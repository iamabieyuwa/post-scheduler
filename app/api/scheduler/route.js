// app/api/scheduler/route.js
import { postScheduledTweets} from '../../functions/scheduledTweetPoster.js';

export const runtime = 'nodejs'; // use `edge` if you're doing lightweight things

// Vercel schedule format: https://vercel.com/docs/cron-jobs
export const config = {
  schedule: "*/1 * * * *", // Every 1 minute
};

export async function GET() {
  try {
    await postScheduledTweets();
    return new Response("✅ Tweets checked and posted", { status: 200 });
  } catch (err) {
    console.error("❌ Error running scheduler:", err.message);
    return new Response("Error posting tweets", { status: 500 });
  }
}
