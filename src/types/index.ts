export interface Instructor {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructors: Instructor[];
  category: "عمومی" | "تخصصی" | "تربیتی" | "فرهنگی";
  timeslots: string[]; // e.g., ["شنبه 10:00-12:00", "دوشنبه 10:00-12:00"]
  locations: string[]; // e.g., ["کلاس ۱۰۱", "کلاس ۱۰۲"]
  group?: string; // e.g., "گروه 5"
}

export interface StudentPreferences {
    preferDayOff?: string;
    shiftPreference?: "больше-утром" | "больше-днем" | "меньше-утром" | "меньше-днем" | "";
    instructorPreferences: {
        courseCode: string;
        instructorId: string;
    }[];
}

export interface TimeSlot {
    id: string;
    name: string;
    start: string; // "HH:mm"
    end: string; // "HH:mm"
}

export interface CourseGroup {
    id: string;
    name: string;
}

    