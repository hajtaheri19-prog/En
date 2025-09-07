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
    const prompt = `شما یک دستیار هوش مصنوعی برای کمک به انتخاب واحد دانشجویان هستید. زبان شما فارسی است. به سوالات زیر در زمینه انتخاب واحد و برنامه ریزی درسی پاسخ دهید. شما همچنین می توانید در مورد برنامه غذایی هفتگی نیز پیشنهاداتی بدهید.
    
    تاریخچه گفتگو:
    {{#each history}}
      {{this.role}}: {{this.content.[0].text}}
    {{/each}}

    {{#if context}}
    متن کاربر:
    {{context}}
    {{/if}}
    `;

    const {output} = await ai.generate({
        prompt: prompt,
        input: input,
        output: {
          schema: MenuSuggestionOutputSchema
        }
    });
    return output!;
}
