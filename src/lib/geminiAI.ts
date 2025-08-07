import { GoogleGenerativeAI } from '@google/generative-ai'
import { GameIdea } from './localStorage'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

interface GeneratedIdeaResponse {
  title: string
  description: string
  category: string
  genre: string
  viability: number
  originality: number
  marketAppeal: number
  reasoning?: string
}

export async function generateGameIdea(prompt: string): Promise<GameIdea> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const systemPrompt = `You are a creative game design expert. Generate an innovative and detailed game idea based on the user's prompt.

The response should be a valid JSON object with this exact structure:
{
  "title": "A catchy, memorable game title (max 60 characters)",
  "description": "A compelling 2-3 sentence description of the game concept, mechanics, and what makes it unique (100-200 characters)",
  "category": "One of: Video Game, Board Game, Card Game, Mobile Game, VR Game",
  "genre": "One of: Action, Adventure, RPG, Strategy, Puzzle, Simulation, Racing, Sports, Horror, Platformer, Fighting, Shooter",
  "viability": 7-10 (integer - how technically feasible and commercially viable),
  "originality": 6-10 (integer - how unique and innovative the concept is),
  "marketAppeal": 6-10 (integer - how appealing to target audience),
  "reasoning": "Brief explanation of the scores and what makes this idea special"
}

Focus on creating something that feels fresh and exciting while being grounded in good game design principles. Consider current gaming trends, player psychology, and market opportunities.`

    const fullPrompt = `${systemPrompt}\n\nUser's game idea prompt: "${prompt}"\n\nGenerate a creative game idea:`

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    // Try to extract JSON from the response
    let jsonResponse: GeneratedIdeaResponse
    try {
      // Look for JSON in the response text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', text)
      // Fallback response if parsing fails
      jsonResponse = {
        title: "AI-Generated Game Concept",
        description: `An innovative game based on: "${prompt}". ${text.slice(0, 150)}...`,
        category: "Video Game",
        genre: "Adventure",
        viability: 7,
        originality: 8,
        marketAppeal: 7,
        reasoning: "Generated from AI response that couldn't be parsed as structured data."
      }
    }

    // Create the game idea object
    const gameIdea: GameIdea = {
      id: Date.now(),
      title: jsonResponse.title,
      description: jsonResponse.description,
      category: jsonResponse.category,
      genre: jsonResponse.genre,
      source: "AI Generated",
      viability: Math.max(6, Math.min(10, jsonResponse.viability)),
      originality: Math.max(6, Math.min(10, jsonResponse.originality)),
      marketAppeal: Math.max(6, Math.min(10, jsonResponse.marketAppeal)),
      claimed: false,
      createdAt: new Date(),
      prompt: prompt
    }

    return gameIdea

  } catch (error) {
    console.error('Error generating game idea with Gemini:', error)

    // Fallback idea if API fails
    const fallbackIdea: GameIdea = {
      id: Date.now(),
      title: "Creative Game Concept",
      description: `An innovative game experience inspired by: "${prompt}". This concept blends unique mechanics with engaging gameplay to create something truly special.`,
      category: "Video Game",
      genre: ["Action", "Adventure", "Strategy", "Puzzle", "Simulation"][Math.floor(Math.random() * 5)],
      source: "AI Generated",
      viability: Math.floor(Math.random() * 3) + 7,
      originality: Math.floor(Math.random() * 3) + 7,
      marketAppeal: Math.floor(Math.random() * 3) + 6,
      claimed: false,
      createdAt: new Date(),
      prompt: prompt
    }

    return fallbackIdea
  }
}

export async function enhanceGameIdea(idea: GameIdea): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const enhancePrompt = `As a game design expert, provide detailed enhancement suggestions for this game idea:

Title: ${idea.title}
Description: ${idea.description}
Category: ${idea.category}
Genre: ${idea.genre}

Please provide:
1. Core gameplay mechanics (2-3 key mechanics)
2. Unique selling points that differentiate it from similar games
3. Target audience and market positioning
4. Potential monetization strategies
5. Technical implementation considerations

Keep the response concise but comprehensive, around 200-300 words.`

    const result = await model.generateContent(enhancePrompt)
    const response = await result.response
    return response.text()

  } catch (error) {
    console.error('Error enhancing game idea:', error)
    return "Unable to generate enhancement suggestions at this time. Please try again later."
  }
}

export function isGeminiConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY !== '')
}
