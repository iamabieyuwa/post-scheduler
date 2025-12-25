// /utils/uploadMediaToTwitter.js

export async function uploadMediaToTwitter(url, accessToken) {
  try {
    // 1. Fetch with a User-Agent header to avoid being blocked by the 3rd party
    const mediaRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!mediaRes.ok) {
      throw new Error(`Failed to fetch image from 3rd party: ${mediaRes.status} ${mediaRes.statusText}`);
    }
    
    const arrayBuffer = await mediaRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Prepare the Form Data
    const formData = new FormData();
    formData.append('media', new Blob([buffer]));

    // 3. Post to Twitter
    const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Twitter Media API Error:', data);
      return null;
    }

    console.log('✅ Media ID generated:', data.media_id_string);
    return data.media_id_string;

  } catch (err) {
    console.error('❌ Media upload failed:', err.message);
    return null;
  }
}