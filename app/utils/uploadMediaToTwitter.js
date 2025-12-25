export async function uploadMediaToTwitter(url, accessToken) {
  try {
    // 1. Fetch from Cloudinary
    const mediaRes = await fetch(url);
    if (!mediaRes.ok) throw new Error(`Cloudinary fetch failed: ${mediaRes.statusText}`);
    
    const arrayBuffer = await mediaRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Prepare Form Data (Twitter v1.1 style)
    const formData = new FormData();
    formData.append('media', new Blob([buffer]));

    // 3. Upload to Twitter
    const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Twitter Media Upload Error:', data);
      return null;
    }

    return data.media_id_string;
  } catch (err) {
    console.error('❌ Media upload utility failed:', err.message);
    return null;
  }
}