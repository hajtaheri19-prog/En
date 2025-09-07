'use server';

/**
 * @fileOverview An AI agent for suggesting an optimal course schedule based on student preferences and course data.
 *
 * - suggestOptimalSchedule - A function that generates an optimal course schedule.
 * - SuggestOptimalScheduleInput - The input type for the suggestOptimalSchedule function.
 * - SuggestOptimalScheduleOutput - The return type for the suggestOptimalSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalScheduleInputSchema = z.object({
  courseSelections: z
    .array(
      z.object({
        courseCode: z.string().describe('کد درس انتخاب شده.'),
        instructorPreference: z
          .array(z.string())
          .describe(
            'آرایه‌ای از شناسه‌های اساتید، به ترتیب اولویت (از بیشترین اولویت به کمترین).'
          ),
      })
    )
    .describe(
      'آرایه‌ای از انتخاب‌های دروس، هر کدام شامل کد درس و اولویت‌های استاد.'
    ),
  studentId: z.string().describe('شناسه دانشجو.'),
  term: z.string().describe('ترم تحصیلی (مثلاً، پاییز ۱۴۰۳).'),
});
export type SuggestOptimalScheduleInput = z.infer<
  typeof SuggestOptimalScheduleInputSchema
>;

const SuggestOptimalScheduleOutputSchema = z.object({
  schedule: z
    .array(
      z.object({
        courseCode: z.string().describe('کد درس برنامه‌ریزی شده.'),
        instructor: z.string().describe('شناسه استاد تخصیص داده شده.'),
        timeslot: z.string().describe('بازه زمانی برای درس.'),
      })
    )
    .describe('برنامه درسی بهینه تولید شده.'),
  conflicts: z
    .array(z.string())
    .describe(
      'آرایه‌ای از کدهای دروسی که به دلیل تداخل قابل برنامه‌ریزی نبوده‌اند.'
    ),
  rationale: z
    .string()
    .describe(
      'توضیحی قابل خواندن برای انسان در مورد اینکه چرا این برنامه به عنوان بهینه انتخاب شده است.'
    ),
});
export type SuggestOptimalScheduleOutput = z.infer<
  typeof SuggestOptimalScheduleOutputSchema
>;

export async function suggestOptimalSchedule(
  input: SuggestOptimalScheduleInput
): Promise<SuggestOptimalScheduleOutput> {
  return suggestOptimalScheduleFlow(input);
}

const suggestOptimalSchedulePrompt = ai.definePrompt({
  name: 'suggestOptimalSchedulePrompt',
  input: {schema: SuggestOptimalScheduleInputSchema},
  output: {schema: SuggestOptimalScheduleOutputSchema},
  prompt: `شما یک دستیار هوش مصنوعی هستید که برای ایجاد برنامه‌های درسی بهینه برای دانشجویان دانشگاه طراحی شده‌اید. زبان شما فارسی است.

  انتخاب‌های دروس و اولویت‌های اساتید زیر را در نظر بگیرید:
  {{#each courseSelections}}
  - کد درس: {{this.courseCode}}، اولویت‌های استاد: {{this.instructorPreference}}
  {{/each}}

  شناسه دانشجو: {{{studentId}}}
  ترم: {{{term}}}

  یک برنامه درسی بهینه ایجاد کنید، از هرگونه تداخل زمانی اجتناب کنید و تا حد امکان به اولویت‌های اساتید احترام بگذارید.

  خروجی برنامه را به عنوان یک شیء JSON با ساختار زیر ارائه دهید:
  {
    "schedule": [
      {
        "courseCode": "",
        "instructor": "",
        "timeslot": ""
      }
    ],
    "conflicts": [""],
    "rationale": ""
  }
  `,
});

const suggestOptimalScheduleFlow = ai.defineFlow(
  {
    name: 'suggestOptimalScheduleFlow',
    inputSchema: SuggestOptimalScheduleInputSchema,
    outputSchema: SuggestOptimalScheduleOutputSchema,
  },
  async input => {
    const {output} = await suggestOptimalSchedulePrompt(input);
    return output!;
  }
);
