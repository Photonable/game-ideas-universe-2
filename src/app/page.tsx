"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Sparkles,
  Filter,
  Search,
  User,
  Settings,
  Moon,
  Sun,
  Heart,
  Bookmark,
  Zap,
  Share2,
  History,
  Layout,
  BookmarkCheck,
  HeartHandshake,
  TrendingUp,
  Clock,
  Eye,
  CheckCircle
} from "lucide-react"
import { useState, useEffect } from "react"
import UserProfile from "@/components/UserProfile"
import PromptTemplates from "@/components/PromptTemplates"
import SocialShare from "@/components/SocialShare"
import HistorySection from "@/components/HistorySection"
import IdeaDetails from "@/components/IdeaDetails"
import FavoritesView from "@/components/FavoritesView"
import UserGeneratedView from "@/components/UserGeneratedView"
import RecentlyViewedView from "@/components/RecentlyViewedView"
// Removed GeminiApiSetup - now using server-side AI
import AuthModal from "@/components/AuthModal"
import SubscriptionModal from "@/components/SubscriptionModal"

import { useAuth } from "@/contexts/AuthContext"
import { getStripe } from "@/lib/stripe"
import {
  GameIdea,
  getDarkMode,
  setDarkMode,
  getGenerationsRemaining,
  canGenerate,
  consumeGeneration,
  updateSubscription
} from "@/lib/localStorage"
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  addToGenerationHistory,
  addToRecentlyViewed,
  getGenerationHistory,
  getRecentlyViewed,
  subscribeToFavorites,
  subscribeToGenerationHistory,
  getPublicIdeas,
  subscribeToPublicIdeas,
  claimIdea,
  unclaimIdea
} from "@/lib/firebaseData"
import { PromptTemplate } from "@/lib/promptTemplates"
// Removed client-side Gemini import - now using server-side API

const gameIdeas: GameIdea[] = [
  {
    id: 1,
    title: "The Witcher 3: Wild Hunt",
    description: "A story-driven, open-world RPG where you play as a monster hunter for hire.",
    category: "Video Game",
    genre: "Action RPG",
    source: "Existing Game",
    viability: 9,
    originality: 7,
    marketAppeal: 9,
    claimed: false
  },
  {
    id: 2,
    title: "Stardew Valley",
    description: "A farming simulation game where you inherit a rundown farm and build a new life.",
    category: "Video Game",
    genre: "Simulation",
    source: "Existing Game",
    viability: 9,
    originality: 8,
    marketAppeal: 9,
    claimed: false
  },
  {
    id: 3,
    title: "Gloomhaven",
    description: "A cooperative board game of tactical combat in a persistent world of shifting motives.",
    category: "Board Game",
    genre: "Legacy",
    source: "Existing Game",
    viability: 8,
    originality: 9,
    marketAppeal: 7,
    claimed: false
  },
  {
    id: 4,
    title: "Asymmetric Multiplayer Adventure",
    description: "Players have unique roles and abilities, requiring teamwork and strategy to succeed.",
    category: "Video Game",
    genre: "Action",
    source: "Curated",
    viability: 7,
    originality: 8,
    marketAppeal: 8,
    claimed: false
  },
  {
    id: 5,
    title: "Environmental Puzzle Platformer",
    description: "Solve puzzles using dynamic environmental elements and weather systems.",
    category: "Video Game",
    genre: "Puzzle",
    source: "Curated",
    viability: 8,
    originality: 8,
    marketAppeal: 7,
    claimed: false
  },
  {
    id: 6,
    title: "Chrono-Merchants",
    description: "A competitive board game where players travel through time to buy and sell goods, manipulating historical events to create demand and corner the market.",
    category: "Board Game",
    genre: "Economic Strategy",
    source: "Curated",
    viability: 7,
    originality: 9,
    marketAppeal: 6,
    claimed: false
  }
]

export default function HomePage() {
  const { currentUser, userProfile, logout, clearAuthState, refreshUserProfile } = useAuth()



  const [generationsRemaining, setGenerationsRemaining] = useState(0)
  const [ideaPrompt, setIdeaPrompt] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [genreFilter, setGenreFilter] = useState("All")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [darkMode, setDarkModeState] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavoritesState] = useState<GameIdea[]>([])
  const [recentlyViewed, setRecentlyViewedState] = useState<GameIdea[]>([])
  const [generatedIdeas, setGeneratedIdeas] = useState<GameIdea[]>([])
  const [publicIdeas, setPublicIdeas] = useState<GameIdea[]>([])
  const [favoriteStatuses, setFavoriteStatuses] = useState<{ [key: number]: boolean }>({})

  // Modal states
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showPromptTemplates, setShowPromptTemplates] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showUserGenerated, setShowUserGenerated] = useState(false)
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [shareIdea, setShareIdea] = useState<GameIdea | null>(null)
  const [selectedIdea, setSelectedIdea] = useState<GameIdea | null>(null)

  // AI states
  const [isGenerating, setIsGenerating] = useState(false)



  // Initialize data from localStorage and Firebase
  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      setDarkModeState(getDarkMode())

      // Handle payment success/cancel from Stripe
      const urlParams = new URLSearchParams(window.location.search)
      const paymentStatus = urlParams.get('payment')
      const sessionId = urlParams.get('session_id')

      if (paymentStatus === 'success' && sessionId) {
        console.log('Payment successful! Session ID:', sessionId)

        // Clear URL parameters immediately
        window.history.replaceState({}, document.title, window.location.pathname)

        // Show success message
        alert('✅ Payment successful! Your account is being updated...')

        // Refresh user profile data after a short delay to allow webhook processing
        setTimeout(async () => {
          if (currentUser && refreshUserProfile) {
            try {
              await refreshUserProfile()
              console.log('✅ User profile refreshed after payment')
            } catch (error) {
              console.error('Error refreshing user profile:', error)
              // Fallback to page reload if profile refresh fails
              window.location.reload()
            }
          }
        }, 3000) // 3 second delay to allow webhook processing
      } else if (paymentStatus === 'cancelled') {
        console.log('Payment cancelled by user')
        alert('❌ Payment was cancelled. You can try again anytime.')

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    // Set up real-time subscription for public ideas (for all users)
    const unsubscribePublicIdeas = subscribeToPublicIdeas((ideas) => {
      console.log('🔄 Real-time public ideas update:', ideas.length, 'ideas')
      setPublicIdeas(ideas)
    }, 15)

    // Initial load of public ideas as fallback
    const loadPublicIdeas = async () => {
      try {
        const ideas = await getPublicIdeas(15)
        setPublicIdeas(ideas)
        console.log('✅ Initial load:', ideas.length, 'public ideas')
      } catch (error) {
        console.error('Error loading public ideas:', error)
      }
    }

    loadPublicIdeas()

    // Cleanup subscription on unmount
    return () => {
      unsubscribePublicIdeas()
    }
  }, [currentUser, refreshUserProfile])

  // Load user data when authenticated
  useEffect(() => {
    if (currentUser) {
      console.log('Loading user data for:', currentUser.uid)

      // Calculate generations remaining based on user profile
      if (userProfile) {
        const remaining = getGenerationsRemaining(userProfile)
        setGenerationsRemaining(remaining)
        console.log('Generations remaining for user:', remaining, 'Subscription:', userProfile.subscriptionType)
      }

      // Load favorites with timeout and error handling
      const loadUserData = async () => {
        try {
          // Load favorites with timeout
          const favoritesPromise = getFavorites(currentUser.uid)
          const favoritesTimeout = new Promise(resolve => setTimeout(() => resolve([]), 5000))
          const favorites = await Promise.race([favoritesPromise, favoritesTimeout]) as any[]
          setFavoritesState(favorites)

          // Load recently viewed with timeout
          const recentPromise = getRecentlyViewed(currentUser.uid)
          const recentTimeout = new Promise(resolve => setTimeout(() => resolve([]), 5000))
          const recent = await Promise.race([recentPromise, recentTimeout]) as any[]
          setRecentlyViewedState(recent)

          // Load generation history with timeout
          const historyPromise = getGenerationHistory(currentUser.uid)
          const historyTimeout = new Promise(resolve => setTimeout(() => resolve([]), 5000))
          const history = await Promise.race([historyPromise, historyTimeout]) as any[]
          setGeneratedIdeas(history)

          console.log('User data loaded successfully')
        } catch (error) {
          console.error('Error loading user data:', error)
          // Continue with empty arrays if loading fails
          setFavoritesState([])
          setRecentlyViewedState([])
          setGeneratedIdeas([])
        }
      }

      loadUserData()

      // Set up real-time subscriptions with error handling
      let unsubscribeFavorites = () => {}
      let unsubscribeHistory = () => {}

      try {
        unsubscribeFavorites = subscribeToFavorites(currentUser.uid, (newFavorites) => {
          console.log('Real-time favorites update:', newFavorites.length)
          setFavoritesState(newFavorites)
        })
        unsubscribeHistory = subscribeToGenerationHistory(currentUser.uid, (newHistory) => {
          console.log('Real-time history update:', newHistory.length)
          setGeneratedIdeas(newHistory)
        })
      } catch (error) {
        console.error('Error setting up real-time subscriptions:', error)
      }

      return () => {
        try {
          unsubscribeFavorites()
          unsubscribeHistory()
        } catch (error) {
          console.error('Error cleaning up subscriptions:', error)
        }
      }
    } else {
      // Clear user data when not authenticated
      setFavoritesState([])
      setRecentlyViewedState([])
      setGeneratedIdeas([])
      setFavoriteStatuses({})
      setGenerationsRemaining(0)
    }
  }, [currentUser, userProfile])

  // Recalculate generations remaining when user profile changes
  useEffect(() => {
    if (userProfile) {
      const remaining = getGenerationsRemaining(userProfile)
      setGenerationsRemaining(remaining)
      console.log('Updated generations remaining:', remaining, 'for subscription:', userProfile.subscriptionType, 'total:', userProfile.totalGenerations)
    } else {
      setGenerationsRemaining(0)
    }
  }, [userProfile])

  // Load favorite statuses when user or ideas change
  useEffect(() => {
    if (currentUser) {
      const loadFavoriteStatuses = async () => {
        const statuses: { [key: number]: boolean } = {}
        for (const idea of [...gameIdeas, ...generatedIdeas, ...publicIdeas]) {
          statuses[idea.id] = await isFavorite(currentUser.uid, idea.id)
        }
        setFavoriteStatuses(statuses)
      }
      loadFavoriteStatuses()
    }
  }, [currentUser, generatedIdeas, publicIdeas])

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Show different ideas based on user state
  const allIdeas = currentUser
    ? [...gameIdeas, ...generatedIdeas, ...publicIdeas]
    : [...gameIdeas.filter(idea => idea.source === 'Existing Game'), ...publicIdeas]

  const filteredIdeas = allIdeas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "All" || idea.category === categoryFilter
    const matchesGenre = genreFilter === "All" || idea.genre === genreFilter
    const matchesSource = sourceFilter === "All" || idea.source === sourceFilter

    return matchesSearch && matchesCategory && matchesGenre && matchesSource
  })

  const handleGenerateIdea = async (customPrompt?: string) => {
    // Check if user can generate (subscription-based logic)
    if (!userProfile || !canGenerate(userProfile) || isGenerating) {
      if (!userProfile) {
        console.log('No user profile available for generation')
        setShowAuthModal(true)
        return
      }
      console.log('Generation not allowed - remaining:', getGenerationsRemaining(userProfile))
      return
    }

    setIsGenerating(true)

    const prompt = customPrompt || ideaPrompt || "A unique and innovative game concept"

    try {
      // Call server-side API for idea generation with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to generate idea')
      }

      const data = await response.json()
      const newIdea: GameIdea = data.idea

      // Update user profile with generation usage using subscription logic
      const updatedProfile = consumeGeneration(userProfile)

      // Update in Firebase first (critical)
      if (currentUser) {
        try {
          const { updateUserProfile: updateProfileInDB } = await import('@/lib/firebaseData')
          await updateProfileInDB(currentUser.uid, updatedProfile)
          console.log('✅ Profile updated in Firebase:', updatedProfile.totalGenerations, 'total generations')
        } catch (error) {
          console.error('❌ Failed to update profile in Firestore:', error)
          // Don't proceed if Firebase update fails - this prevents inconsistent state
          throw new Error('Failed to update user profile. Please try again.')
        }
      }

      // Update local generations remaining only after Firebase success
      const newRemaining = getGenerationsRemaining(updatedProfile)
      setGenerationsRemaining(newRemaining)
      console.log('✅ Generation used. Remaining:', newRemaining, 'Total generations:', updatedProfile.totalGenerations)

      // Update local state first
      setGeneratedIdeas(prev => [newIdea, ...prev])
      setIdeaPrompt("")

      // Add to generation history in Firebase (non-blocking background operation)
      if (currentUser) {
        setTimeout(async () => {
          try {
            await Promise.race([
              addToGenerationHistory(currentUser.uid, newIdea, prompt),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ])
            console.log('✅ Generation history saved to Firebase')
          } catch (error) {
            console.warn('⚠️ Failed to save generation history:', error)
            // Continue without blocking the UI
          }
        }, 100)
      }

      // Show message if using mock data
      if (data.mock) {
        console.log('Using mock AI generation:', data.message)
      }

    } catch (error: any) {
      console.error('Error generating idea:', error)

      // Show user-friendly error message
      if (error.name === 'AbortError') {
        console.warn('Request timed out - idea generation took too long')
      }

      // Don't restore generation count on error since we use subscription logic
      console.log('Generation failed, count not restored due to subscription logic')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToggleFavorite = async (idea: GameIdea) => {
    if (!currentUser) {
      setShowAuthModal(true)
      return
    }

    try {
      const isCurrentlyFavorite = favoriteStatuses[idea.id]

      if (isCurrentlyFavorite) {
        await removeFromFavorites(currentUser.uid, idea.id)
        setFavoriteStatuses(prev => ({ ...prev, [idea.id]: false }))
      } else {
        await addToFavorites(currentUser.uid, idea)
        setFavoriteStatuses(prev => ({ ...prev, [idea.id]: true }))

        // If this is an AI-generated idea, mark it as claimed when favorited
        if (idea.source === 'AI Generated') {
          const updatedIdea = { ...idea, claimed: true }
          setGeneratedIdeas(prev => prev.map(i => i.id === idea.id ? updatedIdea : i))
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleToggleClaim = async (idea: GameIdea) => {
    if (!currentUser) {
      setShowAuthModal(true)
      return
    }

    try {
      if (idea.source === 'AI Generated') {
        const isCurrentlyClaimed = idea.claimed && idea.claimedBy === currentUser.uid

        console.log('🔧 Toggling claim for idea:', idea.id, 'Currently claimed:', isCurrentlyClaimed)

        if (isCurrentlyClaimed) {
          // Unclaim the idea
          await unclaimIdea(currentUser.uid, idea.id)

          // Update local state immediately for better UX
          setGeneratedIdeas(prev => prev.map(i =>
            i.id === idea.id ? { ...i, claimed: false, claimedBy: undefined } : i
          ))
          setPublicIdeas(prev => {
            // Add back to public pool if it was unclaimed
            const updatedIdea = { ...idea, claimed: false, claimedBy: undefined }
            return [updatedIdea, ...prev]
          })

          // Update favorite status
          setFavoriteStatuses(prev => ({ ...prev, [idea.id]: false }))

          console.log('✅ Idea unclaimed successfully')
        } else {
          // Claim the idea
          await claimIdea(currentUser.uid, idea)

          // Create the updated idea object with claim information
          const claimedIdea = { ...idea, claimed: true, claimedBy: currentUser.uid }

          // Update local state immediately for better UX
          setGeneratedIdeas(prev => {
            // Check if idea already exists in generated ideas
            const existingIndex = prev.findIndex(i => i.id === idea.id)
            if (existingIndex >= 0) {
              // Update existing idea
              return prev.map(i => i.id === idea.id ? claimedIdea : i)
            } else {
              // Add new claimed idea to generated ideas
              return [claimedIdea, ...prev]
            }
          })

          // Remove from public pool
          setPublicIdeas(prev => prev.filter(i => i.id !== idea.id))

          // Update favorite status (automatically favorited when claimed)
          setFavoriteStatuses(prev => ({ ...prev, [idea.id]: true }))

          console.log('✅ Idea claimed successfully', 'Claimed by:', currentUser.uid)
        }
      }
    } catch (error) {
      console.error('❌ Error toggling claim:', error)
      alert('Failed to update idea claim status. Please try again.')
    }
  }

  const handleViewIdea = async (idea: GameIdea) => {
    if (currentUser) {
      try {
        await addToRecentlyViewed(currentUser.uid, idea)
        // Update local state to reflect the new recently viewed item
        setRecentlyViewedState(prev => {
          const filtered = prev.filter(item => item.id !== idea.id)
          return [{ ...idea, createdAt: new Date() }, ...filtered].slice(0, 20)
        })
      } catch (error) {
        console.error('Error adding to recently viewed:', error)
      }
    }
    setSelectedIdea(idea)
  }

  const handleToggleDarkMode = () => {
    const newMode = !darkMode
    setDarkModeState(newMode)
    setDarkMode(newMode)
  }

  const handleSelectTemplate = (template: PromptTemplate) => {
    setIdeaPrompt(template.prompt)
    // Optionally auto-generate
    // handleGenerateIdea(template.prompt)
  }



  const handlePurchasePlan = async (planType: 'one-shot' | 'spark' | 'creator' | 'universe', skipConfirmation = false) => {
    if (!userProfile || !currentUser?.email) {
      setShowAuthModal(true)
      return
    }

    // Show confirmation for subscription changes (not for first-time or one-shot)
    if (!skipConfirmation && userProfile.subscriptionType !== 'free' && planType !== 'one-shot') {
      const confirmed = confirm(`Are you sure you want to switch to the ${planType} plan? Your current generations will be preserved.`)
      if (!confirmed) return
    }

    try {
      console.log('🔧 Creating Stripe checkout session for:', planType)
      console.log('🔧 User:', currentUser.uid, currentUser.email)

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          userId: currentUser.uid,
          userEmail: currentUser.email,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Checkout session error:', response.status, errorText)
        throw new Error(`Failed to create checkout session: ${errorText}`)
      }

      const data = await response.json()
      console.log('🔧 Checkout session created:', data)

      if (data.sessionId) {
        try {
          // Try to use Stripe.js for better UX
          console.log('🔧 Attempting to load Stripe.js...')
          const stripe = await getStripe()
          if (stripe) {
            console.log('🔧 Stripe.js loaded successfully, redirecting to checkout...')
            const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })

            if (error) {
              console.error('🔧 Stripe.js redirect error:', error)
              throw error
            }
          } else {
            throw new Error('Stripe.js returned null')
          }
        } catch (stripeError) {
          console.warn('🔧 Stripe.js unavailable, using direct redirect:', stripeError)

          // Fallback: Direct redirect to Stripe Checkout
          // This works even when Stripe.js is blocked or environment vars are missing
          const directUrl = `https://checkout.stripe.com/c/pay/${data.sessionId}`
          console.log('🔧 Redirecting directly to:', directUrl)
          window.location.href = directUrl
        }
      } else if (data.url) {
        // Direct URL redirect (fallback approach)
        console.log('🔧 Using direct URL redirect:', data.url)
        window.location.href = data.url
      } else {
        throw new Error('No session ID or URL returned from server')
      }

      // User will be redirected to Stripe and then back to our success/cancel page
      // Payment processing will be handled by the webhook

    } catch (error) {
      console.error('❌ Payment error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`❌ Failed to start payment process: ${message}`)
    }
  }

  const handleOneShot = () => {
    handlePurchasePlan('one-shot', true) // Skip confirmation for one-shot
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-2">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Game Ideas Universe
              </h1>
              <p className="text-sm text-muted-foreground">Discover, filter, and generate unique game ideas</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistory(true)}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View History</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {currentUser && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowFavorites(true)}
                        className="relative"
                      >
                        <Heart className="h-4 w-4" />
                        {favorites.length > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {favorites.length > 9 ? '9+' : favorites.length}
                          </div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Saved Ideas ({favorites.length})</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowUserGenerated(true)}
                        className="relative"
                      >
                        <Sparkles className="h-4 w-4" />
                        {generatedIdeas.length > 0 && (
                          <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {generatedIdeas.length > 9 ? '9+' : generatedIdeas.length}
                          </div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Generated Ideas ({generatedIdeas.length})</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowRecentlyViewed(true)}
                        className="relative"
                      >
                        <Eye className="h-4 w-4" />
                        {recentlyViewed.length > 0 && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {recentlyViewed.length > 9 ? '9+' : recentlyViewed.length}
                          </div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Recently Viewed ({recentlyViewed.length})</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}



            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleDarkMode}
                  >
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle {darkMode ? 'Light' : 'Dark'} Mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {currentUser ? (
              <>
                {/* Show Buy One button but disable for universe users */}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleOneShot}
                  disabled={userProfile?.subscriptionType === 'universe'}
                >
                  Buy One ($1)
                </Button>
                {/* Always show Subscribe button */}
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  Subscribe
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Profile"
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{userProfile?.name || currentUser.displayName}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => setShowUserProfile(true)}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <User className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setShowAuthModal(true)}
                >
                  Login
                </Button>
                <Button
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setShowAuthModal(true)}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">


        {/* Quick Stats */}
        {(favorites.length > 0 || recentlyViewed.length > 0 || generatedIdeas.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-500 rounded-full p-2">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{generatedIdeas.length}</div>
                    <div className="text-sm text-muted-foreground">Ideas Generated</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-pink-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-500 rounded-full p-2">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{favorites.length}</div>
                    <div className="text-sm text-muted-foreground">Favorites Saved</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-cyan-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 rounded-full p-2">
                    <Eye className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{recentlyViewed.length}</div>
                    <div className="text-sm text-muted-foreground">Recently Viewed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Idea Generator */}
        <Card className="border-2 border-purple-100 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500 rounded-full p-2">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">AI Idea Generator</CardTitle>
                  <CardDescription>Have a specific theme in mind? Let our AI create a game idea for you.</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Zap className="h-3 w-3 mr-1" />
                  {generationsRemaining === 999999 ? 'Unlimited' : `${generationsRemaining} Remaining`}
                  <span className="ml-1 text-xs">
                    ({currentUser
                      ? (userProfile?.subscriptionType || 'free')
                      : 'login required'
                    })
                  </span>
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 mb-4">
              <Input
                placeholder="e.g., 'A cooking game in space'"
                value={ideaPrompt}
                onChange={(e) => setIdeaPrompt(e.target.value)}
                className="flex-1"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && generationsRemaining > 0) {
                    handleGenerateIdea()
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => setShowPromptTemplates(true)}
              >
                <Layout className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button
                onClick={() => handleGenerateIdea()}
                disabled={generationsRemaining === 0 || isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Generate Idea'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Shortcut: Alt + G • {userProfile ? `Welcome back, ${userProfile.name}!` : 'Create a profile to track your progress'}</p>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Browse & Filter Ideas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Video Game">Video Game</SelectItem>
                  <SelectItem value="Board Game">Board Game</SelectItem>
                  <SelectItem value="Card Game">Card Game</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Genres</SelectItem>
                  <SelectItem value="Action RPG">Action RPG</SelectItem>
                  <SelectItem value="Simulation">Simulation</SelectItem>
                  <SelectItem value="Legacy">Legacy</SelectItem>
                  <SelectItem value="Action">Action</SelectItem>
                  <SelectItem value="Puzzle">Puzzle</SelectItem>
                  <SelectItem value="Economic Strategy">Economic Strategy</SelectItem>
                  <SelectItem value="Strategy">Strategy</SelectItem>
                  <SelectItem value="Adventure">Adventure</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sources</SelectItem>
                  <SelectItem value="Existing Game">Existing Game</SelectItem>
                  <SelectItem value="Curated">Curated</SelectItem>
                  <SelectItem value="AI Generated">AI Generated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Game Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => {
            const isIdeaFavorite = favoriteStatuses[idea.id] || false
            return (
              <Card key={idea.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle
                      className="text-lg line-clamp-2 group-hover:text-purple-600 transition-colors cursor-pointer"
                      onClick={() => handleViewIdea(idea)}
                    >
                      {idea.title}
                    </CardTitle>
                    <div className="flex space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setShareIdea(idea)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Share Idea</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleToggleFavorite(idea)}
                            >
                              {isIdeaFavorite ? (
                                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                              ) : (
                                <Heart className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isIdeaFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {idea.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {idea.genre}
                    </Badge>
                    {idea.source === "AI Generated" && (
                      <Badge className="text-xs bg-purple-100 text-purple-700">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {idea.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Viability</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${idea.viability * 10}%` }}
                          />
                        </div>
                        <span className="text-green-600 font-medium">{idea.viability}/10</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Originality</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${idea.originality * 10}%` }}
                          />
                        </div>
                        <span className="text-blue-600 font-medium">{idea.originality}/10</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex space-x-2 w-full">
                    {idea.source === 'AI Generated' && currentUser ? (
                      // AI Generated ideas show Claim/Unclaim button
                      (() => {
                        const isClaimedByCurrentUser = Boolean(idea.claimed && idea.claimedBy === currentUser.uid)
                        const isClaimedByOther = Boolean(idea.claimed && idea.claimedBy && idea.claimedBy !== currentUser.uid)

                        // Debug logging to help identify the issue
                        console.log(`🔧 Button state for idea ${idea.id} "${idea.title}":`, {
                          claimed: idea.claimed,
                          claimedBy: idea.claimedBy,
                          currentUserId: currentUser.uid,
                          isClaimedByCurrentUser,
                          isClaimedByOther,
                          buttonText: isClaimedByCurrentUser ? 'Unclaim' : isClaimedByOther ? 'Claimed' : 'Claim'
                        })

                        return (
                          <Button
                            variant={isClaimedByCurrentUser ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => handleToggleClaim(idea)}
                            disabled={isClaimedByOther}
                          >
                            {isClaimedByCurrentUser ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Unclaim
                              </>
                            ) : isClaimedByOther ? (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                Claimed
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 mr-1" />
                                Claim
                              </>
                            )}
                          </Button>
                        )
                      })()

                    ) : (
                      // Regular ideas show Save/Saved button
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleToggleFavorite(idea)}
                      >
                        {isIdeaFavorite ? (
                          <>
                            <BookmarkCheck className="h-3 w-3 mr-1" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-3 w-3 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleViewIdea(idea)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {filteredIdeas.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <div className="text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No ideas found</h3>
                <p>Try adjusting your search or filters to find more game ideas.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
            <CardDescription className="text-purple-100">
              {userProfile?.hasUsedFreeGeneration
                ? "Your free generation has been used. Choose a plan to continue creating."
                : "Your first generation is free! Choose a plan for more."
              }
              {userProfile && (
                <div className="mt-2 text-sm">
                  Current plan: <span className="font-semibold capitalize">{userProfile.subscriptionType}</span>
                  {userProfile.subscriptionStatus === 'active' && userProfile.subscriptionType !== 'free' && (
                    <span className="ml-2 px-2 py-1 bg-green-500 text-green-50 rounded-full text-xs">Active</span>
                  )}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  name: "Single Shot",
                  price: "$1",
                  subtitle: "Per Generation",
                  generations: "1 Generation",
                  planType: "one-shot" as const
                },
                {
                  name: "Spark",
                  price: "$2/mo",
                  subtitle: "4 Generations",
                  generations: "4 Generations/month",
                  popular: true,
                  planType: "spark" as const
                },
                {
                  name: "Creator",
                  price: "$5/mo",
                  subtitle: "10 Generations",
                  generations: "10 Generations/month",
                  planType: "creator" as const
                },
                {
                  name: "Universe",
                  price: "$11/mo",
                  subtitle: "Unlimited",
                  generations: "Unlimited",
                  planType: "universe" as const
                }
              ].filter(plan => {
                // Hide one-shot card for universe users
                if (userProfile?.subscriptionType === 'universe' && plan.planType === 'one-shot') {
                  return false
                }
                return true
              }).map((plan, index) => {
                // One-shot is never a "current plan" since it just adds generations
                const isCurrentPlan = plan.planType !== 'one-shot' &&
                                    userProfile?.subscriptionType === plan.planType &&
                                    userProfile?.subscriptionStatus === 'active'
                return (
                  <Card key={index} className={`text-center ${plan.popular ? 'ring-2 ring-yellow-400' : ''} ${isCurrentPlan ? 'ring-2 ring-green-400' : ''} bg-white text-gray-900`}>
                    {plan.popular && !isCurrentPlan && (
                      <div className="bg-yellow-400 text-yellow-900 text-xs font-bold py-1 px-3 rounded-b-md">
                        POPULAR
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="bg-green-400 text-green-900 text-xs font-bold py-1 px-3 rounded-b-md">
                        CURRENT PLAN
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="text-2xl font-bold text-purple-600">{plan.price}</div>
                      <CardDescription>{plan.generations}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handlePurchasePlan(plan.planType)}
                        disabled={isCurrentPlan || !userProfile}
                      >
                        {isCurrentPlan
                          ? 'Current Plan'
                          : plan.planType === 'one-shot'
                            ? 'Buy One'
                            : 'Choose Plan'
                        }
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />

      <PromptTemplates
        isOpen={showPromptTemplates}
        onClose={() => setShowPromptTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <HistorySection
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectIdea={handleViewIdea}
      />

      <FavoritesView
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onViewDetails={handleViewIdea}
        onShare={setShareIdea}
      />

      <UserGeneratedView
        isOpen={showUserGenerated}
        onClose={() => setShowUserGenerated(false)}
        onViewDetails={handleViewIdea}
        onShare={setShareIdea}
        onToggleFavorite={handleToggleFavorite}
        favoriteStatuses={favoriteStatuses}
      />

      <RecentlyViewedView
        isOpen={showRecentlyViewed}
        onClose={() => setShowRecentlyViewed(false)}
        onViewDetails={handleViewIdea}
        onShare={setShareIdea}
        onToggleFavorite={handleToggleFavorite}
        favoriteStatuses={favoriteStatuses}
      />

      {shareIdea && (
        <SocialShare
          idea={shareIdea}
          isOpen={!!shareIdea}
          onClose={() => setShareIdea(null)}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onPurchase={handlePurchasePlan}
        currentPlan={userProfile?.subscriptionStatus === 'active' && userProfile.subscriptionType !== 'free' && userProfile.subscriptionType !== 'one-shot'
          ? userProfile.subscriptionType
          : undefined}
        isUniverseUser={userProfile?.subscriptionType === 'universe'}
      />

      <IdeaDetails
        idea={selectedIdea}
        isOpen={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        onToggleFavorite={handleToggleFavorite}
        onShare={setShareIdea}
        isFavorite={selectedIdea ? favoriteStatuses[selectedIdea.id] || false : false}
      />
    </div>
  )
}
