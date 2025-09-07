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
  timeslot: string; // e.g., "شنبه 10:00-12:00"
  location: string; // e.g., "کلاس ۱۰۱"
}
