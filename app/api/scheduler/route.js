
export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  
  // This MUST match the CRON_SECRET you saved in Vercel
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await postScheduledTweets(); 
    return new Response("✅ Posts Processed", { status: 200 });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
