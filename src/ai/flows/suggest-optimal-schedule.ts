'use server';

/**
 * @fileOverview A local algorithm for suggesting an optimal course schedule based on student preferences, available courses, and course groups.
 * This file does NOT use AI and works offline.
 *
 * - suggestOptimalSchedule - A function that generates an optimal course schedule.
 * - SuggestOptimalScheduleInput - The input type for the suggestOptimalSchedule function.
 * - SuggestOptimalScheduleOutput - The return type for the suggestOptimalSchedule function.
 */

import {z} from 'genkit';

const CourseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  instructors: z.array(z.object({ id: z.string(), name: z.string() })),
  category: z.enum(["عمومی", "تخصصی", "تربیتی", "فرهنگی"]),
  timeslots: z.array(z.string()),
  locations: z.array(z.string()),
  group: z.string().optional(),
});

const SuggestOptimalScheduleInputSchema = z.object({
  availableCourses: z.array(CourseSchema).describe('لیست تمام دروس موجود که از PDF استخراج شده یا دستی وارد شده‌اند.'),
  studentPreferences: z.object({
    preferDayOff: z.string().optional().describe('روز هفته‌ای که دانشجو ترجیح می‌دهد خالی باشد (مثال: چهارشنبه).'),
    shiftPreference: z.enum(["больше-утром", "больше-днем", "меньше-утром", "меньше-днем", ""]).optional().describe('ترجیح دانشجو برای شیفت کلاس‌ها. صبح از ساعت ۷ تا ۱۲ و عصر از ۱۲ به بعد است.'),
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
        timeslot: z.union([z.string(), z.array(z.string())]).describe('بازه زمانی برای درس.'),
        location: z.union([z.string(), z.array(z.string())]).describe('مکان برگزاری کلاس.'),
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


type TimeBlock = { start: number; end: number; courseCode: string };

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const parseTimeslot = (timeslot: string): { day: string; start: number; end: number } | null => {
    const parts = timeslot.trim().split(/\s+/);
    if (parts.length < 2) return null;
    const day = parts[0];
    const [startTime, endTime] = parts[1].split('-');
    if (!startTime || !endTime) return null;
    return { day, start: timeToMinutes(startTime), end: timeToMinutes(endTime) };
};

const doTimeslotsConflict = (ts1: string, ts2: string): boolean => {
    const parsed1 = parseTimeslot(ts1);
    const parsed2 = parseTimeslot(ts2);
    if (!parsed1 || !parsed2 || parsed1.day !== parsed2.day) {
        return false;
    }
    return parsed1.start < parsed2.end && parsed1.end > parsed2.start;
};

const checkConflicts = (courses: z.infer<typeof CourseSchema>[]): boolean => {
    for (let i = 0; i < courses.length; i++) {
        for (let j = i + 1; j < courses.length; j++) {
            for (const ts1 of courses[i].timeslots) {
                for (const ts2 of courses[j].timeslots) {
                    if (doTimeslotsConflict(ts1, ts2)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
};

export async function suggestOptimalSchedule(
  input: SuggestOptimalScheduleInput
): Promise<SuggestOptimalScheduleOutput> {
  const { availableCourses, studentPreferences } = input;

  const courseGroups: Record<string, z.infer<typeof CourseSchema>[]> = {};
  const generalCourses: z.infer<typeof CourseSchema>[] = [];

  availableCourses.forEach(course => {
    if (course.category === 'عمومی') {
      generalCourses.push(course);
    } else if (course.group) {
      if (!courseGroups[course.group]) {
        courseGroups[course.group] = [];
      }
      courseGroups[course.group].push(course);
    }
  });

  if (Object.keys(courseGroups).length === 0) {
    // Handle case with no specialized groups, just general courses
    let finalSchedule: z.infer<typeof CourseSchema>[] = [];
    let conflicts: string[] = [];

    // Prioritize preferred instructors for general courses
    const instructorPrefCourses = studentPreferences.instructorPreferences.map(pref => {
        return generalCourses.find(c => c.code === pref.courseCode && c.instructors.some(i => i.id === pref.instructorId));
    }).filter((c): c is z.infer<typeof CourseSchema> => !!c);

    for (const course of instructorPrefCourses) {
        if (!checkConflicts([...finalSchedule, course])) {
            finalSchedule.push(course);
        }
    }
    
    return {
        schedule: finalSchedule.map(c => ({
            courseCode: c.code,
            courseName: c.name,
            instructor: c.instructors.map(i => i.name).join(', '),
            timeslot: c.timeslots,
            location: c.locations,
            group: c.group,
        })),
        conflicts,
        rationale: "برنامه فقط بر اساس دروس عمومی و اولویت‌های استاد شما (در صورت وجود) ساخته شده است، زیرا هیچ گروه تخصصی تعریف نشده بود.",
        recommendedGroup: "عمومی"
    };
  }

  let bestGroup: { name: string; score: number; schedule: z.infer<typeof CourseSchema>[]; rationale: string[] } | null = null;

  for (const groupName in courseGroups) {
    const groupCourses = courseGroups[groupName];
    let score = 0;
    let rationale: string[] = [];

    // 1. Check for day off preference
    if (studentPreferences.preferDayOff) {
      const hasClassOnDayOff = groupCourses.some(c => c.timeslots.some(ts => ts.startsWith(studentPreferences.preferDayOff!)));
      if (!hasClassOnDayOff) {
        score += 100; // High score for respecting day off
        rationale.push(`روز ${studentPreferences.preferDayOff} کاملاً خالی است.`);
      } else {
        score -= 50;
        rationale.push(`متاسفانه در روز ${studentPreferences.preferDayOff} کلاس وجود دارد.`);
      }
    }

    // 2. Check for shift preference
    if (studentPreferences.shiftPreference) {
        const morningSlots = groupCourses.flatMap(c => c.timeslots).filter(ts => {
            const parsed = parseTimeslot(ts);
            return parsed ? parsed.end <= 720 : false; // 12:00 PM
        }).length;
        const afternoonSlots = groupCourses.flatMap(c => c.timeslots).length - morningSlots;
        
        if (studentPreferences.shiftPreference === "больше-утром" && morningSlots >= afternoonSlots) {
             score += 50;
             rationale.push("بیشتر کلاس‌ها در شیفت صبح قرار دارند.");
        } else if (studentPreferences.shiftPreference === "больше-днем" && afternoonSlots >= morningSlots) {
            score += 50;
            rationale.push("بیشتر کلاس‌ها در شیفت عصر قرار دارند.");
        } else if (studentPreferences.shiftPreference === "меньше-утром" && morningSlots === 0) {
            score += 50;
            rationale.push("هیچ کلاسی در شیفت صبح قرار ندارد.");
        } else if (studentPreferences.shiftPreference === "меньше-днем" && afternoonSlots === 0) {
            score += 50;
            rationale.push("هیچ کلاسی در شیفت عصر قرار ندارد.");
        }
    }
    
    // 3. Compactness (bonus) - Lower score for more gaps
    // This is a complex calculation, simplified here
    const totalHours = groupCourses.length;
    score -= totalHours * 2; // Penalize for more hours in general to prefer lighter schedules if possible
    rationale.push("تعداد واحدهای گروه در امتیاز نهایی لحاظ شد.");


    if (!bestGroup || score > bestGroup.score) {
      bestGroup = { name: groupName, score, schedule: groupCourses, rationale };
    }
  }

  if (!bestGroup) {
    // Fallback: pick the first group if no logic could decide
    const firstGroupName = Object.keys(courseGroups)[0];
    bestGroup = { name: firstGroupName, score: 0, schedule: courseGroups[firstGroupName], rationale: ["هیچ گروهی برتری خاصی نداشت، اولین گروه انتخاب شد."] };
  }

  // Add general courses to the best group schedule
  let finalSchedule = [...bestGroup.schedule];
  let conflicts: string[] = [];
  
  const preferredGeneralCourses = studentPreferences.instructorPreferences
    .map(pref => generalCourses.find(c => c.code === pref.courseCode && c.instructors.some(i => i.id === pref.instructorId)))
    .filter((c): c is z.infer<typeof CourseSchema> => !!c);
    
  const otherGeneralCourses = generalCourses.filter(c => !preferredGeneralCourses.includes(c));

  // Try to add preferred general courses first
  for (const course of preferredGeneralCourses) {
    if (!checkConflicts([...finalSchedule, course])) {
      finalSchedule.push(course);
       bestGroup.rationale.push(`درس عمومی ${course.name} با استاد ترجیحی شما (${course.instructors[0].name}) بدون تداخل اضافه شد.`);
    } else {
      conflicts.push(`${course.name} (${course.code})`);
    }
  }

  // Try to add other general courses
  for (const course of otherGeneralCourses) {
     if (!checkConflicts([...finalSchedule, course])) {
      finalSchedule.push(course);
    } else {
       if (!conflicts.includes(`${course.name} (${course.code})`)) {
         conflicts.push(`${course.name} (${course.code})`);
       }
    }
  }
  
  // Sort schedule by day and time for better presentation
  finalSchedule.sort((a, b) => {
    const dayOrder = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
    const tsA = parseTimeslot(a.timeslots[0]);
    const tsB = parseTimeslot(b.timeslots[0]);
    if (!tsA || !tsB) return 0;
    if (dayOrder.indexOf(tsA.day) !== dayOrder.indexOf(tsB.day)) {
        return dayOrder.indexOf(tsA.day) - dayOrder.indexOf(tsB.day);
    }
    return tsA.start - tsB.start;
  });

  return {
    recommendedGroup: bestGroup.name,
    schedule: finalSchedule.map(c => ({
        courseCode: c.code,
        courseName: c.name,
        instructor: c.instructors.map(i => i.name).join(', '),
        timeslot: c.timeslots,
        location: c.locations,
        group: c.group,
    })),
    conflicts,
    rationale: `گروه ${bestGroup.name} انتخاب شد زیرا: ${bestGroup.rationale.join(' ')}`,
  };
}
