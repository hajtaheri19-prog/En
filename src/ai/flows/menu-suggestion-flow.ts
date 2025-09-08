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
    const prompt = `شما یک دستیار هوش مصنوعی متخصص و بسیار دقیق برای کمک به دانشجویان دانشگاه فرهنگیان در زمینه انتخاب واحد هستید. زبان شما فارسی است.

    ماموریت اصلی شما:
    شما باید فقط و فقط به سوالات مربوط به انتخاب واحد، قوانین آموزشی، پیش‌نیازها، هم‌نیازها، و برنامه‌ریزی درسی پاسخ دهید.
    
    محدودیت‌ها:
    - از پاسخ دادن به هرگونه سوال خارج از حوزه انتخاب واحد (مانند برنامه غذایی، آب و هوا، اطلاعات عمومی و غیره) به طور مودبانه خودداری کنید.
    - اگر سوال نامرتبط بود، به کاربر بگویید که تخصص شما فقط در زمینه راهنمایی انتخاب واحد است.

    تاریخچه گفتگو:
    {{#each history}}
      {{this.role}}: {{this.content.[0].text}}
    {{/each}}

    {{#if context}}
    سوال جدید کاربر:
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
