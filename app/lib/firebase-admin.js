// app/lib/firebase-admin.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    let rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!rawKey) {
      throw new Error("FIREBASE_PRIVATE_KEY is missing from environment variables");
    }

    // 🔓 Determine if the key is Base64 and decode it if necessary
    let finalKey;
    if (rawKey.includes("-----BEGIN PRIVATE KEY-----")) {
      finalKey = rawKey;
    } else {
      // It's likely Base64 encoded
      finalKey = Buffer.from(rawKey, 'base64').toString('utf8');
    }

    // 🛠️ Ensure newlines are correctly formatted for PEM
    const formattedKey = finalKey.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedKey,
      }),
    });
    console.log("✅ Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("❌ Firebase Admin Error:", error.message);
    // During build, we don't want to crash everything if it's just a config check
    if (process.env.NODE_ENV === 'production') {
       throw error; 
    }
  }
}

export const adminDb = admin.firestore();