import { TwitterApi } from 'twitter-api-v2';

export async function uploadMediaToTwitter(url) {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_KEY_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    const mediaRes = await fetch(url);
    if (!mediaRes.ok) throw new Error("Cloudinary fetch failed");
    
    const buffer = Buffer.from(await mediaRes.arrayBuffer());

    console.log("📤 Uploading media...");
    // ✅ Fix: Use mimeType to avoid deprecation warnings
    const mediaId = await client.v1.uploadMedia(buffer, { 
      mimeType: url.endsWith('.png') ? 'image/png' : 'image/jpeg' 
    });

    return mediaId;
  } catch (err) {
    console.error('❌ Media upload failed:', err.message);
    return null;
  }
}