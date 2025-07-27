import { TwitterApi } from 'twitter-api-v2';

export async function GET(req) {
  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
  });

  const { url, oauth_token, oauth_token_secret } = await twitterClient.generateAuthLink(
    process.env.TWITTER_CALLBACK_URL,
    { linkMode: 'authorize' }
  );

  // Save oauth_token_secret in a secure session or Firebase (optional)

  return Response.redirect(url);
}
