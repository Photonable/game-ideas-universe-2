"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Heart,
  BookmarkCheck,
  Eye,
  Share2,
  X,
  Sparkles
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getFavorites, removeFromFavorites } from "@/lib/firebaseData"
import { GameIdea } from "@/lib/localStorage"

interface FavoritesViewProps {
  isOpen: boolean
  onClose: () => void
  onViewDetails: (idea: GameIdea) => void
  onShare: (idea: GameIdea) => void
}

export default function FavoritesView({ isOpen, onClose, onViewDetails, onShare }: FavoritesViewProps) {
  const { currentUser } = useAuth()
  const [favorites, setFavorites] = useState<GameIdea[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && currentUser) {
      loadFavorites()
    }
  }, [isOpen, currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadFavorites = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      const userFavorites = await getFavorites(currentUser.uid)
      setFavorites(userFavorites)
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (idea: GameIdea) => {
    if (!currentUser) return

    try {
      await removeFromFavorites(currentUser.uid, idea.id)
      setFavorites(prev => prev.filter(fav => fav.id !== idea.id))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (!currentUser) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Favorites Unavailable</DialogTitle>
            <DialogDescription>
              Please log in to view your saved ideas.
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
            <Heart className="h-6 w-6 text-red-500" />
            <span>Your Saved Ideas</span>
          </DialogTitle>
          <DialogDescription>
            {favorites.length > 0
              ? `You have ${favorites.length} saved idea${favorites.length === 1 ? '' : 's'}`
              : 'No saved ideas yet - start favoriting ideas you love!'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Sparkles className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-600" />
                <p className="text-muted-foreground">Loading your saved ideas...</p>
              </div>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No saved ideas yet</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring ideas and click the heart icon to save your favorites!
              </p>
              <Button onClick={onClose} variant="outline">
                Explore Ideas
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((idea) => (
                <Card key={idea.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {idea.title}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFavorite(idea)}
                      >
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </Button>
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
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={() => onViewDetails(idea)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
