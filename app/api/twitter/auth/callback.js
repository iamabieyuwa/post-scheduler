import { TwitterApi } from 'twitter-api-v2';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const oauth_token = searchParams.get("oauth_token");
  const oauth_verifier = searchParams.get("oauth_verifier");
  const uid = searchParams.get("uid"); // Optional way to identify the Firebase user

  const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
  });

  const { client: loggedClient, accessToken, accessSecret } = await twitterClient.login(oauth_token, oauth_verifier);

  // Store in Firestore under user's account
  await setDoc(doc(db, "users", uid), {
    connectedAccounts: {
      twitter: {
        accessToken,
        accessSecret,
      },
    },
  }, { merge: true });

  return Response.redirect('/dashboard'); // or wherever you want
}
