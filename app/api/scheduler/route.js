// app/api/scheduler/route.js
import { postScheduledTweets } from "../../functions/scheduledTweetPoster.js"

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Now this function will be recognized!
    await postScheduledTweets(); 
    
    return new Response(JSON.stringify({ message: "Success" }), { status: 200 });
  } catch (err) {
    console.error("SCHEDULER_CRASH:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}