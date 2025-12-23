import admin from "firebase-admin";

if (!admin.apps.length) {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  // 🛡️ CRITICAL: If there is no key (like during some build steps), 
  // just log a warning instead of crashing the whole deployment.
  if (!rawKey || rawKey === "undefined") {
    console.warn("⚠️ FIREBASE_PRIVATE_KEY is not set. Skipping Admin init for now.");
  } else {
    try {
      // 🔓 Decode Base64 if it's encoded
      const isBase64 = !rawKey.includes("-----BEGIN PRIVATE KEY-----");
      const decodedKey = isBase64 
        ? Buffer.from(rawKey, 'base64').toString('utf8') 
        : rawKey;

      // 🛠️ Ensure newlines are correct
      const finalKey = decodedKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: finalKey,
        }),
      });
      console.log("✅ Firebase Admin Initialized");
    } catch (error) {
      console.error("❌ Firebase Initialization Error:", error.message);
      // Only throw the error if we are NOT in the build process
      if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
         throw error;
      }
    }
  }
}

export const adminDb = admin.firestore();