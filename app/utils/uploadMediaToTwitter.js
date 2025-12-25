import { TwitterApi } from 'twitter-api-v2';

export async function uploadMediaToTwitter(url) {
  try {
    // 1. Initialize Client with OAuth 1.0a (REQUIRED for Media)
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_KEY_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // 2. Fetch the image from Cloudinary
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    // 3. Upload using the library's helper
    // This handles the INIT/APPEND/FINALIZE logic perfectly
    console.log("📤 Uploading to Twitter via OAuth 1.0a...");
    const mediaId = await client.v1.uploadMedia(buffer, { type: 'png' });

    return mediaId;
  } catch (err) {
    console.error('❌ Media upload failed:', err.message);
    return null;
  }
}