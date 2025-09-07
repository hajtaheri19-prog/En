"use client";

import type { SuggestOptimalScheduleOutput } from "@/ai/flows/suggest-optimal-schedule";
import { suggestOptimalSchedule } from "@/ai/flows/suggest-optimal-schedule";
import type { Course } from "@/types";
import { useState, useTransition } from "react";
import CourseSelection from "./course-selection";
import ScheduleDisplay from "./schedule-display";
import { useToast } from "@/hooks/use-toast";
import { extractCoursesFromPdf } from "@/ai/flows/extract-courses-from-pdf";
import { AddCourseForm } from "./add-course-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FileUp, ListPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";

export default function CourseScheduler() {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [instructorPrefs, setInstructorPrefs] = useState<Record<string, string>>({}); // course.id -> instructor.id
  const [scheduleResult, setScheduleResult] = useState<SuggestOptimalScheduleOutput | null>(null);
  const [isGenerating, startTransition] = useTransition();
  const [isExtracting, startExtractingTransition] = useTransition();
  const { toast } = useToast();

  const handleAddCourse = (newCourse: Omit<Course, "id">) => {
    const courseWithId = { ...newCourse, id: `${newCourse.code}-${Math.random()}` };
    setAvailableCourses(prev => [...prev, courseWithId]);
    toast({
      title: "درس جدید اضافه شد",
      description: `درس "${newCourse.name}" به لیست دروس موجود اضافه شد.`,
    });
  };

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

  const handlePdfUpload = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const pdfDataUri = reader.result as string;
      startExtractingTransition(async () => {
        try {
          const result = await extractCoursesFromPdf({ pdfDataUri });
          // Prevent duplicates by checking course code
          const newCourses = result.courses.filter(
            (newCourse) => !availableCourses.some((existing) => existing.code === newCourse.code)
          );
          setAvailableCourses(prev => [...prev, ...newCourses]);
          toast({
            title: "استخراج موفق",
            description: `${result.courses.length} درس از فایل PDF استخراج شد.`,
          });
        } catch (error) {
          console.error("خطا در استخراج PDF:", error);
          toast({
            title: "خطا در استخراج",
            description: "پردازش فایل PDF با شکست مواجه شد. لطفاً فایل دیگری را امتحان کنید.",
            variant: "destructive",
          });
        }
      });
    };
    reader.onerror = (error) => {
      console.error("خطا در خواندن فایل:", error);
      toast({
        title: "خطا در فایل",
        description: "خواندن فایل آپلود شده با شکست مواجه شد.",
        variant: "destructive",
      });
    };
  };
  
  const handleRemoveCourse = (courseId: string) => {
    setAvailableCourses(prev => prev.filter(c => c.id !== courseId));
    setSelectedCourses(prev => prev.filter(c => c.id !== courseId));
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-2 flex flex-col gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>افزودن دروس</CardTitle>
            <CardDescription>دروس را به صورت دستی یا با آپلود فایل PDF اضافه کنید.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual"><ListPlus className="ml-2" /> دستی</TabsTrigger>
                <TabsTrigger value="pdf"><FileUp className="ml-2" /> فایل PDF</TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="pt-4">
                <AddCourseForm onAddCourse={handleAddCourse} isExtracting={isExtracting} />
              </TabsContent>
              <TabsContent value="pdf" className="pt-4">
                 <CourseSelection
                    availableCourses={availableCourses}
                    selectedCourses={selectedCourses}
                    instructorPrefs={instructorPrefs}
                    onSelectCourse={handleSelectCourse}
                    onSetInstructorPref={handleSetInstructorPref}
                    onGenerateSchedule={handleGenerateSchedule}
                    onPdfUpload={handlePdfUpload}
                    onRemoveCourse={handleRemoveCourse}
                    isGenerating={isGenerating}
                    isExtracting={isExtracting}
                  />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        <ScheduleDisplay scheduleResult={scheduleResult} isLoading={isGenerating} />
      </div>
    </div>
  );
}
