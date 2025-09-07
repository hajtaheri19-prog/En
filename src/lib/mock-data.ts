import type { Course, Instructor } from "@/types";

export const INSTRUCTORS: Record<string, Instructor> = {
  "ahmadi": { id: "Dr. Ahmadi", name: "Dr. Ahmadi" },
  "rezaei": { id: "Dr. Rezaei", name: "Dr. Rezaei" },
  "hashemi": { id: "Dr. Hashemi", name: "Dr. Hashemi" },
  "moradi": { id: "Dr. Moradi", name: "Dr. Moradi" },
  "safari": { id: "Dr. Safari", name: "Dr. Safari" },
  "nikzad": { id: "Dr. Nikzad", name: "Dr. Nikzad" },
  "ebadi": { id: "Dr. Ebadi", name: "Dr. Ebadi" },
  "karimi": { id: "Dr. Karimi", name: "Dr. Karimi" },
};

export const COURSES: Course[] = [
  {
    id: "cs101",
    code: "CS101",
    name: "Introduction to Computer Science",
    category: "Specialized",
    instructors: [INSTRUCTORS["ahmadi"], INSTRUCTORS["rezaei"]],
  },
  {
    id: "ma101",
    code: "MA101",
    name: "Calculus I",
    category: "Specialized",
    instructors: [INSTRUCTORS["hashemi"], INSTRUCTORS["moradi"]],
  },
  {
    id: "ph101",
    code: "PH101",
    name: "General Physics",
    category: "Specialized",
    instructors: [INSTRUCTORS["safari"], INSTRUCTORS["rezaei"]],
  },
  {
    id: "pe101",
    code: "PE101",
    name: "Persian Literature",
    category: "General",
    instructors: [INSTRUCTORS["nikzad"]],
  },
  {
    id: "ed201",
    code: "ED201",
    name: "Educational Psychology",
    category: "Educational",
    instructors: [INSTRUCTORS["ebadi"], INSTRUCTORS["karimi"]],
  },
  {
    id: "cu301",
    code: "CU301",
    name: "Islamic Culture and Civilization",
    category: "Cultural",
    instructors: [INSTRUCTORS["hashemi"]],
  },
  {
    id: "cs202",
    code: "CS202",
    name: "Data Structures",
    category: "Specialized",
    instructors: [INSTRUCTORS["ahmadi"]],
  },
  {
    id: "ed205",
    code: "ED205",
    name: "Teaching Methods",
    category: "Educational",
    instructors: [INSTRUCTORS["karimi"], INSTRUCTORS["ebadi"]],
  },
];
