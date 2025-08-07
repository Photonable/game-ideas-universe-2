"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Eye,
  Share2,
  X,
  Heart,
  Sparkles,
  Clock
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getRecentlyViewed } from "@/lib/firebaseData"
import { GameIdea } from "@/lib/localStorage"

interface RecentlyViewedViewProps {
  isOpen: boolean
  onClose: () => void
  onViewDetails: (idea: GameIdea) => void
  onShare: (idea: GameIdea) => void
  onToggleFavorite?: (idea: GameIdea) => void
  favoriteStatuses?: { [key: number]: boolean }
}

export default function RecentlyViewedView({
  isOpen,
  onClose,
  onViewDetails,
  onShare,
  onToggleFavorite,
  favoriteStatuses = {}
}: RecentlyViewedViewProps) {
  const { currentUser } = useAuth()
  const [recentlyViewed, setRecentlyViewed] = useState<GameIdea[]>([])
  const [loading, setLoading] = useState(false)

  const loadRecentlyViewed = useCallback(async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      const userRecentlyViewed = await getRecentlyViewed(currentUser.uid)
      setRecentlyViewed(userRecentlyViewed)
    } catch (error) {
      console.error('Error loading recently viewed:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (isOpen && currentUser) {
      loadRecentlyViewed()
    }
  }, [isOpen, currentUser, loadRecentlyViewed])

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date()
    const viewed = new Date(date)
    const diffMs = now.getTime() - viewed.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return viewed.toLocaleDateString()
  }

  if (!currentUser) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recently Viewed Unavailable</DialogTitle>
            <DialogDescription>
              Please log in to view your recently viewed ideas.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center space-x-2">
            <Eye className="h-6 w-6 text-blue-500" />
            <span>Recently Viewed Ideas</span>
          </DialogTitle>
          <DialogDescription>
            {recentlyViewed.length > 0
              ? `You have viewed ${recentlyViewed.length} idea${recentlyViewed.length === 1 ? '' : 's'} recently`
              : 'No recently viewed ideas - start exploring ideas to see your history!'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Eye className="h-8 w-8 animate-pulse mx-auto mb-2 text-blue-600" />
                <p className="text-muted-foreground">Loading your recently viewed ideas...</p>
              </div>
            </div>
          ) : recentlyViewed.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No recently viewed ideas</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring game ideas to build your viewing history!
              </p>
              <Button onClick={onClose} variant="outline">
                Browse Ideas
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentlyViewed.map((idea) => {
                const isFavorite = favoriteStatuses[idea.id] || false
                return (
                  <Card key={idea.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {idea.title}
                        </CardTitle>
                        {onToggleFavorite && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onToggleFavorite(idea)}
                          >
                            {isFavorite ? (
                              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                            ) : (
                              <Heart className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {idea.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {idea.genre}
                        </Badge>
                        {idea.source === "AI Generated" && (
                          <Badge className="text-xs bg-purple-100 text-purple-700">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          <Clock className="h-3 w-3 mr-1" />
                          {idea.createdAt && formatTimeAgo(idea.createdAt)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {idea.description}
                      </p>
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Viability</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => onShare(idea)}
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => onViewDetails(idea)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Again
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
