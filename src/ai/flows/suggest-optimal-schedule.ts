'use server';

/**
 * @fileOverview An AI agent for suggesting an optimal course schedule based on student preferences, available courses, and course groups.
 *
 * - suggestOptimalSchedule - A function that generates an optimal course schedule.
 * - SuggestOptimalScheduleInput - The input type for the suggestOptimalSchedule function.
 * - SuggestOptimalScheduleOutput - The return type for the suggestOptimalSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Full course data needs to be provided now
const CourseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  instructors: z.array(z.object({ id: z.string(), name: z.string() })),
  category: z.enum(["عمومی", "تخصصی", "تربیتی", "فرهنگی"]),
  timeslot: z.string(),
  location: z.string(),
  group: z.string().optional(),
});

const SuggestOptimalScheduleInputSchema = z.object({
  availableCourses: z.array(CourseSchema).describe('لیست تمام دروس موجود که از PDF استخراج شده یا دستی وارد شده‌اند.'),
  studentPreferences: z.object({
    preferDayOff: z.string().optional().describe('روز هفته‌ای که دانشجو ترجیح می‌دهد خالی باشد (مثال: چهارشنبه).'),
    preferMorningClasses: z.boolean().optional().describe('آیا دانشجو کلاس‌های صبح را ترجیح می‌دهد یا بعد از ظهر؟'),
    instructorPreferences: z.array(z.object({
      courseCode: z.string().describe('کد درس عمومی.'),
      instructorId: z.string().describe('شناسه استاد ترجیحی برای این درس عمومی.')
    })).describe('لیست اولویت‌های استاد برای دروس عمومی که می‌توان از بین گروه‌های مختلف انتخاب کرد.')
  }),
  studentId: z.string().describe('شناسه دانشجو.'),
  term: z.string().describe('ترم تحصیلی (مثلاً، پاییز ۱۴۰۳).'),
});

export type SuggestOptimalScheduleInput = z.infer<
  typeof SuggestOptimalScheduleInputSchema
>;

const SuggestOptimalScheduleOutputSchema = z.object({
  recommendedGroup: z.string().optional().describe('گروه درسی که به عنوان بهینه پیشنهاد شده است.'),
  schedule: z
    .array(
      z.object({
        courseCode: z.string().describe('کد درس برنامه‌ریزی شده.'),
        courseName: z.string().describe('نام درس برنامه‌ریزی شده.'),
        instructor: z.string().describe('نام استاد تخصیص داده شده.'),
        timeslot: z.string().describe('بازه زمانی برای درس.'),
        location: z.string().describe('مکان برگزاری کلاس.'),
        group: z.string().optional().describe('گروه درس.')
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
      'توضیحی قابل خواندن برای انسان در مورد اینکه چرا این برنامه (و این گروه) به عنوان بهینه انتخاب شده است.'
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
  prompt: `شما یک دستیار هوش مصنوعی بسیار پیشرفته برای برنامه‌ریزی درسی در دانشگاه فرهنگیان هستید. وظیفه شما تحلیل تمام گروه‌های درسی موجود و پیشنهاد بهترین گزینه بر اساس اولویت‌های دانشجو است. زبان شما فارسی است.

  قوانین اصلی:
  1. دانشجو باید تمام دروس تخصصی، تربیتی و فرهنگی خود را از **یک گروه واحد** بردارد.
  2. دروس "عمومی" را می‌توان خارج از گروه اصلی و از بین تمام گزینه‌های موجود انتخاب کرد، به شرطی که تداخل زمانی نداشته باشند.

  اطلاعات ورودی:
  - **تمام دروس موجود**:
    {{#each availableCourses}}
    - {{this.name}} ({{this.code}}), گروه: {{this.group}}, زمان: {{this.timeslot}}, استاد: {{#each this.instructors}}{{this.name}}{{/each}}
    {{/each}}
  - **اولویت‌های دانشجو**:
    - روز تعطیل دلخواه: {{studentPreferences.preferDayOff}}
    - ترجیح کلاس‌های صبح: {{studentPreferences.preferMorningClasses}}
    - اولویت استاد برای دروس عمومی:
      {{#each studentPreferences.instructorPreferences}}
      - درس {{this.courseCode}} با استاد {{this.instructorId}}
      {{/each}}

  **وظیفه شما:**
  1.  **تحلیل گروه‌ها:** تمام گروه‌های درسی موجود (مثلاً گروه ۱، گروه ۲ و ...) را بررسی کنید.
  2.  **انتخاب بهترین گروه:** گروهی را انتخاب کنید که بیشترین تطابق را با اولویت‌های دانشجو دارد (روز خالی، ترجیح صبح/عصر).
  3.  **اضافه کردن دروس عمومی:** بهترین گزینه از دروس عمومی را (بر اساس اولویت استاد و عدم تداخل زمانی) به برنامه گروه منتخب اضافه کنید.
  4.  **ایجاد برنامه نهایی:** یک برنامه کامل و بدون تداخل ایجاد کنید.
  5.  **ارائه خروجی:** خروجی را در قالب یک شیء JSON با ساختار مشخص شده ارائه دهید. حتماً \'recommendedGroup\' و \'rationale\' (دلیل انتخاب) را پر کنید.

  مثال برای \'rationale\': "گروه ۵ انتخاب شد زیرا روز چهارشنبه کاملاً خالی است و بیشتر کلاس‌ها در نوبت صبح برگزار می‌شوند که با اولویت شما مطابقت دارد. همچنین، درس عمومی معارف اسلامی با استاد ترجیحی شما، دکتر احمدی، بدون تداخل زمانی به برنامه اضافه شد."
  `,
});

const suggestOptimalScheduleFlow = ai.defineFlow(
  {
    name: 'suggestOptimalScheduleFlow',
    inputSchema: SuggestOptimalScheduleInputSchema,
    outputSchema: SuggestOptimalScheduleOutputSchema,
  },
  async input => {
    // Here you could add more complex logic to pre-process courses or groups if needed.
    const {output} = await suggestOptimalSchedulePrompt(input);
    return output!;
  }
);
