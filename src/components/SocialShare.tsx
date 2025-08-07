"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Check,
  Send,
  Globe
} from "lucide-react"
import { GameIdea } from "@/lib/localStorage"

interface SocialShareProps {
  idea: GameIdea
  isOpen: boolean
  onClose: () => void
}

export default function SocialShare({ idea, isOpen, onClose }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const [customMessage, setCustomMessage] = useState("")

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${baseUrl}/idea/${idea.id}?title=${encodeURIComponent(idea.title)}`

  const defaultMessage = `Check out this amazing game idea: "${idea.title}" - ${idea.description}`
  const shareMessage = customMessage || defaultMessage

  const shareTargets = [
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-blue-500 hover:bg-blue-600",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-700 hover:bg-blue-800",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessage)}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareMessage)}`,
    },
    {
      name: "Reddit",
      icon: Globe,
      color: "bg-orange-600 hover:bg-orange-700",
      url: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(idea.title)}`,
    }
  ]

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Game Idea: ${idea.title}`,
          text: shareMessage,
          url: shareUrl,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Game Idea</span>
          </DialogTitle>
          <DialogDescription>
            Share "{idea.title}" with your friends and fellow creators
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Idea Preview */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
            <h3 className="font-medium text-lg mb-2">{idea.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {idea.description}
            </p>
            <div className="flex space-x-2 mt-3">
              <span className="text-xs bg-white px-2 py-1 rounded border">
                {idea.category}
              </span>
              <span className="text-xs bg-white px-2 py-1 rounded border">
                {idea.genre}
              </span>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="text-sm font-medium">Custom Message (Optional)</label>
            <Input
              placeholder="Add your own message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use default message
            </p>
          </div>

          {/* Social Media Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share on Social Media</label>
            <div className="grid grid-cols-2 gap-3">
              {shareTargets.map((target) => {
                const IconComponent = target.icon
                return (
                  <TooltipProvider key={target.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className={`${target.color} text-white border-0 flex items-center space-x-2`}
                          onClick={() => handleShare(target.url)}
                        >
                          <IconComponent className="h-4 w-4" />
                          <span>{target.name}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share on {target.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          </div>

          {/* Native Share (Mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant="outline"
              onClick={handleNativeShare}
              className="w-full flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Share via Apps</span>
            </Button>
          )}

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Direct Link</label>
            <div className="flex space-x-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex items-center space-x-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
