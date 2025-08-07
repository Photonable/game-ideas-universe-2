export interface GameIdea {
  id: number
  title: string
  description: string
  category: string
  genre: string
  source: string
  viability: number
  originality: number
  marketAppeal: number
  claimed: boolean
  claimedBy?: string
  claimedAt?: Date
  createdAt?: Date
  prompt?: string
}

export interface UserProfile {
  name: string
  email: string
  joinDate: Date
  totalGenerations: number
  ideasSaved: number
  favoriteCategories: string[]
  generationHistory: GameIdea[]
  // Subscription and generation tracking
  subscriptionType: 'free' | 'spark' | 'creator' | 'universe' | 'one-shot'
  subscriptionStatus: 'active' | 'inactive' | 'expired'
  hasUsedFreeGeneration: boolean
  generationsRemaining: number
  subscriptionStartDate?: Date
  subscriptionEndDate?: Date
  lastGenerationDate?: Date
}

export interface GenerationStats {
  totalGenerations: number
  generationsThisWeek: number
  generationsThisMonth: number
  favoriteGenres: { [key: string]: number }
  favoriteCategories: { [key: string]: number }
}

// Local Storage Keys
const KEYS = {
  FAVORITES: 'game-idea-universe-favorites',
  GENERATION_HISTORY: 'game-idea-universe-history',
  RECENTLY_VIEWED: 'game-idea-universe-recent',
  USER_PROFILE: 'game-idea-universe-profile',
  GENERATION_STATS: 'game-idea-universe-stats',
  DARK_MODE: 'game-idea-universe-dark-mode'
}

// Utility functions
const isClient = typeof window !== 'undefined'

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (!isClient) return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

const setToStorage = <T>(key: string, value: T): void => {
  if (!isClient) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

// Subscription and generation management
export const getGenerationsRemaining = (profile: UserProfile): number => {
  // Check if subscription is active
  if (profile.subscriptionStatus === 'active') {
    switch (profile.subscriptionType) {
      case 'universe':
        return 999999 // Unlimited
      case 'creator':
      case 'spark':
      case 'one-shot':
        // For all active subscriptions, use the actual generationsRemaining from profile
        return profile.generationsRemaining || 0
      default:
        break
    }
  }

  // Free user - only 1 generation lifetime
  return profile.hasUsedFreeGeneration ? 0 : 1
}

export const canGenerate = (profile: UserProfile): boolean => {
  return getGenerationsRemaining(profile) > 0
}

export const consumeGeneration = (profile: UserProfile): UserProfile => {
  const updatedProfile = { ...profile }

  // Mark free generation as used for free users
  if (profile.subscriptionType === 'free') {
    updatedProfile.hasUsedFreeGeneration = true
  }

  // Decrement one-shot generations
  if (profile.subscriptionType === 'one-shot') {
    updatedProfile.generationsRemaining = Math.max(0, profile.generationsRemaining - 1)
  }

  // Update total generations and last generation date
  updatedProfile.totalGenerations += 1
  updatedProfile.lastGenerationDate = new Date()

  return updatedProfile
}

// Favorites management
export const getFavorites = (): GameIdea[] => {
  return getFromStorage(KEYS.FAVORITES, [])
}

export const addToFavorites = (idea: GameIdea): void => {
  const favorites = getFavorites()
  if (!favorites.find(fav => fav.id === idea.id)) {
    favorites.push({ ...idea, createdAt: new Date() })
    setToStorage(KEYS.FAVORITES, favorites)
  }
}

export const removeFromFavorites = (ideaId: number): void => {
  const favorites = getFavorites()
  const updated = favorites.filter(fav => fav.id !== ideaId)
  setToStorage(KEYS.FAVORITES, updated)
}

export const isFavorite = (ideaId: number): boolean => {
  const favorites = getFavorites()
  return favorites.some(fav => fav.id === ideaId)
}

// Generation history management
export const getGenerationHistory = (): GameIdea[] => {
  return getFromStorage(KEYS.GENERATION_HISTORY, [])
}

export const addToGenerationHistory = (idea: GameIdea, prompt: string): void => {
  const history = getGenerationHistory()
  const newIdea = { ...idea, createdAt: new Date(), prompt }
  history.unshift(newIdea) // Add to beginning

  // Keep only last 50 generations
  if (history.length > 50) {
    history.splice(50)
  }

  setToStorage(KEYS.GENERATION_HISTORY, history)
  updateGenerationStats()

  // Update user profile with generation usage
  const profile = getUserProfile()
  if (profile) {
    const updatedProfile = consumeGeneration(profile)
    setToStorage(KEYS.USER_PROFILE, updatedProfile)
  }
}

// Recently viewed management
export const getRecentlyViewed = (): GameIdea[] => {
  return getFromStorage(KEYS.RECENTLY_VIEWED, [])
}

export const addToRecentlyViewed = (idea: GameIdea): void => {
  const recent = getRecentlyViewed()
  const filtered = recent.filter(item => item.id !== idea.id)
  filtered.unshift({ ...idea, createdAt: new Date() })

  // Keep only last 20 items
  if (filtered.length > 20) {
    filtered.splice(20)
  }

  setToStorage(KEYS.RECENTLY_VIEWED, filtered)
}

// User profile management
export const getUserProfile = (): UserProfile | null => {
  return getFromStorage(KEYS.USER_PROFILE, null)
}

export const createUserProfile = (name: string, email: string): UserProfile => {
  const profile: UserProfile = {
    name,
    email,
    joinDate: new Date(),
    totalGenerations: 0,
    ideasSaved: 0,
    favoriteCategories: [],
    generationHistory: [],
    // Initialize subscription fields for free users
    subscriptionType: 'free',
    subscriptionStatus: 'inactive',
    hasUsedFreeGeneration: false,
    generationsRemaining: 1
  }
  setToStorage(KEYS.USER_PROFILE, profile)
  return profile
}

export const updateUserProfile = (updates: Partial<UserProfile>): void => {
  const profile = getUserProfile()
  if (profile) {
    const updated = { ...profile, ...updates }
    setToStorage(KEYS.USER_PROFILE, updated)
  }
}

// Subscription management
export const updateSubscription = (
  subscriptionType: UserProfile['subscriptionType'],
  generationsIncluded?: number
): void => {
  const profile = getUserProfile()
  if (profile) {
    const now = new Date()
    const updated: UserProfile = {
      ...profile,
      subscriptionType,
      subscriptionStatus: 'active',
      subscriptionStartDate: now,
      subscriptionEndDate: subscriptionType === 'one-shot' ? undefined : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days for monthly plans
      generationsRemaining: subscriptionType === 'one-shot' ? (generationsIncluded || 1) : profile.generationsRemaining
    }
    setToStorage(KEYS.USER_PROFILE, updated)
  }
}

// Generation statistics
export const getGenerationStats = (): GenerationStats => {
  return getFromStorage(KEYS.GENERATION_STATS, {
    totalGenerations: 0,
    generationsThisWeek: 0,
    generationsThisMonth: 0,
    favoriteGenres: {},
    favoriteCategories: {}
  })
}

export const updateGenerationStats = (): void => {
  const history = getGenerationHistory()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

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

  setToStorage(KEYS.GENERATION_STATS, stats)
}

// Dark mode
export const getDarkMode = (): boolean => {
  return getFromStorage(KEYS.DARK_MODE, false)
}

export const setDarkMode = (enabled: boolean): void => {
  setToStorage(KEYS.DARK_MODE, enabled)
}

// Clear all data (for testing/reset)
export const clearAllData = (): void => {
  if (!isClient) return
  Object.values(KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}
