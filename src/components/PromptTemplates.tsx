"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Layout,
  Search,
  Sparkles,
  Shuffle,
  Filter,
  Lightbulb,
  Zap
} from "lucide-react"
import {
  promptTemplates,
  getTemplatesByCategory,
  getTemplateCategories,
  searchTemplates,
  getRandomTemplate,
  PromptTemplate
} from "@/lib/promptTemplates"

interface PromptTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: PromptTemplate) => void
}

export default function PromptTemplates({ isOpen, onClose, onSelectTemplate }: PromptTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)

  const categories = getTemplateCategories()

  const getFilteredTemplates = () => {
    let filtered = promptTemplates

    if (searchQuery) {
      filtered = searchTemplates(searchQuery)
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    return filtered
  }

  const handleUseTemplate = (template: PromptTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  const handleRandomTemplate = () => {
    const randomTemplate = getRandomTemplate()
    setSelectedTemplate(randomTemplate)
  }

  const filteredTemplates = getFilteredTemplates()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Layout className="h-5 w-5" />
            <span>AI Prompt Templates</span>
          </DialogTitle>
          <DialogDescription>
            Choose from curated prompts to inspire your next game idea
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 h-full">
          {/* Search and Controls */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleRandomTemplate}
              className="flex items-center space-x-2"
            >
              <Shuffle className="h-4 w-4" />
              <span>Random</span>
            </Button>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="All">All Categories</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="whitespace-nowrap">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <div className="overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-md hover:-translate-y-1"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base group-hover:text-purple-600 transition-colors">
                              {template.title}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {template.description}
                            </CardDescription>
                          </div>
                          <div className="bg-purple-100 rounded-full p-2 group-hover:bg-purple-200 transition-colors">
                            <Lightbulb className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUseTemplate(template)
                            }}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No templates found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or browse different categories</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Template Details Modal */}
        {selectedTemplate && (
          <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  <span>{selectedTemplate.title}</span>
                </DialogTitle>
                <DialogDescription>
                  {selectedTemplate.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Badge variant="outline" className="ml-2">
                    {selectedTemplate.category}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium">Prompt</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm">{selectedTemplate.prompt}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => handleUseTemplate(selectedTemplate)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Idea with This Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTemplate(null)}
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
