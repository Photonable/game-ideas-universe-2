"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth, googleProvider, githubProvider, isFirebaseConfigured } from '@/lib/firebase'
import { createUserProfile, getUserProfile } from '@/lib/firebaseData'
import { UserProfile } from '@/lib/localStorage'

interface AuthContextType {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  loginWithGoogle: () => Promise<boolean>
  loginWithGithub: () => Promise<boolean>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshUserProfile: () => Promise<void>
  clearAuthState: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Force loading to false after component mount to prevent permanent loading
  useEffect(() => {
    const forceStopLoading = setTimeout(() => {
      console.log('🛡️ Safety timeout: forcing loading to false')
      setLoading(false)
    }, 2000) // 2 second safety net

    return () => clearTimeout(forceStopLoading)
  }, [])

  // Email/Password Authentication
  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured. Please check your environment variables.')
    }
    try {
      console.log('🔍 AUTH DEBUG: Starting email/password login...')

      // Shorter timeout for email auth
      const loginPromise = signInWithEmailAndPassword(auth, email, password)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email login timeout')), 8000)
      )

      const result = await Promise.race([loginPromise, timeoutPromise]) as any
      console.log('🔍 AUTH DEBUG: Email login successful:', result.user.uid)

      // Force clear loading state on successful login
      setLoading(false)

    } catch (error: any) {
      // Always clear loading state on error
      setLoading(false)

      if (error.message === 'Email login timeout') {
        console.error('🔍 AUTH DEBUG: Email login timed out')
        throw new Error('Login is taking too long. Please check your internet connection and try again.')
      }
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string) => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured. Please check your environment variables.')
    }
    try {
      console.log('🔍 AUTH DEBUG: Starting email/password registration...')

      // Shorter timeout for registration
      const registerPromise = createUserWithEmailAndPassword(auth, email, password)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Registration timeout')), 8000)
      )

      const { user } = await Promise.race([registerPromise, timeoutPromise]) as any
      console.log('🔍 AUTH DEBUG: Registration successful:', user.uid)

      await updateProfile(user, { displayName: name })
      console.log('🔍 AUTH DEBUG: Profile updated with name')

      // Force clear loading state on successful registration
      setLoading(false)

      // Create user profile in Firestore (non-blocking background operation)
      setTimeout(async () => {
        try {
          await createUserProfile(user, { name })
          console.log('🔍 AUTH DEBUG: Firestore profile created in background')
        } catch (firestoreError) {
          console.warn('🔍 AUTH DEBUG: Firestore profile creation failed (non-critical):', firestoreError)
        }
      }, 100)

    } catch (error: any) {
      // Always clear loading state on error
      setLoading(false)

      if (error.message === 'Registration timeout') {
        console.error('🔍 AUTH DEBUG: Registration timed out')
        throw new Error('Registration is taking too long. Please check your internet connection and try again.')
      }
      console.error('Registration error:', error)
      throw error
    }
  }

  // Social Authentication - using popup instead of redirect
  const loginWithGoogle = async (): Promise<boolean> => {
    console.log('🔍 Starting Google login with popup...')
    console.log('🔍 Firebase configured:', isFirebaseConfigured())
    console.log('🔍 Google provider exists:', !!googleProvider)

    if (!isFirebaseConfigured()) {
      console.error('❌ Firebase not configured')
      throw new Error('Firebase not configured. Please check your environment variables.')
    }
    if (!googleProvider) {
      console.error('❌ Google provider not initialized')
      throw new Error('Google authentication not initialized.')
    }
    try {
      console.log('🔍 Initiating Google popup...')
      const result = await signInWithPopup(auth, googleProvider)
      console.log('✅ Google login successful:', result.user.email)
      return true
    } catch (error: any) {
      console.error('Google login error:', error)

      // Handle popup blocked or closed by user
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        console.log('🔄 Popup blocked/closed, trying redirect as fallback...')
        try {
          await signInWithRedirect(auth, googleProvider)
          return true
        } catch (redirectError) {
          console.error('Redirect fallback also failed:', redirectError)
          throw new Error('Google login failed. Please try again or use email login.')
        }
      }

      throw error
    }
  }

  const loginWithGithub = async (): Promise<boolean> => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured. Please check your environment variables.')
    }
    if (!githubProvider) {
      throw new Error('GitHub authentication not initialized.')
    }
    try {
      await signInWithRedirect(auth, githubProvider)
      // Note: This will redirect the page, so we won't reach this point
      return true
    } catch (error: any) {
      console.error('GitHub login error:', error)
      throw error
    }
  }

  // Logout
  const logout = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  // Password Reset
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  // Update User Profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('No user logged in')

    try {
      const { updateUserProfile: updateProfileInDB } = await import('@/lib/firebaseData')
      await updateProfileInDB(currentUser.uid, updates)

      // Reload user profile
      await refreshUserProfile()
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  // Refresh User Profile from Firebase
  const refreshUserProfile = async () => {
    if (!currentUser) throw new Error('No user logged in')

    try {
      console.log('🔄 Refreshing user profile from Firebase...')
      const updatedProfile = await getUserProfile(currentUser.uid)
      console.log('📋 Fetched profile:', updatedProfile)
      setUserProfile(updatedProfile)
      console.log('✅ User profile refreshed successfully')
    } catch (error) {
      console.error('❌ Profile refresh error:', error)
      throw error
    }
  }

  // Clear stuck auth state and sign out completely
  const clearAuthState = async () => {
    console.log('🔄 Clearing auth state manually')

    // Force loading to false immediately
    setLoading(false)
    setCurrentUser(null)
    setUserProfile(null)

    try {
      // Sign out from Firebase
      await signOut(auth)
      console.log('✅ Firebase signout completed')
    } catch (error) {
      console.log('ℹ️ No active Firebase session to sign out (this is normal)')
    }

    // Clear any pending redirects or auth operations
    try {
      // Clear any redirect state that might be hanging
      await getRedirectResult(auth)
    } catch (error) {
      console.log('ℹ️ Cleared any pending redirect state')
    }

    // Force a small delay then ensure state is cleared
    setTimeout(() => {
      setLoading(false)
      setCurrentUser(null)
      setUserProfile(null)
      console.log('✅ Auth state completely cleared')
    }, 100)
  }

  // Auth state listener
  useEffect(() => {
    console.log('🔍 AUTH DEBUG: Setting up auth state listener...')
    console.log('🔍 AUTH DEBUG: Firebase configured check:', isFirebaseConfigured())

    // Log detailed Firebase configuration for debugging
    console.log('🔍 AUTH DEBUG: Detailed Firebase config:')
    console.log('🔍 AUTH DEBUG: Project ID:', auth.app.options.projectId)
    console.log('🔍 AUTH DEBUG: Auth Domain:', auth.app.options.authDomain)
    console.log('🔍 AUTH DEBUG: API Key (first 10 chars):', auth.app.options.apiKey?.substring(0, 10))
    console.log('🔍 AUTH DEBUG: App ID:', auth.app.options.appId)

    if (!isFirebaseConfigured()) {
      console.warn('🔍 AUTH DEBUG: Firebase not configured, setting loading to false')
      setLoading(false)
      return
    }

    console.log('🔍 AUTH DEBUG: Firebase configured, setting up onAuthStateChanged listener')

    // Skip redirect result checking entirely since we're using popup auth
    console.log('🔍 AUTH DEBUG: Using popup auth - skipping redirect result check')

    // Also check Firebase auth state directly
    setTimeout(() => {
      console.log('🔍 AUTH DEBUG: Direct Firebase auth check...')
      console.log('🔍 AUTH DEBUG: auth.currentUser:', !!auth.currentUser)
      if (auth.currentUser) {
        console.log('🔍 AUTH DEBUG: Direct user email:', auth.currentUser.email)
        console.log('🔍 AUTH DEBUG: Direct user UID:', auth.currentUser.uid)
      }
    }, 2000)

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 AUTH DEBUG: Auth state changed!')
      console.log('🔍 AUTH DEBUG: User object:', !!user)

      // Always set loading to false first to prevent hanging
      setLoading(false)
      setCurrentUser(user)

      if (user) {
        console.log('🔍 AUTH DEBUG: User UID:', user.uid)
        console.log('🔍 AUTH DEBUG: User email:', user.email)
        console.log('🔍 AUTH DEBUG: User displayName:', user.displayName)

        // Always create a basic profile immediately (fast path)
        const basicProfile: UserProfile = {
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          joinDate: new Date(),
          totalGenerations: 0,
          ideasSaved: 0,
          favoriteCategories: [],
          generationHistory: [],
          subscriptionType: 'free',
          subscriptionStatus: 'inactive',
          hasUsedFreeGeneration: false,
          generationsRemaining: 1
        }

        console.log('📋 Setting basic profile immediately')
        setUserProfile(basicProfile)

        // Try to load/create full profile in background (non-blocking)
        setTimeout(async () => {
          try {
            console.log('📋 Background: Loading full profile for:', user.uid)

            const profilePromise = getUserProfile(user.uid)
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile load timeout')), 2000)
            )

            const profile = await Promise.race([profilePromise, timeoutPromise]) as UserProfile | null

            if (profile) {
              console.log('📋 Background: Full profile loaded')
              setUserProfile(profile)
            } else {
              console.log('📋 Background: Creating new profile...')
              try {
                const newProfile = await createUserProfile(user)
                console.log('📋 Background: New profile created')
                setUserProfile(newProfile)
              } catch (createError) {
                console.log('📋 Background: Profile creation failed, keeping basic profile')
              }
            }
          } catch (error) {
            console.log('📋 Background: Profile operations failed, keeping basic profile')
          }
        }, 100) // Load in background after 100ms

      } else {
        setUserProfile(null)
      }
    })

    // Set aggressive timeout to prevent hanging
    const maxLoadingTimeout = setTimeout(() => {
      console.log('⏰ Maximum loading time reached, forcing app to load')
      setLoading(false)
    }, 3000) // 3 seconds maximum - very aggressive

    // Also set an immediate timeout to ensure loading doesn't get stuck
    const immediateTimeout = setTimeout(() => {
      if (loading) {
        console.log('⚡ Immediate timeout - ensuring loading is false')
        setLoading(false)
      }
    }, 1000) // 1 second immediate check

    return () => {
      unsubscribe()
      clearTimeout(maxLoadingTimeout)
      clearTimeout(immediateTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    logout,
    resetPassword,
    updateUserProfile,
    refreshUserProfile,
    clearAuthState
  }

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-3 w-16 h-16 mx-auto flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Game Ideas Universe
            </h2>
            <p className="text-gray-600">Loading your creative workspace...</p>
            <div className="text-xs text-gray-500">
              If this takes too long, there might be a connection issue
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export default AuthProvider
