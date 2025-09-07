"use client";

import type { Course } from "@/types";
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";
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
  isGenerating: boolean;
}

export default function CourseSelection({
  availableCourses,
  selectedCourses,
  instructorPrefs,
  onSelectCourse,
  onSetInstructorPref,
  onGenerateSchedule,
  isGenerating,
}: CourseSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCourses = useMemo(() => {
    return availableCourses.filter((course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCourses, searchTerm]);

  const isCourseSelected = (courseId: string) =>
    selectedCourses.some((c) => c.id === courseId);

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <BookOpen className="text-primary" />
            دروس موجود
          </CardTitle>
          <CardDescription>
            دروس را جستجو و به انتخاب خود اضافه کنید.
          </CardDescription>
          <Input
            placeholder="جستجو بر اساس نام یا کد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-2"
          />
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
              disabled={isGenerating}
            >
              <Sparkles className="ml-2 h-4 w-4" />
              {isGenerating ? "در حال ایجاد..." : "ایجاد برنامه بهینه"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
