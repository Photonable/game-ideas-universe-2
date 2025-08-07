"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  History,
  Eye,
  Clock,
  Sparkles,
  Search,
  Trash2,
  RefreshCw,
  Calendar
} from "lucide-react"
import {
  getGenerationHistory,
  getRecentlyViewed,
  GameIdea
} from "@/lib/localStorage"

interface HistorySectionProps {
  isOpen: boolean
  onClose: () => void
  onSelectIdea?: (idea: GameIdea) => void
}

export default function HistorySection({ isOpen, onClose, onSelectIdea }: HistorySectionProps) {
  const [generationHistory, setGenerationHistory] = useState<GameIdea[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<GameIdea[]>([])
  const [selectedIdea, setSelectedIdea] = useState<GameIdea | null>(null)

  useEffect(() => {
    if (isOpen) {
      setGenerationHistory(getGenerationHistory())
      setRecentlyViewed(getRecentlyViewed())
    }
  }, [isOpen])

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unknown'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatRelativeTime = (date: Date | string | undefined) => {
    if (!date) return 'Unknown'
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  const groupItemsByDate = (items: GameIdea[]) => {
    const groups: { [key: string]: GameIdea[] } = {}

    items.forEach(item => {
      if (!item.createdAt) return

      const date = typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt
      const dateKey = date.toDateString()

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(item)
    })

    return Object.entries(groups).sort((a, b) =>
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    )
  }

  const renderIdeaCard = (idea: GameIdea, showPrompt = false) => (
    <Card
      key={`${idea.id}-${idea.createdAt}`}
      className="group hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => setSelectedIdea(idea)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base group-hover:text-purple-600 transition-colors line-clamp-1">
              {idea.title}
            </CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              {idea.description}
            </CardDescription>
          </div>
          <div className="text-xs text-muted-foreground ml-2">
            {formatRelativeTime(idea.createdAt)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {idea.category}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {idea.genre}
            </Badge>
          </div>

          {showPrompt && idea.prompt && (
            <div className="p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center space-x-1 mb-1">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <span className="font-medium">Prompt:</span>
              </div>
              <p className="text-muted-foreground line-clamp-2">{idea.prompt}</p>
            </div>
          )}

          <div className="flex justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Viability:</span>
                <span className="text-green-600 font-medium">{idea.viability}/10</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Originality:</span>
                <span className="text-blue-600 font-medium">{idea.originality}/10</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>History & Recent Activity</span>
          </DialogTitle>
          <DialogDescription>
            View your generated ideas and recently viewed content
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="generated" className="space-y-4 flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generated" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>Generated Ideas ({generationHistory.length})</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Recently Viewed ({recentlyViewed.length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh]">
            <TabsContent value="generated" className="space-y-4 mt-0">
              {generationHistory.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No generated ideas yet</h3>
                    <p className="text-muted-foreground">Your AI-generated ideas will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {groupItemsByDate(generationHistory).map(([dateKey, ideas]) => (
                    <div key={dateKey}>
                      <div className="flex items-center space-x-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm">
                          {new Date(dateKey).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <div className="h-px bg-border flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {ideas.length} idea{ideas.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ideas.map(idea => renderIdeaCard(idea, true))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent" className="space-y-4 mt-0">
              {recentlyViewed.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No recently viewed ideas</h3>
                    <p className="text-muted-foreground">Ideas you view will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {groupItemsByDate(recentlyViewed).map(([dateKey, ideas]) => (
                    <div key={dateKey}>
                      <div className="flex items-center space-x-2 mb-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm">
                          {new Date(dateKey).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <div className="h-px bg-border flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {ideas.length} view{ideas.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ideas.map(idea => renderIdeaCard(idea, false))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Idea Details Modal */}
        {selectedIdea && (
          <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span>{selectedIdea.title}</span>
                </DialogTitle>
                <DialogDescription>
                  {formatDate(selectedIdea.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedIdea.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Badge variant="outline" className="ml-2">
                      {selectedIdea.category}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Genre</label>
                    <Badge variant="secondary" className="ml-2">
                      {selectedIdea.genre}
                    </Badge>
                  </div>
                </div>

                {selectedIdea.prompt && (
                  <div>
                    <label className="text-sm font-medium">Original Prompt</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm">{selectedIdea.prompt}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Viability Score</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${selectedIdea.viability * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{selectedIdea.viability}/10</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Originality Score</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${selectedIdea.originality * 10}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{selectedIdea.originality}/10</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  {onSelectIdea && (
                    <Button
                      onClick={() => {
                        onSelectIdea(selectedIdea)
                        setSelectedIdea(null)
                        onClose()
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      View Full Details
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedIdea(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
