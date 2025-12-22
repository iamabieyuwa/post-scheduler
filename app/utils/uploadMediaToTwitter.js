// /utils/uploadMediaToTwitter.js
import axios from 'axios';
import FormData from 'form-data';

/**
 * Uploads media to Twitter using the v1.1 chunked upload API.
 * Even though we use v2 for Tweets, media must still be uploaded via v1.1.
 */
export async function uploadMediaToTwitter(url, accessToken) {
  try {
    // 1. Fetch the media from the provided URL (Firebase Storage)
    const mediaRes = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const mediaType = mediaRes.headers['content-type'];
    const mediaData = Buffer.from(mediaRes.data);
    const totalBytes = mediaData.length;

    // 2. INIT - Tell Twitter we are starting an upload
    const initRes = await axios.post(
      'https://upload.twitter.com/1.1/media/upload.json',
      new URLSearchParams({
        command: 'INIT',
        total_bytes: totalBytes.toString(),
        media_type: mediaType,
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const mediaId = initRes.data.media_id_string;

    // 3. APPEND - Upload the actual file data
    // We use FormData here because Twitter requires multipart/form-data for binary files
    const form = new FormData();
    form.append('command', 'APPEND');
    form.append('media_id', mediaId);
    form.append('segment_index', '0');
    form.append('media', mediaData);

    await axios.post(
      'https://upload.twitter.com/1.1/media/upload.json',
      form,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...form.getHeaders(),
        },
      }
    );

    // 4. FINALIZE - Tell Twitter we are done
    await axios.post(
      'https://upload.twitter.com/1.1/media/upload.json',
      new URLSearchParams({
        command: 'FINALIZE',
        media_id: mediaId,
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return mediaId;
  } catch (err) {
    // Detailed error logging to help you debug
    if (err.response) {
      console.error('❌ Twitter Media Upload Error:', err.response.data);
    } else {
      console.error('❌ Media upload failed:', err.message);
    }
    return null;
  }
}