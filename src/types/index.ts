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
}
