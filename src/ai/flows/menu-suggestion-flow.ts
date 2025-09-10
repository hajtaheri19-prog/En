'use server';
/**
 * @fileOverview A simple menu suggestion flow.
 *
 * - menuSuggestionFlow - A function that handles the menu suggestion process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MenuSuggestionInputSchema = z.object({
  context: z.string().optional().describe('Additional context for the suggestion.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({
      text: z.string()
    }))
  })).optional().describe('The history of the conversation.')
});

const MenuSuggestionOutputSchema = z.string();

export async function menuSuggestionFlow(
  input: z.infer<typeof MenuSuggestionInputSchema>
): Promise<string> {
    const prompt = `You are a highly accurate and specialized AI assistant for helping students of Farhangian University with their course registration. Your language is Persian.

    Your primary mission:
    You must only answer questions related to course registration, academic regulations, prerequisites, co-requisites, and course planning.

    Constraints:
    - Politely refuse to answer any questions outside the scope of course registration (such as meal plans, weather, general knowledge, etc.).
    - If the question is irrelevant, tell the user that your expertise is solely in course registration guidance.

    Conversation History:
    {{#each history}}
      {{this.role}}: {{this.content.[0].text}}
    {{/each}}

    {{#if context}}
    New user question:
    {{context}}
    {{/if}}
    `;

    const {output} = await ai.generate({
        prompt: prompt,
        input: input,
        model: 'googleai/gemini-2.5-flash',
        output: {
          schema: MenuSuggestionOutputSchema
        }
    });
    return output!;
}
