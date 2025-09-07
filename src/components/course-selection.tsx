"use client";

import type { Course } from "@/types";
import {
  BookPlus,
  FileUp,
  Loader2,
  PlusCircle,
  Sparkles,
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
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";

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
      // Reset file input to allow re-uploading the same file
      event.target.value = "";
    }
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <BookPlus className="text-primary" />
            افزودن دروس
          </CardTitle>
          <CardDescription>
            دروس را از طریق فایل PDF اضافه کنید یا آن‌ها را جستجو کنید.
          </CardDescription>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="جستجو در دروس اضافه‌شده..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
              disabled={isExtracting || availableCourses.length === 0}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={isExtracting}
              aria-label="آپلود PDF"
            >
              {isExtracting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              <span className="mr-2 hidden sm:inline">آپلود PDF</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="application/pdf"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {availableCourses.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                    <FileUp className="h-10 w-10 mb-4" />
                    <h3 className="font-semibold mb-1">لیست دروس خالی است</h3>
                    <p className="text-sm">برای شروع، لطفاً فایل PDF برنامه درسی خود را آپلود کنید.</p>
                 </div>
            ) : (
                <div className="space-y-2">
                {filteredCourses.map((course) => (
                    <div
                    key={course.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
                    >
                    <div className="flex-1">
                        <p className="font-semibold">{course.name}</p>
                        <p className="text-sm text-muted-foreground">
                        {course.code}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={isCourseSelected(course.id) ? "secondary" : "default"}
                            size="sm"
                            onClick={() => onSelectCourse(course)}
                            disabled={isExtracting}
                        >
                            {isCourseSelected(course.id) ? "حذف از انتخاب‌ها" : "افزودن به انتخاب‌ها"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveCourse(course.id)}
                            aria-label={`حذف کامل درس ${course.name}`}
                            className="text-muted-foreground hover:text-destructive"
                            disabled={isExtracting}
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
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Users className="text-primary" />
            انتخاب‌ها و اولویت‌های من
          </CardTitle>
          <CardDescription>
            برای هر درس، استاد مورد نظر خود را اولویت‌بندی کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <p className="text-center text-muted-foreground py-8">
              هنوز درسی برای انتخاب اضافه نکرده‌اید.
            </p>
          )}
        </CardContent>
        {selectedCourses.length > 0 && (
          <CardFooter>
            <Button
              className="w-full"
              onClick={onGenerateSchedule}
              disabled={isGenerating || isExtracting}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
