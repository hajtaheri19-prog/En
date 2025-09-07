export interface Instructor {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructors: Instructor[];
  category: "General" | "Specialized" | "Educational" | "Cultural";
}
