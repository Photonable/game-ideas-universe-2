import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-DEMO'
}

// Check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  const configured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
         process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'demo-key'

  console.log('Firebase configured:', configured)
  console.log('API Key exists:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
  console.log('API Key value:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...')

  return configured
}

// Initialize Firebase app (avoid duplicate initialization)
let app
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  console.log('Firebase app initialized successfully')
} catch (error) {
  console.error('Firebase initialization error:', error)
  throw error
}

// Initialize Firebase services
const auth = getAuth(app)
const db = getFirestore(app, 'userdb')  // Specify the userdb database

// Initialize Analytics (only on client side)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

// Auth providers - initialize only if Firebase is configured
let googleProvider: GoogleAuthProvider | null = null
let githubProvider: GithubAuthProvider | null = null

if (isFirebaseConfigured()) {
  googleProvider = new GoogleAuthProvider()
  githubProvider = new GithubAuthProvider()

  // Configure providers
  googleProvider.addScope('profile')
  googleProvider.addScope('email')

  githubProvider.addScope('user:email')

  console.log('Auth providers initialized')
} else {
  console.warn('Firebase not properly configured - social auth will not work')
}

export { auth, db, analytics, googleProvider, githubProvider }
export default app
