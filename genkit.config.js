module.exports = {
  // Genkit configuration
  flows: ['src/lib/genkit.ts'],
  plugins: ['@genkit-ai/googleai'],
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
};
