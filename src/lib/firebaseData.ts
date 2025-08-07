import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { User } from 'firebase/auth'
import { db } from './firebase'
import { GameIdea, UserProfile } from './localStorage'

// Firestore Collections
const COLLECTIONS = {
  USERS: 'users',
  IDEAS: 'ideas',
  FAVORITES: 'favorites',
  GENERATION_HISTORY: 'generation_history',
  RECENTLY_VIEWED: 'recently_viewed'
}

// User Profile Management
export const createUserProfile = async (user: User, additionalData?: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    console.log('🔧 Creating user profile for:', user.uid)
    console.log('🔧 User auth state:', !!user, user.uid)
    const userRef = doc(db, COLLECTIONS.USERS, user.uid)

    const profile: UserProfile = {
      name: user.displayName || 'User',
      email: user.email || '',
      joinDate: new Date(),
      totalGenerations: 0,
      ideasSaved: 0,
      favoriteCategories: [],
      generationHistory: [],
      subscriptionType: 'free',
      subscriptionStatus: 'inactive',
      hasUsedFreeGeneration: false,
      generationsRemaining: 1,
      ...additionalData
    }

    console.log('🔧 Writing profile to Firestore...')
    console.log('🔧 Document path:', `users/${user.uid}`)
    console.log('🔧 Profile data:', profile)

    await setDoc(userRef, {
      ...profile,
      joinDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    console.log('✅ User profile created successfully')
    return profile
  } catch (error) {
    console.error('❌ Error creating user profile:', error)
    console.error('❌ Error code:', (error as any)?.code)
    console.error('❌ Error message:', (error as any)?.message)

    // Return a basic profile even if Firestore write fails
    const fallbackProfile: UserProfile = {
      name: user.displayName || 'User',
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

    console.log('🔄 Using fallback profile due to Firestore error')
    return fallbackProfile
  }
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('Getting user profile for:', userId)
    const userRef = doc(db, COLLECTIONS.USERS, userId)

    // Add strict timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 3000)
    )

    const userSnap = await Promise.race([
      getDoc(userRef),
      timeoutPromise
    ]) as any

    if (userSnap.exists()) {
      const data = userSnap.data()
      console.log('User profile found:', data)
      return {
        ...data,
        joinDate: data.joinDate?.toDate() || new Date()
      } as UserProfile
    }

    console.log('No user profile found')
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    // Return null quickly instead of hanging
    return null
  }
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// Claim/Unclaim Management
export const claimIdea = async (userId: string, idea: GameIdea): Promise<void> => {
  try {
    console.log('🔧 Claiming idea for user:', userId, 'Idea ID:', idea.id)

    // Update the idea in generation history to mark as claimed
    const q = query(
      collection(db, COLLECTIONS.GENERATION_HISTORY),
      where('idea.id', '==', idea.id)
    )

    const querySnapshot = await getDocs(q)
    const updatePromises = querySnapshot.docs.map(doc =>
      updateDoc(doc.ref, {
        'idea.claimed': true,
        'idea.claimedBy': userId,
        'idea.claimedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    )

    await Promise.all(updatePromises)

    // Also add to user's favorites automatically when claimed
    const favoriteRef = doc(db, COLLECTIONS.FAVORITES, `${userId}_${idea.id}`)
    await setDoc(favoriteRef, {
      userId,
      ideaId: idea.id,
      idea: { ...idea, claimed: true, claimedBy: userId },
      createdAt: serverTimestamp()
    })

    console.log('✅ Idea claimed successfully')
  } catch (error) {
    console.error('❌ Error claiming idea:', error)
    throw error
  }
}

export const unclaimIdea = async (userId: string, ideaId: number): Promise<void> => {
  try {
    console.log('🔧 Unclaiming idea for user:', userId, 'Idea ID:', ideaId)

    // Update the idea in generation history to mark as unclaimed
    const q = query(
      collection(db, COLLECTIONS.GENERATION_HISTORY),
      where('idea.id', '==', ideaId),
      where('idea.claimedBy', '==', userId)
    )

    const querySnapshot = await getDocs(q)
    const updatePromises = querySnapshot.docs.map(doc =>
      updateDoc(doc.ref, {
        'idea.claimed': false,
        'idea.claimedBy': null,
        'idea.claimedAt': null,
        updatedAt: serverTimestamp()
      })
    )

    await Promise.all(updatePromises)

    // Remove from user's favorites when unclaimed
    const favoriteRef = doc(db, COLLECTIONS.FAVORITES, `${userId}_${ideaId}`)
    await deleteDoc(favoriteRef)

    console.log('✅ Idea unclaimed successfully')
  } catch (error) {
    console.error('❌ Error unclaiming idea:', error)
    throw error
  }
}

// Game Ideas Management
export const saveGameIdea = async (userId: string, idea: GameIdea): Promise<string> => {
  try {
    const ideaRef = await addDoc(collection(db, COLLECTIONS.IDEAS), {
      ...idea,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return ideaRef.id
  } catch (error) {
    console.error('Error saving game idea:', error)
    throw error
  }
}

export const getUserIdeas = async (userId: string, limitCount = 50): Promise<GameIdea[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.IDEAS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: parseInt(doc.id) || Date.now(),
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        genre: data.genre || '',
        source: data.source || 'User Generated',
        viability: data.viability || 0,
        originality: data.originality || 0,
        marketAppeal: data.marketAppeal || 0,
        claimed: data.claimed || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        prompt: data.prompt
      } as GameIdea
    })
  } catch (error) {
    console.error('Error getting user ideas:', error)
    return []
  }
}

// Favorites Management
export const addToFavorites = async (userId: string, idea: GameIdea): Promise<void> => {
  try {
    console.log('🔧 Adding to favorites for user:', userId)
    console.log('🔧 Idea ID:', idea.id)
    const favoriteRef = doc(db, COLLECTIONS.FAVORITES, `${userId}_${idea.id}`)
    console.log('🔧 Favorite document path:', `favorites/${userId}_${idea.id}`)

    const favoriteData = {
      userId,
      ideaId: idea.id,
      idea,
      createdAt: serverTimestamp()
    }
    console.log('🔧 Favorite data structure:', favoriteData)

    await setDoc(favoriteRef, favoriteData)

    // Update user's ideas saved count
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        ideasSaved: (userSnap.data().ideasSaved || 0) + 1,
        updatedAt: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error adding to favorites:', error)
    throw error
  }
}

export const removeFromFavorites = async (userId: string, ideaId: number): Promise<void> => {
  try {
    const favoriteRef = doc(db, COLLECTIONS.FAVORITES, `${userId}_${ideaId}`)
    await deleteDoc(favoriteRef)

    // Update user's ideas saved count
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        ideasSaved: Math.max(0, (userSnap.data().ideasSaved || 1) - 1),
        updatedAt: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error removing from favorites:', error)
    throw error
  }
}

export const getFavorites = async (userId: string): Promise<GameIdea[]> => {
  try {
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      collection(db, COLLECTIONS.FAVORITES),
      where('userId', '==', userId)
    )

    const querySnapshot = await getDocs(q)
    const favorites = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data.idea,
        createdAt: data.createdAt?.toDate() || new Date()
      }
    }) as GameIdea[]

    // Sort in JavaScript instead of Firestore
    return favorites.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
  } catch (error) {
    console.error('Error getting favorites:', error)
    return []
  }
}

export const isFavorite = async (userId: string, ideaId: number): Promise<boolean> => {
  try {
    const favoriteRef = doc(db, COLLECTIONS.FAVORITES, `${userId}_${ideaId}`)
    const favoriteSnap = await getDoc(favoriteRef)
    return favoriteSnap.exists()
  } catch (error) {
    console.error('Error checking favorite status:', error)
    return false
  }
}

// Generation History Management
export const addToGenerationHistory = async (userId: string, idea: GameIdea, prompt: string): Promise<void> => {
  try {
    await addDoc(collection(db, COLLECTIONS.GENERATION_HISTORY), {
      userId,
      idea: { ...idea, prompt },
      prompt,
      createdAt: serverTimestamp()
    })

    // Note: User profile totalGenerations is updated separately by the main page component
    // This function only handles the generation history record
  } catch (error) {
    console.error('Error adding to generation history:', error)
    // Don't throw error to avoid blocking the generation flow
  }
}

export const getGenerationHistory = async (userId: string, limitCount = 50): Promise<GameIdea[]> => {
  try {
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      collection(db, COLLECTIONS.GENERATION_HISTORY),
      where('userId', '==', userId)
    )

    const querySnapshot = await getDocs(q)
    const history = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data.idea,
        createdAt: data.createdAt?.toDate() || new Date()
      }
    }) as GameIdea[]

    // Sort in JavaScript and apply limit
    return history
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limitCount)
  } catch (error) {
    console.error('Error getting generation history:', error)
    return []
  }
}

// Recently Viewed Management
export const addToRecentlyViewed = async (userId: string, idea: GameIdea): Promise<void> => {
  try {
    const recentRef = doc(db, COLLECTIONS.RECENTLY_VIEWED, `${userId}_${idea.id}`)
    await setDoc(recentRef, {
      userId,
      ideaId: idea.id,
      idea,
      viewedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error adding to recently viewed:', error)
    throw error
  }
}

export const getRecentlyViewed = async (userId: string, limitCount = 20): Promise<GameIdea[]> => {
  try {
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      collection(db, COLLECTIONS.RECENTLY_VIEWED),
      where('userId', '==', userId)
    )

    const querySnapshot = await getDocs(q)
    const recentlyViewed = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data.idea,
        createdAt: data.viewedAt?.toDate() || new Date()
      }
    }) as GameIdea[]

    // Sort in JavaScript and apply limit
    return recentlyViewed
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limitCount)
  } catch (error) {
    console.error('Error getting recently viewed:', error)
    return []
  }
}

// Generation Statistics
export interface GenerationStats {
  totalGenerations: number
  generationsThisWeek: number
  generationsThisMonth: number
  favoriteGenres: { [key: string]: number }
  favoriteCategories: { [key: string]: number }
}

export const getGenerationStats = async (userId: string): Promise<GenerationStats> => {
  try {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get all generation history for stats calculation (simplified query)
    const q = query(
      collection(db, COLLECTIONS.GENERATION_HISTORY),
      where('userId', '==', userId)
    )

    const querySnapshot = await getDocs(q)
    const history = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data.idea,
        createdAt: data.createdAt?.toDate() || new Date()
      }
    }) as GameIdea[]

    const stats: GenerationStats = {
      totalGenerations: history.length,
      generationsThisWeek: history.filter(item =>
        new Date(item.createdAt!) > weekAgo
      ).length,
      generationsThisMonth: history.filter(item =>
        new Date(item.createdAt!) > monthAgo
      ).length,
      favoriteGenres: {},
      favoriteCategories: {}
    }

    // Calculate favorite genres and categories
    history.forEach(idea => {
      stats.favoriteGenres[idea.genre] = (stats.favoriteGenres[idea.genre] || 0) + 1
      stats.favoriteCategories[idea.category] = (stats.favoriteCategories[idea.category] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('Error getting generation stats:', error)
    return {
      totalGenerations: 0,
      generationsThisWeek: 0,
      generationsThisMonth: 0,
      favoriteGenres: {},
      favoriteCategories: {}
    }
  }
}

// Real-time data subscriptions
export const subscribeToFavorites = (userId: string, callback: (favorites: GameIdea[]) => void): Unsubscribe => {
  try {
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      collection(db, COLLECTIONS.FAVORITES),
      where('userId', '==', userId)
    )

    return onSnapshot(q,
      (querySnapshot) => {
        const favorites = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            ...data.idea,
            createdAt: data.createdAt?.toDate() || new Date()
          }
        }) as GameIdea[]

        // Sort in JavaScript
        const sortedFavorites = favorites.sort((a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        )

        callback(sortedFavorites)
      },
      (error) => {
        console.error('Error in favorites subscription:', error)
        // Return empty array on error
        callback([])
      }
    )
  } catch (error) {
    console.error('Error setting up favorites subscription:', error)
    // Return a no-op unsubscribe function
    return () => {}
  }
}

export const subscribeToGenerationHistory = (userId: string, callback: (history: GameIdea[]) => void): Unsubscribe => {
  try {
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      collection(db, COLLECTIONS.GENERATION_HISTORY),
      where('userId', '==', userId)
    )

    return onSnapshot(q,
      (querySnapshot) => {
        const history = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            ...data.idea,
            createdAt: data.createdAt?.toDate() || new Date()
          }
        }) as GameIdea[]

        // Sort in JavaScript and limit to 50
        const sortedHistory = history
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 50)

        callback(sortedHistory)
      },
      (error) => {
        console.error('Error in generation history subscription:', error)
        // Return empty array on error
        callback([])
      }
    )
  } catch (error) {
    console.error('Error setting up generation history subscription:', error)
    // Return a no-op unsubscribe function
    return () => {}
  }
}

// Get public (unclaimed) ideas from all users with real-time updates
export const getPublicIdeas = async (limitCount = 20): Promise<GameIdea[]> => {
  try {
    console.log('🔍 Fetching public (unclaimed) ideas...')

    // Get all AI-generated ideas that are not claimed
    const q = query(
      collection(db, COLLECTIONS.GENERATION_HISTORY),
      where('idea.source', '==', 'AI Generated'),
      where('idea.claimed', '==', false)
    )

    const querySnapshot = await getDocs(q)
    const publicIdeas = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data.idea,
        createdAt: data.createdAt?.toDate() || new Date()
      }
    }) as GameIdea[]

    // Sort by creation date and limit
    const sortedIdeas = publicIdeas
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limitCount)

    console.log('🔍 Found', sortedIdeas.length, 'public ideas')
    return sortedIdeas
  } catch (error) {
    console.error('Error getting public ideas:', error)
    return []
  }
}

// Real-time subscription for public ideas
export const subscribeToPublicIdeas = (callback: (ideas: GameIdea[]) => void, limitCount = 20): Unsubscribe => {
  try {
    console.log('🔍 Setting up real-time subscription for public ideas...')

    // Listen to all AI-generated ideas that are not claimed
    const q = query(
      collection(db, COLLECTIONS.GENERATION_HISTORY),
      where('idea.source', '==', 'AI Generated'),
      where('idea.claimed', '==', false)
    )

    return onSnapshot(q,
      (querySnapshot) => {
        const publicIdeas = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            ...data.idea,
            createdAt: data.createdAt?.toDate() || new Date()
          }
        }) as GameIdea[]

        // Sort by creation date and limit
        const sortedIdeas = publicIdeas
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, limitCount)

        console.log('🔄 Real-time update: Found', sortedIdeas.length, 'public ideas')
        callback(sortedIdeas)
      },
      (error) => {
        console.error('Error in public ideas subscription:', error)
        // Return empty array on error
        callback([])
      }
    )
  } catch (error) {
    console.error('Error setting up public ideas subscription:', error)
    // Return a no-op unsubscribe function
    return () => {}
  }
}

// Debug function to test basic Firestore operations
export const debugFirestoreConnection = async (userId: string): Promise<{ success: boolean; error?: any; details?: any }> => {
  console.log('🔧 DEBUG: Testing basic Firestore connection...')
  console.log('🔧 DEBUG: User ID:', userId)
  console.log('🔧 DEBUG: Database instance:', !!db)
  console.log('🔧 DEBUG: Database app:', db.app.name)

  try {
    // Test 1: Try to write a simple test document
    console.log('🔧 DEBUG: Test 1 - Writing simple test document...')
    const testRef = doc(db, 'debug_test', `test_${userId}_${Date.now()}`)
    const testData = {
      message: 'Hello Firestore',
      timestamp: serverTimestamp(),
      userId: userId,
      test: true
    }

    console.log('🔧 DEBUG: Test document reference:', testRef.path)
    console.log('🔧 DEBUG: Test data:', testData)

    await setDoc(testRef, testData)
    console.log('✅ DEBUG: Test write successful!')

    // Test 2: Try to read the document back
    console.log('🔧 DEBUG: Test 2 - Reading document back...')
    const docSnap = await getDoc(testRef)
    if (docSnap.exists()) {
      console.log('✅ DEBUG: Test read successful!', docSnap.data())

      // Test 3: Clean up test document
      console.log('🔧 DEBUG: Test 3 - Cleaning up...')
      await deleteDoc(testRef)
      console.log('✅ DEBUG: Test cleanup successful!')

      return { success: true, details: { write: true, read: true, delete: true } }
    } else {
      console.warn('⚠️ DEBUG: Document write succeeded but read failed')
      return { success: false, error: 'Document not found after write', details: { write: true, read: false } }
    }

  } catch (error: any) {
    console.error('❌ DEBUG: Firestore test failed:', error)
    console.error('❌ DEBUG: Error code:', error?.code)
    console.error('❌ DEBUG: Error message:', error?.message)
    console.error('❌ DEBUG: Full error object:', error)

    // Try to extract more details from the error
    const errorDetails = {
      code: error?.code,
      message: error?.message,
      name: error?.name,
      stack: error?.stack?.split('\n').slice(0, 5), // First 5 lines of stack
      customData: error?.customData,
      httpStatus: error?.status,
      details: error?.details
    }

    return { success: false, error: error.message, details: errorDetails }
  }
}

// Function to check Firebase configuration
export const debugFirebaseConfig = (): { success: boolean; config?: any; issues?: string[] } => {
  console.log('🔧 DEBUG: Checking Firebase configuration...')

  const issues: string[] = []
  const config = {
    hasDb: !!db,
    appName: db?.app?.name,
    projectId: db?.app?.options?.projectId,
    authDomain: db?.app?.options?.authDomain,
    apiKey: db?.app?.options?.apiKey ? 'Present' : 'Missing'
  }

  console.log('🔧 DEBUG: Firebase config:', config)

  if (!db) issues.push('Database instance not initialized')
  if (!db?.app?.options?.projectId) issues.push('Project ID missing')
  if (!db?.app?.options?.authDomain) issues.push('Auth domain missing')
  if (!db?.app?.options?.apiKey) issues.push('API key missing')

  if (issues.length > 0) {
    console.warn('⚠️ DEBUG: Firebase config issues:', issues)
    return { success: false, config, issues }
  }

  console.log('✅ DEBUG: Firebase config looks good')
  return { success: true, config }
}
