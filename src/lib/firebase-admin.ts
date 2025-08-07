import * as admin from 'firebase-admin';

/**
 * A function that lazily initializes the Firebase Admin SDK.
 * This prevents the SDK from being initialized during the build process.
 * It ensures the app is initialized only once.
 * 
 * @returns The Firestore database instance.
 */
function getAdminDb() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      // Throw the error to prevent the app from continuing with a faulty configuration.
      throw new Error('Failed to initialize Firebase Admin SDK.');
    }
  }
  return admin.firestore();
}

export { getAdminDb };
