import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

let firebaseConfig: any;

// In Firebase App Hosting, the config is provided as a JSON string.
// We parse it. For local dev, we fall back to NEXT_PUBLIC_ vars.
try {
  if (process.env.FIREBASE_WEBAPP_CONFIG) {
    firebaseConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
    console.log('Firebase configured using FIREBASE_WEBAPP_CONFIG.');
  } else {
    // Fallback for local development
    console.log('Using NEXT_PUBLIC_ variables for Firebase config.');
    firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
  }
} catch(e) {
  console.error("Could not parse Firebase config.", e);
}


// A simple check to see if the config is valid
export const isFirebaseConfigured = () => {
    const isConfigured = firebaseConfig && firebaseConfig.apiKey;
    if (!isConfigured) {
        console.warn('Firebase not configured. Please check your environment variables.');
    }
    return isConfigured;
};


// Initialize Firebase app (avoid duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app, 'userdb'); // Specify the userdb database
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Auth providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');

export { auth, db, analytics, googleProvider, githubProvider };
export default app;
