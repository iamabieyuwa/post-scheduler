// /utils/uploadMediaToTwitter.js
import axios from 'axios';

export async function uploadMediaToTwitter(url, accessToken) {
  try {
    const mediaRes = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const mediaType = mediaRes.headers['content-type'];
    const mediaData = mediaRes.data;

    const initRes = await axios.post(
      'https://upload.twitter.com/1.1/media/upload.json',
      new URLSearchParams({
        command: 'INIT',
        total_bytes: mediaData.byteLength.toString(),
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

    await axios.post(
      'https://upload.twitter.com/1.1/media/upload.json',
      new URLSearchParams({
        command: 'APPEND',
        media_id: mediaId,
        segment_index: '0',
        media: Buffer.from(mediaData).toString('base64'),
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

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
    console.error('❌ Media upload failed:', err.message);
    return null;
  }
}
