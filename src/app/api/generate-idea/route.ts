import { NextRequest, NextResponse } from 'next/server'
import { generateGameIdea } from '@/lib/genkit'

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const userPrompt = requestBody.prompt || 'creative gameplay'

    if (!userPrompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log('Generating game idea with Genkit for prompt:', userPrompt)

    // Use Genkit flow for AI generation
    const result = await generateGameIdea(userPrompt)

    return NextResponse.json({
      idea: result.idea,
      mock: result.mock || false,
      success: result.success,
      message: result.success
        ? "Generated with Firebase Genkit + Gemini AI"
        : result.error || "Using fallback data"
    })

  } catch (error) {
    console.error('Error in generate-idea API route:', error)

    // Final fallback idea if everything fails
    const fallbackIdea = {
      id: Date.now() + Math.floor(Math.random() * 10000),
      title: "Emergency Fallback Concept",
      description: `A game concept inspired by creative gameplay. This idea showcases innovative mechanics and engaging player experiences.`,
      category: "Video Game",
      genre: ["Action", "Adventure", "Strategy", "Puzzle", "Simulation"][Math.floor(Math.random() * 5)],
      source: "AI Generated",
      viability: Math.floor(Math.random() * 3) + 7,
      originality: Math.floor(Math.random() * 3) + 7,
      marketAppeal: Math.floor(Math.random() * 3) + 6,
      claimed: false,
      createdAt: new Date().toISOString(),
      prompt: 'creative gameplay'
    }

    return NextResponse.json({
      idea: fallbackIdea,
      mock: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Using emergency fallback due to system error"
    }, { status: 500 })
  }
}
