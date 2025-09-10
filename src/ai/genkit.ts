import {genkit, GenerationContext} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: (c: GenerationContext) => c.auth?.apiKey || process.env.GEMINI_API_KEY,
    }),
  ],
  // The model is now specified in the flow/generation call, not globally.
});
