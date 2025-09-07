"use client";

import type { Course } from "@/types";
import {
  BookOpen,
  FileUp,
  Loader2,
  PlusCircle,
  Sparkles,
  Trash2,
  Users,
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
    }
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <BookOpen className="text-primary" />
            دروس موجود
          </CardTitle>
          <CardDescription>
            دروس را جستجو کرده یا از طریق فایل PDF اضافه کنید.
          </CardDescription>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="جستجو بر اساس نام یا کد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
              disabled={isExtracting}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={isExtracting}
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
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50"
                >
                  <div>
                    <p className="font-semibold">{course.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.code}
                    </p>
                  </div>
                  <Button
                    variant={isCourseSelected(course.id) ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => onSelectCourse(course)}
                    disabled={isExtracting}
                  >
                    {isCourseSelected(course.id) ? "انتخاب شد" : "افزودن"}
                  </Button>
                </div>
              ))}
            </div>
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
                      aria-label={`حذف ${course.name}`}
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
              هنوز درسی انتخاب نشده است.
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
