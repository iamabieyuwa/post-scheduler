export const runtime = 'nodejs';
import {postScheduledTweets} from "../../functions/scheduledTweetPoster"
export const config = {
  schedule: '*/1 * * * *', // Every minute
};

export async function GET() {
  try {
    console.log('🔁 Cron job triggered at', new Date().toISOString());

    await postScheduledTweets(); // your function

    return new Response("✅ Tweets checked and posted", { status: 200 });
  } catch (err) {
    console.error("❌ Cron error:", err.message);
    return new Response("Error posting tweets", { status: 500 });
  }
}
