"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  User,
  TrendingUp,
  Heart,
  Calendar,
  Target,
  Trophy,
  Sparkles,
  Edit,
  Mail,
  Users,
  X
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import {
  getGenerationStats,
  getFavorites,
  updateUserProfile as updateFirebaseUserProfile,
  GenerationStats
} from "@/lib/firebaseData"
import { GameIdea, getGenerationsRemaining } from "@/lib/localStorage"

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { currentUser, userProfile, updateUserProfile } = useAuth()
  const [stats, setStats] = useState<GenerationStats | null>(null)
  const [favorites, setFavorites] = useState<GameIdea[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && currentUser && userProfile) {
      setEditName(userProfile.name)
      setEditEmail(userProfile.email)

      // Load user stats and favorites
      const loadUserData = async () => {
        try {
          setLoading(true)
          const [userStats, userFavorites] = await Promise.all([
            getGenerationStats(currentUser.uid),
            getFavorites(currentUser.uid)
          ])
          setStats(userStats)
          setFavorites(userFavorites)
        } catch (error) {
          console.error('Error loading user data:', error)
        } finally {
          setLoading(false)
        }
      }

      loadUserData()
    }
  }, [isOpen, currentUser, userProfile])

  const handleSaveProfile = async () => {
    if (currentUser && editName && editEmail) {
      try {
        setLoading(true)
        await updateUserProfile({ name: editName, email: editEmail })
        setIsEditing(false)
      } catch (error) {
        console.error('Error updating profile:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const favoriteGenres = stats ? Object.entries(stats.favoriteGenres).sort((a, b) => (b[1] as number) - (a[1] as number)) : []
  const favoriteCategories = stats ? Object.entries(stats.favoriteCategories).sort((a, b) => (b[1] as number) - (a[1] as number)) : []

  const getNextLevelProgress = () => {
    if (!stats) return 0
    const level = Math.floor(stats.totalGenerations / 10) + 1
    const progressInLevel = stats.totalGenerations % 10
    return (progressInLevel / 10) * 100
  }

  const getUserLevel = () => {
    if (!stats) return 1
    return Math.floor(stats.totalGenerations / 10) + 1
  }

  const getLevelTitle = (level: number) => {
    if (level <= 2) return "Novice Creator"
    if (level <= 5) return "Idea Explorer"
    if (level <= 10) return "Creative Visionary"
    if (level <= 20) return "Innovation Master"
    return "Legendary Ideator"
  }

  if (!currentUser || !userProfile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile Unavailable</DialogTitle>
            <DialogDescription>
              Please log in to view your profile.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Profile Dashboard</DialogTitle>
          <DialogDescription>
            Manage your account and view your creative journey
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <User className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Name"
                        />
                        <Input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="Email"
                          type="email"
                        />
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-xl">{userProfile.name}</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{userProfile.email}</span>
                        </CardDescription>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={handleSaveProfile} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.totalGenerations || 0}</div>
                    <div className="text-sm text-muted-foreground">Ideas Generated</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">{favorites.length}</div>
                    <div className="text-sm text-muted-foreground">Favorites</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{stats?.generationsThisWeek || 0}</div>
                    <div className="text-sm text-muted-foreground">This Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-lg font-bold">Level {getUserLevel()}</div>
                    <div className="text-sm text-muted-foreground">{getLevelTitle(getUserLevel())}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Level Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Level Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Level {getUserLevel()}</span>
                  <span>Level {getUserLevel() + 1}</span>
                </div>
                <Progress value={getNextLevelProgress()} className="h-3" />
                <div className="text-center text-sm text-muted-foreground">
                  {stats ? (10 - (stats.totalGenerations % 10)) : 10} more ideas to next level
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Subscription</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Current Plan</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {userProfile.subscriptionType === 'free' ? 'Free' : userProfile.subscriptionType}
                      {userProfile.subscriptionStatus === 'active' && userProfile.subscriptionType !== 'free' && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">Active</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {getGenerationsRemaining(userProfile) === 999999 ? 'Unlimited' : getGenerationsRemaining(userProfile)}
                    </div>
                    <div className="text-sm text-muted-foreground">Generations Remaining</div>
                  </div>
                </div>

                {userProfile.subscriptionType !== 'free' && userProfile.subscriptionStatus === 'active' && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const confirmed = confirm('Are you sure you want to unsubscribe? You will lose access to your subscription benefits but keep your remaining generations.')
                        if (confirmed) {
                          // Handle unsubscribe
                          updateUserProfile({
                            subscriptionType: 'free',
                            subscriptionStatus: 'inactive'
                          })
                        }
                      }}
                    >
                      Unsubscribe
                    </Button>
                    <div className="text-xs text-muted-foreground mt-2">
                      You'll keep your remaining generations but won't receive new ones from your subscription.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Stats */}
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="favorites">Favorite Genres</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="favorites" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Favorite Genres</CardTitle>
                </CardHeader>
                <CardContent>
                  {favoriteGenres.length > 0 ? (
                    <div className="space-y-2">
                      {favoriteGenres.map(([genre, count]) => (
                        <div key={genre} className="flex justify-between items-center">
                          <Badge variant="secondary">{genre}</Badge>
                          <span className="text-sm text-muted-foreground">{count as number} ideas</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Generate more ideas to see your favorite genres!</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Favorite Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {favoriteCategories.length > 0 ? (
                    <div className="space-y-2">
                      {favoriteCategories.map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <Badge variant="outline">{category}</Badge>
                          <span className="text-sm text-muted-foreground">{count as number} ideas</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Generate more ideas to see your favorite categories!</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Member Since</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{userProfile.joinDate ? new Date(userProfile.joinDate).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="text-sm text-muted-foreground">Monthly Activity</div>
                    <div className="flex justify-between">
                      <span>This Month</span>
                      <span>{stats?.generationsThisMonth || 0} ideas</span>
                    </div>
                    <div className="flex justify-between">
                      <span>This Week</span>
                      <span>{stats?.generationsThisWeek || 0} ideas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
