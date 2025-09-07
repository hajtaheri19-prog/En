"use client";

import type { SuggestOptimalScheduleOutput } from "@/ai/flows/suggest-optimal-schedule";
import { suggestOptimalSchedule } from "@/ai/flows/suggest-optimal-schedule";
import { COURSES } from "@/lib/mock-data";
import type { Course } from "@/types";
import { useState, useTransition } from "react";
import CourseSelection from "./course-selection";
import ScheduleDisplay from "./schedule-display";
import { useToast } from "@/hooks/use-toast";

export default function CourseScheduler() {
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [instructorPrefs, setInstructorPrefs] = useState<Record<string, string>>({}); // course.id -> instructor.id
  const [scheduleResult, setScheduleResult] = useState<SuggestOptimalScheduleOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSelectCourse = (course: Course) => {
    setSelectedCourses((prev) =>
      prev.some((c) => c.id === course.id)
        ? prev.filter((c) => c.id !== course.id)
        : [...prev, course]
    );
    // Reset instructor pref if course is removed
    if (selectedCourses.some((c) => c.id === course.id)) {
      setInstructorPrefs(prev => {
        const newPrefs = { ...prev };
        delete newPrefs[course.id];
        return newPrefs;
      });
    }
  };

  const handleSetInstructorPref = (courseId: string, instructorId: string) => {
    setInstructorPrefs((prev) => ({ ...prev, [courseId]: instructorId }));
  };

  const handleGenerateSchedule = () => {
    if (selectedCourses.length === 0) {
      toast({
        title: "هیچ درسی انتخاب نشده است",
        description: "لطفاً برای ایجاد برنامه حداقل یک درس را انتخاب کنید.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const input = {
        courseSelections: selectedCourses.map((course) => ({
          courseCode: course.code,
          instructorPreference: instructorPrefs[course.id] ? [instructorPrefs[course.id]] : [],
        })),
        studentId: "S-12345", // Mock data
        term: "پاییز ۱۴۰۳",     // Mock data
      };

      try {
        const result = await suggestOptimalSchedule(input);
        setScheduleResult(result);
      } catch (error) {
        console.error("خطا در ایجاد برنامه:", error);
        toast({
          title: "خطا",
          description: "ایجاد برنامه با شکست مواجه شد. لطفاً دوباره تلاش کنید.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-2 flex flex-col gap-8">
        <CourseSelection
          availableCourses={COURSES}
          selectedCourses={selectedCourses}
          instructorPrefs={instructorPrefs}
          onSelectCourse={handleSelectCourse}
          onSetInstructorPref={handleSetInstructorPref}
          onGenerateSchedule={handleGenerateSchedule}
          isGenerating={isPending}
        />
      </div>
      <div className="lg:col-span-3">
        <ScheduleDisplay scheduleResult={scheduleResult} isLoading={isPending} />
      </div>
    </div>
  );
}
