export interface PromptTemplate {
  id: string
  title: string
  category: string
  description: string
  prompt: string
  tags: string[]
}

export const promptTemplates: PromptTemplate[] = [
  // Action & Adventure
  {
    id: 'action-1',
    title: 'Space Combat',
    category: 'Action & Adventure',
    description: 'Fast-paced space battles and exploration',
    prompt: 'A space combat game where players pilot customizable starships in epic battles across multiple star systems',
    tags: ['space', 'combat', 'ships', 'sci-fi']
  },
  {
    id: 'action-2',
    title: 'Stealth Assassin',
    category: 'Action & Adventure',
    description: 'Strategic stealth gameplay with assassination mechanics',
    prompt: 'A stealth-based game where players are master assassins infiltrating heavily guarded locations using shadows, gadgets, and strategy',
    tags: ['stealth', 'assassin', 'strategy', 'infiltration']
  },
  {
    id: 'action-3',
    title: 'Post-Apocalyptic Survival',
    category: 'Action & Adventure',
    description: 'Survive in a dangerous post-apocalyptic world',
    prompt: 'A survival game set in a post-apocalyptic wasteland where players scavenge resources, build shelters, and fight mutated creatures',
    tags: ['survival', 'post-apocalyptic', 'crafting', 'wasteland']
  },

  // Puzzle & Strategy
  {
    id: 'puzzle-1',
    title: 'Time Manipulation',
    category: 'Puzzle & Strategy',
    description: 'Solve puzzles by manipulating time flow',
    prompt: 'A puzzle game where players can rewind, fast-forward, and pause time to solve increasingly complex temporal challenges',
    tags: ['time', 'manipulation', 'temporal', 'physics']
  },
  {
    id: 'puzzle-2',
    title: 'City Builder',
    category: 'Puzzle & Strategy',
    description: 'Build and manage thriving cities',
    prompt: 'A city-building strategy game where players design efficient urban layouts while managing resources, traffic, and citizen happiness',
    tags: ['city', 'building', 'management', 'urban']
  },
  {
    id: 'puzzle-3',
    title: 'Quantum Physics',
    category: 'Puzzle & Strategy',
    description: 'Puzzles based on quantum mechanics',
    prompt: 'A mind-bending puzzle game based on quantum physics principles where players manipulate particles and wave functions',
    tags: ['quantum', 'physics', 'science', 'particles']
  },

  // Social & Multiplayer
  {
    id: 'social-1',
    title: 'Virtual Restaurant',
    category: 'Social & Multiplayer',
    description: 'Collaborate to run a restaurant',
    prompt: 'A cooperative multiplayer game where players work together to run a virtual restaurant, coordinating cooking, serving, and management',
    tags: ['cooking', 'restaurant', 'cooperation', 'teamwork']
  },
  {
    id: 'social-2',
    title: 'Town Mystery',
    category: 'Social & Multiplayer',
    description: 'Solve mysteries with friends in a small town',
    prompt: 'A social deduction game set in a small town where players investigate mysteries while some secretly work against the group',
    tags: ['mystery', 'deduction', 'town', 'investigation']
  },
  {
    id: 'social-3',
    title: 'Space Colony',
    category: 'Social & Multiplayer',
    description: 'Build a space colony together',
    prompt: 'A collaborative space colonization game where players work together to establish and grow a thriving colony on an alien planet',
    tags: ['space', 'colony', 'collaboration', 'alien']
  },

  // Creative & Artistic
  {
    id: 'creative-1',
    title: 'Dream Architect',
    category: 'Creative & Artistic',
    description: 'Design and explore surreal dreamscapes',
    prompt: 'A creative game where players design and explore surreal dreamscapes using impossible architecture and dream logic',
    tags: ['dreams', 'architecture', 'surreal', 'creativity']
  },
  {
    id: 'creative-2',
    title: 'Music Garden',
    category: 'Creative & Artistic',
    description: 'Create music by growing magical plants',
    prompt: 'A musical creativity game where players grow magical plants that produce different sounds and melodies to compose beautiful music',
    tags: ['music', 'plants', 'composition', 'magical']
  },
  {
    id: 'creative-3',
    title: 'Color Revolution',
    category: 'Creative & Artistic',
    description: 'Paint the world to solve puzzles',
    prompt: 'An artistic puzzle game where players use colors and paintbrush mechanics to change the world and solve environmental challenges',
    tags: ['colors', 'painting', 'art', 'environment']
  },

  // Horror & Mystery
  {
    id: 'horror-1',
    title: 'Haunted Library',
    category: 'Horror & Mystery',
    description: 'Uncover secrets in an ancient haunted library',
    prompt: 'A psychological horror game set in an ancient library where books come alive and reality blurs between fiction and nightmare',
    tags: ['library', 'books', 'psychological', 'haunted']
  },
  {
    id: 'horror-2',
    title: 'Deep Sea Terror',
    category: 'Horror & Mystery',
    description: 'Explore the terrifying depths of the ocean',
    prompt: 'An underwater horror game where players explore the deepest ocean trenches and encounter ancient, terrifying sea creatures',
    tags: ['ocean', 'underwater', 'sea creatures', 'depths']
  },

  // Simulation & Life
  {
    id: 'sim-1',
    title: 'Dragon Trainer',
    category: 'Simulation & Life',
    description: 'Raise and train magical dragons',
    prompt: 'A life simulation game where players raise, train, and bond with magical dragons while exploring a fantasy world',
    tags: ['dragons', 'training', 'fantasy', 'bonding']
  },
  {
    id: 'sim-2',
    title: 'Eco System',
    category: 'Simulation & Life',
    description: 'Balance complex ecosystems',
    prompt: 'An ecological simulation where players manage and balance complex ecosystems while dealing with environmental challenges',
    tags: ['ecology', 'environment', 'balance', 'nature']
  },

  // Retro & Arcade
  {
    id: 'retro-1',
    title: 'Neon Racing',
    category: 'Retro & Arcade',
    description: 'High-speed racing in a neon cyberpunk world',
    prompt: 'A retro-style racing game set in a neon-lit cyberpunk city with gravity-defying tracks and electronic music',
    tags: ['racing', 'neon', 'cyberpunk', 'retro']
  },
  {
    id: 'retro-2',
    title: 'Pixel Dungeon',
    category: 'Retro & Arcade',
    description: 'Classic dungeon crawling with modern twists',
    prompt: 'A pixel art dungeon crawler with procedurally generated levels and modern gameplay mechanics like crafting and skill trees',
    tags: ['pixel art', 'dungeon', 'procedural', 'classic']
  }
]

export const getTemplatesByCategory = (category: string): PromptTemplate[] => {
  return promptTemplates.filter(template => template.category === category)
}

export const getTemplateCategories = (): string[] => {
  return [...new Set(promptTemplates.map(template => template.category))]
}

export const searchTemplates = (query: string): PromptTemplate[] => {
  const lowercaseQuery = query.toLowerCase()
  return promptTemplates.filter(template =>
    template.title.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

export const getRandomTemplate = (): PromptTemplate => {
  return promptTemplates[Math.floor(Math.random() * promptTemplates.length)]
}
