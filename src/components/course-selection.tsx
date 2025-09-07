"use client";

import type { Course } from "@/types";
import {
  FileUp,
  Loader2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Sparkles } from "lucide-react";


interface CourseSelectionProps {
  availableCourses: Course[];
  selectedCourses: Course[];
  instructorPrefs: Record<string, string>;
  onSelectCourse: (course: Course) => void;
  onSetInstructorPref: (courseId: string, instructorId: string) => void;
  onGenerateSchedule: () => void;
  onPdfUpload: (file: File) => void;
  onRemoveCourse: (courseId: string) => void;
  isGenerating: boolean;
  isExtracting: boolean;
}

export default function CourseSelection({
  availableCourses,
  selectedCourses,
  instructorPrefs,
  onSelectCourse,
  onSetInstructorPref,
  onGenerateSchedule,
  onPdfUpload,
  onRemoveCourse,
  isGenerating,
  isExtracting,
}: CourseSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCourses = useMemo(() => {
    return availableCourses.filter((course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCourses, searchTerm]);

  const isCourseSelected = (courseId: string) =>
    selectedCourses.some((c) => c.id === courseId);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onPdfUpload(file);
      event.target.value = "";
    }
  };

  return (
    <>
      <div className="space-y-4">
        <Input
          placeholder="جستجو در میان دروس اضافه‌شده..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isExtracting || availableCourses.length === 0}
        />
         <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
            disabled={isExtracting}
            aria-label="آپلود PDF"
          >
            {isExtracting ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <FileUp className="h-4 w-4 ml-2" />
            )}
            <span>{isExtracting ? "در حال پردازش..." : "آپلود فایل PDF جدید"}</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="application/pdf"
          />
      </div>
      
      <Separator className="my-6" />

      <div className="space-y-4">
         <h3 className="text-lg font-semibold">لیست دروس موجود</h3>
        <ScrollArea className="h-[250px] pr-4 border rounded-lg">
          {availableCourses.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                  <FileUp className="h-10 w-10 mb-4" />
                  <h3 className="font-semibold mb-1">هنوز درسی اضافه نشده</h3>
                  <p className="text-sm">برای شروع، یک فایل PDF آپلود کنید یا به صورت دستی درس اضافه کنید.</p>
               </div>
          ) : (
              <div className="space-y-2 p-2">
              {filteredCourses.map((course) => (
                  <div
                  key={course.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
                  >
                  <div className="flex-1">
                      <p className="font-semibold">{course.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.code} | {course.timeslot} | {course.location}
                      </p>
                  </div>
                  <div className="flex items-center gap-2">
                      <Button
                          variant={isCourseSelected(course.id) ? "secondary" : "default"}
                          size="sm"
                          onClick={() => onSelectCourse(course)}
                          disabled={isExtracting || isGenerating}
                      >
                          {isCourseSelected(course.id) ? "حذف" : "انتخاب"}
                      </Button>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveCourse(course.id)}
                          aria-label={`حذف کامل درس ${course.name}`}
                          className="text-muted-foreground hover:text-destructive"
                          disabled={isExtracting || isGenerating}
                      >
                          <X className="h-4 w-4" />
                      </Button>
                  </div>
                  </div>
              ))}
               {filteredCourses.length === 0 && searchTerm && (
                  <p className="text-center text-muted-foreground py-8">
                    درسی با این مشخصات یافت نشد.
                  </p>
              )}
              </div>
          )}
        </ScrollArea>
      </div>

      <Separator className="my-6" />

      <Card className="shadow-none border-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="font-headline flex items-center gap-2 text-lg">
            <Users className="text-primary" />
            دروس انتخاب‌شده و اولویت‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {selectedCourses.length > 0 ? (
            selectedCourses.map((course, index) => (
              <div key={course.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold">{course.name}</p>
                    <Badge variant="secondary" className="mt-1">{course.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(value) => onSetInstructorPref(course.id, value)}
                      value={instructorPrefs[course.id]}
                      disabled={isGenerating || isExtracting}
                      dir="rtl"
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="انتخاب استاد" />
                      </SelectTrigger>
                      <SelectContent>
                        {course.instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSelectCourse(course)}
                      aria-label={`حذف ${course.name} از انتخاب‌ها`}
                       disabled={isGenerating || isExtracting}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {index < selectedCourses.length - 1 && <Separator className="mt-4" />}
              </div>
            ))
          ) : (
            <Alert variant="default" className="text-center">
                <AlertDescription>
                هنوز درسی برای انتخاب اضافه نکرده‌اید.
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
        {selectedCourses.length > 0 && (
          <CardFooter className="p-0 mt-6">
            <Button
              className="w-full"
              onClick={onGenerateSchedule}
              disabled={isGenerating || isExtracting}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال ایجاد...
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 h-4 w-4" />
                  ایجاد برنامه بهینه
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
