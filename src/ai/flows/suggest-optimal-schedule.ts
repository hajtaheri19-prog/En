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
        courseCode: z.string().describe('The code of the selected course.'),
        instructorPreference: z
          .array(z.string())
          .describe(
            'An array of instructor IDs, ordered by preference (most preferred first).'
          ),
      })
    )
    .describe(
      'An array of course selections, each including course code and instructor preferences.'
    ),
  studentId: z.string().describe('The ID of the student.'),
  term: z.string().describe('The academic term (e.g., Fall 2024).'),
});
export type SuggestOptimalScheduleInput = z.infer<
  typeof SuggestOptimalScheduleInputSchema
>;

const SuggestOptimalScheduleOutputSchema = z.object({
  schedule: z
    .array(
      z.object({
        courseCode: z.string().describe('The code of the scheduled course.'),
        instructor: z.string().describe('The assigned instructor ID.'),
        timeslot: z.string().describe('The timeslot for the course.'),
      })
    )
    .describe('The generated optimal course schedule.'),
  conflicts: z
    .array(z.string())
    .describe(
      'An array of course codes that could not be scheduled due to conflicts.'
    ),
  rationale: z
    .string()
    .describe(
      'A human-readable explanation of why this schedule was chosen as optimal.'
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
  prompt: `You are an AI assistant designed to generate optimal course schedules for university students.

  Consider the following course selections and instructor preferences:
  {{#each courseSelections}}
  - Course Code: {{this.courseCode}}, Instructor Preferences: {{this.instructorPreference}}
  {{/each}}

  Student ID: {{{studentId}}}
  Term: {{{term}}}

  Generate an optimal course schedule, avoiding any time conflicts and respecting instructor preferences as much as possible.

  Output the schedule as a JSON object with the following structure:
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
