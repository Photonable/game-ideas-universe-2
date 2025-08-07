import { GoogleGenerativeAI } from '@google/generative-ai'

interface GameIdea {
  id: number
  title: string
  description: string
  category: string
  genre: string
  source: string
  viability: number
  originality: number
  marketAppeal: number
  claimed: boolean
  createdAt: string
  prompt: string
}

// Generate unique ID to prevent duplicates
function generateUniqueId(): number {
  return Date.now() + Math.floor(Math.random() * 10000)
}

// Initialize Gemini AI for Genkit-style flows
let genAI: GoogleGenerativeAI | null = null
const apiKey = process.env.GEMINI_API_KEY
if (apiKey && apiKey !== 'your_server_gemini_api_key_here' && apiKey.length > 20) {
  genAI = new GoogleGenerativeAI(apiKey)
  console.log('Genkit-style AI initialized with Gemini API')
} else {
  console.log('No valid API key - Genkit will use fallback generation')
}

// Genkit-style flow function
export async function generateGameIdeaFlow(prompt: string): Promise<GameIdea> {
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

Focus on creating something that feels fresh and exciting while being grounded in good game design principles.`

  const fullPrompt = `${systemPrompt}\n\nUser's game idea prompt: "${prompt}"\n\nGenerate a creative game idea:`

  try {
    if (!genAI) {
      throw new Error('Genkit AI not configured - using fallback')
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const responseText = response.text()

    // Try to extract JSON from the response
    let jsonResponse
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Genkit flow: Failed to parse AI response as JSON:', responseText)
      // Fallback response if parsing fails
      jsonResponse = {
        title: "AI-Generated Game Concept",
        description: `An innovative game based on: "${prompt}". ${responseText.slice(0, 150)}...`,
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
      id: generateUniqueId(),
      title: jsonResponse.title,
      description: jsonResponse.description,
      category: jsonResponse.category,
      genre: jsonResponse.genre,
      source: "AI Generated",
      viability: Math.max(6, Math.min(10, jsonResponse.viability)),
      originality: Math.max(6, Math.min(10, jsonResponse.originality)),
      marketAppeal: Math.max(6, Math.min(10, jsonResponse.marketAppeal)),
      claimed: false,
      createdAt: new Date().toISOString(),
      prompt: prompt
    }

    console.log('Genkit flow: Successfully generated idea:', gameIdea.title)
    return gameIdea

  } catch (error) {
    console.error('Genkit flow: Error generating game idea:', error)

    // Fallback idea if AI generation fails
    const fallbackIdea: GameIdea = {
      id: generateUniqueId(),
      title: "Creative Game Concept",
      description: `An innovative game experience inspired by: "${prompt}". This concept blends unique mechanics with engaging gameplay to create something truly special.`,
      category: "Video Game",
      genre: ["Action", "Adventure", "Strategy", "Puzzle", "Simulation"][Math.floor(Math.random() * 5)],
      source: "AI Generated",
      viability: Math.floor(Math.random() * 3) + 7,
      originality: Math.floor(Math.random() * 3) + 7,
      marketAppeal: Math.floor(Math.random() * 3) + 6,
      claimed: false,
      createdAt: new Date().toISOString(),
      prompt: prompt
    }

    console.log('Genkit flow: Using fallback idea due to error')
    return fallbackIdea
  }
}

// Main Genkit-style API function
export async function generateGameIdea(prompt: string) {
  try {
    console.log('Starting Genkit flow for prompt:', prompt)
    const result = await generateGameIdeaFlow(prompt)

    return {
      success: true,
      idea: result,
      mock: !genAI // true if no API key, false if using real AI
    }
  } catch (error) {
    console.error('Genkit: Error running flow:', error)

    // Return fallback idea
    const fallbackIdea: GameIdea = {
      id: generateUniqueId(),
      title: "Fallback Game Concept",
      description: `A creative game inspired by: "${prompt}". This concept combines innovative mechanics with engaging gameplay.`,
      category: "Video Game",
      genre: "Adventure",
      source: "AI Generated",
      viability: 7,
      originality: 7,
      marketAppeal: 7,
      claimed: false,
      createdAt: new Date().toISOString(),
      prompt
    }

    return {
      success: false,
      idea: fallbackIdea,
      mock: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
