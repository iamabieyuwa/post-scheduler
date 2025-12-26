import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function initFirebaseAdmin() {
  let app;

  // 1. Check if an app already exists
  if (!getApps().length) {
    if (
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL ||
      !process.env.FIREBASE_PRIVATE_KEY
    ) {
      throw new Error('❌ Missing Firebase environment variables.');
    }

    // 2. Format the private key (Vercel fix)
    const key = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim();

    // 3. Initialize the 'default' app
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: key,
      }),
    });
    console.log("🔥 Firebase Admin Initialized Successfully");
  } else {
    // 4. If it already exists, use the existing default app
    app = getApp();
  }

  // Always return the Firestore instance for the current context
  return getFirestore(app);
}