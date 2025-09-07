import type { Course, Instructor } from "@/types";

export const INSTRUCTORS: Record<string, Instructor> = {
  "ahmadi": { id: "دکتر-احمدی", name: "دکتر احمدی" },
  "rezaei": { id: "دکتر-رضایی", name: "دکتر رضایی" },
  "hashemi": { id: "دکتر-هاشمی", name: "دکتر هاشمی" },
  "moradi": { id: "دکتر-مرادی", name: "دکتر مرادی" },
  "safari": { id: "دکتر-صفری", name: "دکتر صفری" },
  "nikzad": { id: "دکتر-نیکزاد", name: "دکتر نیکزاد" },
  "ebadi": { id: "دکتر-عبادی", name: "دکتر عبادی" },
  "karimi": { id: "دکتر-کریمی", name: "دکتر کریمی" },
};

// This is now empty by default, user adds courses manually or via PDF.
export const COURSES: Course[] = [];
