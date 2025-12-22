// app/api/scheduler/route.js

export async function GET(req) {
  const auth = req.headers.get('Authorization');
  
  // This must match the CRON_SECRET in your .env file
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    console.log('🔁 Manual trigger received at', new Date().toISOString());
    await postScheduledTweets(); 
    return new Response("✅ Tweets checked and posted", { status: 200 });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}