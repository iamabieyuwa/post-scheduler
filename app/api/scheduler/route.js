export const runtime = 'nodejs';
import {postScheduledTweets} from "../../functions/scheduledTweetPoster"
export const config = {
  schedule: '*/1 * * * *', // Every minute
};

export async function GET(req) {
    const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    console.log('🔁 Cron job triggered at', new Date().toISOString());

    await postScheduledTweets(); // your function

    return new Response("✅ Tweets checked and posted", { status: 200 });
  } catch (err) {
    console.error("❌ Cron error:", err.message);
    return new Response("Error posting tweets", { status: 500 });
  }
}
