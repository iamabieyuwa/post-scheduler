// app/lib/firebase-admin.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!rawKey) {
      console.warn("⚠️ FIREBASE_PRIVATE_KEY is missing. Skipping initialization for build.");
    } else {
      // 🔓 Decode Base64 if it doesn't look like a standard PEM key
      const isBase64 = !rawKey.includes("-----BEGIN PRIVATE KEY-----");
      const decodedKey = isBase64 
        ? Buffer.from(rawKey, 'base64').toString('utf8') 
        : rawKey;

      // 🛠️ Ensure newlines are correctly handled (\n vs actual new lines)
      const finalKey = decodedKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: finalKey,
        }),
      });
      console.log("✅ Firebase Admin Initialized Successfully");
    }
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error.message);
    // During build, we prevent a hard crash so the deploy can finish
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      throw error;
    }
  }
}

export const adminDb = admin.firestore();