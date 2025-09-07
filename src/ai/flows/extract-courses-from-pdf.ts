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
      "A PDF file of the course schedule, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ExtractCoursesFromPdfInput = z.infer<
  typeof ExtractCoursesFromPdfInputSchema
>;

const ExtractedCourseSchema = z.object({
    id: z.string().describe('یک شناسه منحصر به فرد برای درس، معمولاً ترکیبی از کد درس و یک مقدار تصادفی.'),
    code: z.string().describe('کد درس (مانند "CS101").'),
    name: z.string().describe('نام کامل درس.'),
    instructors: z.array(z.object({
        id: z.string().describe('شناسه منحصر به فرد استاد (از نام استاد به صورت کباب-کیس).'),
        name: z.string().describe('نام استاد.')
    })).describe('لیستی از اساتیدی که این درس را تدریس می‌کنند.'),
    category: z.enum(["عمومی", "تخصصی", "تربیتی", "فرهنگی"]).describe('دسته‌بندی درس.'),
    timeslot: z.string().describe('زمان برگزاری کلاس (مثال: "شنبه 10:00-12:00").'),
    location: z.string().describe('مکان برگزاری کلاس (مثال: "کلاس ۱۰۱").'),
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
  return extractCoursesFlow(input);
}

const extractCoursesPrompt = ai.definePrompt({
  name: 'extractCoursesPrompt',
  input: {schema: ExtractCoursesFromPdfInputSchema},
  output: {schema: ExtractCoursesFromPdfOutputSchema},
  prompt: `شما یک دستیار هوشمند هستید که برای استخراج اطلاعات درسی از یک فایل PDF جدول زمانی دروس دانشگاه طراحی شده‌اید. زبان شما فارسی است.

  فایل PDF زیر را تحلیل کنید و اطلاعات مربوط به هر درس را استخراج کنید. برای هر درس، موارد زیر را مشخص کنید:
  - کد درس (مانند CS101)
  - نام درس (مانند مبانی علوم کامپیوتر)
  - لیست اساتید موجود برای آن درس
  - دسته‌بندی درس به یکی از چهار نوع: "عمومی"، "تخصصی"، "تربیتی"، "فرهنگی"
  - زمان برگزاری کلاس (مثال: "شنبه 10:00-12:00")
  - مکان برگزاری کلاس (مثال: "کلاس ۱۰۱" یا "آنلاین")
  - گروه درسی (مثال: "گروه 5"). اگر درسی به گروه خاصی تعلق ندارد (مثلاً دروس عمومی مشترک)، این فیلد را خالی بگذارید.

  برای هر درس یک شناسه منحصر به فرد (id) ایجاد کنید. برای هر استاد یک شناسه منحصر به فرد (id) با فرمت کباب-کیس (مثلا 'دکتر-احمدی') از روی نام او بسازید.

  PDF برای پردازش: {{media url=pdfDataUri}}

  خروجی را به عنوان یک شیء JSON با ساختار زیر ارائه دهید:
  {
    "courses": [
      {
        "id": "cs101_1",
        "code": "CS101",
        "name": "مبانی علوم کامپیوتر",
        "instructors": [{ "id": "دکتر-احمدی", "name": "دکتر احمدی" }],
        "category": "تخصصی",
        "timeslot": "شنبه 10:00-12:00",
        "location": "کلاس ۱۰۱",
        "group": "گروه 5"
      }
    ]
  }
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
