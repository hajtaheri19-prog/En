import type { Course, Instructor } from "@/types";

export const INSTRUCTORS: Record<string, Instructor> = {
  "ahmadi": { id: "دکتر احمدی", name: "دکتر احمدی" },
  "rezaei": { id: "دکتر رضایی", name: "دکتر رضایی" },
  "hashemi": { id: "دکتر هاشمی", name: "دکتر هاشمی" },
  "moradi": { id: "دکتر مرادی", name: "دکتر مرادی" },
  "safari": { id: "دکتر صفری", name: "دکتر صفری" },
  "nikzad": { id: "دکتر نیکزاد", name: "دکتر نیکزاد" },
  "ebadi": { id: "دکتر عبادی", name: "دکتر عبادی" },
  "karimi": { id: "دکتر کریمی", name: "دکتر کریمی" },
};

export const COURSES: Course[] = [
  {
    id: "cs101",
    code: "CS101",
    name: "مبانی علوم کامپیوتر",
    category: "تخصصی",
    instructors: [INSTRUCTORS["ahmadi"], INSTRUCTORS["rezaei"]],
  },
  {
    id: "ma101",
    code: "MA101",
    name: "حسابان ۱",
    category: "تخصصی",
    instructors: [INSTRUCTORS["hashemi"], INSTRUCTORS["moradi"]],
  },
  {
    id: "ph101",
    code: "PH101",
    name: "فیزیک عمومی",
    category: "تخصصی",
    instructors: [INSTRUCTORS["safari"], INSTRUCTORS["rezaei"]],
  },
  {
    id: "pe101",
    code: "PE101",
    name: "ادبیات فارسی",
    category: "عمومی",
    instructors: [INSTRUCTORS["nikzad"]],
  },
  {
    id: "ed201",
    code: "ED201",
    name: "روانشناسی تربیتی",
    category: "تربیتی",
    instructors: [INSTRUCTORS["ebadi"], INSTRUCTORS["karimi"]],
  },
  {
    id: "cu301",
    code: "CU301",
    name: "فرهنگ و تمدن اسلامی",
    category: "فرهنگی",
    instructors: [INSTRUCTORS["hashemi"]],
  },
  {
    id: "cs202",
    code: "CS202",
    name: "ساختمان داده‌ها",
    category: "تخصصی",
    instructors: [INSTRUCTORS["ahmadi"]],
  },
  {
    id: "ed205",
    code: "ED205",
    name: "روش‌های تدریس",
    category: "تربیتی",
    instructors: [INSTRUCTORS["karimi"], INSTRUCTORS["ebadi"]],
  },
];
