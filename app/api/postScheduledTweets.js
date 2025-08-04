import { postScheduledTweets } from "../functions/scheduledTweetPoster";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await postScheduledTweets();
    res.status(200).json({ message: 'Scheduled tweets posted successfully' });
  } catch (error) {
    console.error('Error posting scheduled tweets:', error);
    res.status(500).json({ error: 'Failed to post scheduled tweets' });
  }
}
