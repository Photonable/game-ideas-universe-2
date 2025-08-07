"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Share2, BookmarkCheck, Bookmark, Sparkles, X } from "lucide-react"
import { GameIdea } from "@/lib/localStorage"
import { useAuth } from "@/contexts/AuthContext"

interface IdeaDetailsProps {
  idea: GameIdea | null
  isOpen: boolean
  onClose: () => void
  onToggleFavorite?: (idea: GameIdea) => void
  onShare?: (idea: GameIdea) => void
  isFavorite?: boolean
}

export default function IdeaDetails({
  idea,
  isOpen,
  onClose,
  onToggleFavorite,
  onShare,
  isFavorite = false
}: IdeaDetailsProps) {
  const { currentUser } = useAuth()

  if (!idea) return null

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div>
            <DialogTitle className="text-xl font-bold leading-tight">
              {idea.title}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {idea.createdAt && formatDate(idea.createdAt)}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm leading-relaxed">
              {idea.description}
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {idea.category}
            </Badge>
            <Badge variant="secondary">
              {idea.genre}
            </Badge>
            {idea.source === "AI Generated" && (
              <Badge className="bg-purple-100 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
          </div>

          {/* Original Prompt */}
          {idea.prompt && (
            <div>
              <h4 className="text-sm font-medium mb-2">Original Prompt</h4>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="text-sm italic">"{idea.prompt}"</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator />

          {/* Ratings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Ratings</h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Viability</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${idea.viability * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8">{idea.viability}/10</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Originality</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${idea.originality * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8">{idea.originality}/10</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Market Appeal</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${idea.marketAppeal * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8">{idea.marketAppeal}/10</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex space-x-3">
            {currentUser && onToggleFavorite && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onToggleFavorite(idea)}
              >
                {isFavorite ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save to Favorites
                  </>
                )}
              </Button>
            )}

            {onShare && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onShare(idea)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
