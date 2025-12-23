import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    // 🔓 This converts your Base64 string back into the real key
    const decodedKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY, 'base64').toString('utf8');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: decodedKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log("✅ Firebase Admin Connected via Base64");
  } catch (error) {
    console.error("❌ Firebase Admin Error:", error.message);
  }
}

export const adminDb = admin.firestore();