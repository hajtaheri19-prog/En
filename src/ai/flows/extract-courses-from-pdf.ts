'use server';

/**
 * @fileOverview An AI agent for extracting course information from a PDF document.
 *
 * - extractCoursesFromPdf - A function that handles the course extraction process.
 * - ExtractCoursesFromPdfInput - The input type for the extractCoursesFromPdf function.
 * - ExtractCoursesFromPdfOutput - The return type for the extractCoursesFromPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractCoursesFromPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file of the course schedule, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'"
    ),
});
export type ExtractCoursesFromPdfInput = z.infer<
  typeof ExtractCoursesFromPdfInputSchema
>;

const ExtractedCourseSchema = z.object({
    code: z.string().describe('کد درس (مانند "CS101").'),
    name: z.string().describe('نام کامل درس.'),
    instructorName: z.string().describe('نام استاد.'),
    category: z.enum(["عمومی", "تخصصی", "تربیتی", "فرهنگی"]).describe('دسته‌بندی درس.'),
    timeslots: z.array(z.string()).describe('آرایه‌ای از زمان‌های برگزاری کلاس (مثال: ["شنبه 10:00-12:00", "دوشنبه 10:00-12:00"]).'),
    locations: z.array(z.string()).optional().describe('آرایه‌ای از مکان‌های برگزاری کلاس (مثال: ["کلاس ۱۰۱", "کلاس ۱۰۲"]). اگر مکان مشخص نیست، این فیلد را خالی بگذارید.'),
    group: z.string().optional().describe('شماره گروه درس (مثال: "گروه 5"). اگر درسی گروه مشخصی ندارد، این فیلد را خالی بگذارید.'),
});

const ExtractCoursesFromPdfOutputSchema = z.object({
  courses: z.array(ExtractedCourseSchema).describe('آرایه‌ای از دروس استخراج شده از PDF.')
});

export type ExtractCoursesFromPdfOutput = z.infer<
  typeof ExtractCoursesFromPdfOutputSchema
>;

export async function extractCoursesFromPdf(
  input: ExtractCoursesFromPdfInput
): Promise<ExtractCoursesFromPdfOutput> {
  const result = await extractCoursesFlow(input);
  // Post-processing to add consistent IDs
  const coursesWithIds = result.courses.map(course => {
    const instructorId = course.instructorName.replace(/\s+/g, '-').toLowerCase();
    const courseId = `${course.code}-${course.group || 'X'}-${Math.random().toString(36).substring(7)}`;
    
    // Ensure locations array matches timeslots array length
    const locations = course.locations || [];
    while (locations.length < course.timeslots.length) {
      locations.push("مشخص نشده");
    }

    return {
      ...course,
      id: courseId,
      instructors: [{ id: instructorId, name: course.instructorName }],
      locations: locations,
    };
  });
  return { courses: coursesWithIds as any };
}

const extractCoursesPrompt = ai.definePrompt({
  name: 'extractCoursesPrompt',
  input: {schema: ExtractCoursesFromPdfInputSchema},
  output: {schema: ExtractCoursesFromPdfOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are an intelligent assistant designed to extract course information from a university course schedule PDF. Your language is Persian.

  Analyze the following PDF and extract the information for each course. For each course, specify the following:
  - Course code (e.g., CS101)
  - Full course name (e.g., Fundamentals of Computer Science)
  - Instructor's name
  - Course category, which must be one of: "عمومی" (General), "تخصصی" (Specialized), "تربیتی" (Educational), "فرهنگی" (Cultural)
  - An array of class times (e.g., ["Saturday 10:00-12:00", "Monday 10:00-12:00"]). If a course is held on two different days, include both times in the array.
  - An array of class locations (e.g., ["Class 101", "Class 102"]). The number of locations must match the number of times. If location is not specified, leave the array empty.
  - Course group (e.g., "Group 5"). If a course does not belong to a specific group (e.g., a common general course), leave this field empty.

  PDF to process: {{media url=pdfDataUri}}
  `,
});

const extractCoursesFlow = ai.defineFlow(
  {
    name: 'extractCoursesFlow',
    inputSchema: ExtractCoursesFromPdfInputSchema,
    outputSchema: ExtractCoursesFromPdfOutputSchema,
  },
  async input => {
    const {output} = await extractCoursesPrompt(input);
    return output!;
  }
);
