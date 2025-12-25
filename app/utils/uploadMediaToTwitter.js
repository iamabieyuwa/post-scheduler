// /utils/uploadMediaToTwitter.js

export async function uploadMediaToTwitter(url, accessToken) {
  try {
    // 1. Fetch the image from Firebase
    const mediaRes = await fetch(url);
    if (!mediaRes.ok) throw new Error("Failed to fetch image from Firebase");
    
    const arrayBuffer = await mediaRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Create the Multipart Form
    // Note: We use the native Blob and FormData available in Node 18+
    const formData = new FormData();
    formData.append('media', new Blob([buffer]));

    // 3. Simple Upload Request (Single Step)
    // We use v1.1 but without the INIT/APPEND/FINALIZE complexity
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

    console.log('✅ Media Uploaded Successfully:', data.media_id_string);
    return data.media_id_string;

  } catch (err) {
    console.error('❌ Media upload failed:', err.message);
    return null;
  }
}