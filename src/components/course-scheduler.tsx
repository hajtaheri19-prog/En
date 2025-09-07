"use client";

import type { SuggestOptimalScheduleOutput } from "@/ai/flows/suggest-optimal-schedule";
import { suggestOptimalSchedule } from "@/ai/flows/suggest-optimal-schedule";
import type { Course } from "@/types";
import { useState, useTransition, useMemo, useEffect } from "react";
import CourseSelection from "./course-selection";
import ScheduleDisplay from "./schedule-display";
import { useToast } from "@/hooks/use-toast";
import { extractCoursesFromPdf } from "@/ai/flows/extract-courses-from-pdf";
import { AddCourseForm } from "./add-course-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FileUp, ListPlus, WandSparkles, Trash2, Group, Settings, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import StudentPreferencesForm from "./student-preferences-form";
import type { StudentPreferences } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Input } from "./ui/input";
import { Label } from "./ui/label";


export default function CourseScheduler() {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [studentPreferences, setStudentPreferences] = useState<StudentPreferences>({
      instructorPreferences: [],
  });
  const [scheduleResult, setScheduleResult] = useState<SuggestOptimalScheduleOutput | null>(null);
  const [isProcessing, startProcessingTransition] = useTransition();
  const [apiKey, setApiKey] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      (window as any).__GEMINI_API_KEY__ = storedApiKey;
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini-api-key', apiKey);
    (window as any).__GEMINI_API_KEY__ = apiKey;
    toast({
      title: "کلید API ذخیره شد",
      description: "کلید API شما برای این جلسه ذخیره شد.",
    });
  };

  const handleAddCourse = (newCourse: Omit<Course, "id">) => {
    const courseWithId = { ...newCourse, id: `${newCourse.code}-${Math.random()}` };
    setAvailableCourses(prev => [...prev, courseWithId]);
    toast({
      title: "درس جدید اضافه شد",
      description: `درس "${newCourse.name}" به لیست دروس موجود اضافه شد.`,
    });
  };

  const handleGenerateSchedule = () => {
    if (!apiKey) {
       toast({
        title: "کلید API مورد نیاز است",
        description: "لطفاً کلید API خود را برای استفاده از هوش مصنوعی وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    if (availableCourses.length === 0) {
      toast({
        title: "هیچ درسی موجود نیست",
        description: "لطفاً برای ایجاد برنامه، ابتدا دروس را اضافه کنید.",
        variant: "destructive",
      });
      return;
    }

    startProcessingTransition(async () => {
      setScheduleResult(null); // Clear previous results
      const input = {
        availableCourses: availableCourses,
        studentPreferences: studentPreferences,
        studentId: "S-12345", // Mock data
        term: "پاییز ۱۴۰۳",     // Mock data
      };

      try {
        const result = await suggestOptimalSchedule(input);
        setScheduleResult(result);
        toast({
          title: "برنامه بهینه ایجاد شد",
          description: result.rationale,
        });
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
     if (!apiKey) {
       toast({
        title: "کلید API مورد نیاز است",
        description: "لطفاً کلید API خود را برای استخراج دروس از PDF وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const pdfDataUri = reader.result as string;
      startProcessingTransition(async () => {
        try {
          const result = await extractCoursesFromPdf({ pdfDataUri });
          const newCourses = result.courses.filter(
            (newCourse) => !availableCourses.some(
                (existing) => existing.code === newCourse.code && existing.group === newCourse.group
            )
          );
          setAvailableCourses(prev => [...prev, ...newCourses]);
          toast({
            title: "استخراج موفق",
            description: `${newCourses.length} درس جدید از فایل PDF استخراج شد.`,
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
  };
  
  const handleClearAllCourses = () => {
    setAvailableCourses([]);
    toast({
        title: "همه دروس پاک شدند",
        description: "لیست دروس موجود اکنون خالی است.",
    });
  };

  const courseGroups = useMemo(() => {
    const groups: Record<string, Course[]> = {};
    availableCourses.forEach(course => {
        const groupKey = course.group || 'عمومی/بدون گروه';
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(course);
    });
    return groups;
  }, [availableCourses]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings /> تنظیمات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="api-key">کلید API گوگل</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type="password"
                  placeholder="کلید Gemini API خود را وارد کنید"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                />
                <Button onClick={handleSaveApiKey}><KeyRound className="ml-2 h-4 w-4" /> ذخیره</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                برای استفاده از قابلیت‌های هوش مصنوعی، کلید API شما ضروری است.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListPlus /> افزودن دروس</CardTitle>
            <CardDescription>دروس را به صورت دستی یا با آپلود چارت درسی اضافه کنید.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pdf">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pdf" disabled={isProcessing}><FileUp className="ml-2" /> فایل PDF</TabsTrigger>
                <TabsTrigger value="manual" disabled={isProcessing}><ListPlus className="ml-2" /> دستی</TabsTrigger>
              </TabsList>
              <TabsContent value="pdf" className="pt-4">
                 <CourseSelection onPdfUpload={handlePdfUpload} isProcessing={isProcessing} />
              </TabsContent>
               <TabsContent value="manual" className="pt-4">
                <AddCourseForm onAddCourse={handleAddCourse} isProcessing={isProcessing} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Group /> لیست دروس موجود</CardTitle>
             <div className="flex justify-between items-center">
                <CardDescription>
                    {availableCourses.length} درس در {Object.keys(courseGroups).length} گروه
                </CardDescription>
                {availableCourses.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleClearAllCourses} disabled={isProcessing}>
                        <Trash2 className="ml-2 h-4 w-4" />
                        پاک کردن همه
                    </Button>
                )}
            </div>
          </CardHeader>
          <CardContent>
             <ScrollArea className="h-[250px] pr-3">
                {availableCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                        <FileUp className="h-10 w-10 mb-4" />
                        <h3 className="font-semibold mb-1">هنوز درسی اضافه نشده</h3>
                        <p className="text-sm">برای شروع، یک فایل PDF آپلود کنید یا به صورت دستی درس اضافه کنید.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(courseGroups).map(([groupName, courses]) => (
                            <div key={groupName}>
                                <h4 className="font-semibold mb-2 sticky top-0 bg-card py-1">{groupName}</h4>
                                <div className="space-y-2">
                                    {courses.map(course => (
                                        <div key={course.id} className="flex items-center justify-between p-2 rounded-lg border bg-secondary/50">
                                            <div>
                                                <p className="font-medium text-sm">{course.name} ({course.code})</p>
                                                <p className="text-xs text-muted-foreground">{course.timeslot}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveCourse(course.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </ScrollArea>
          </CardContent>
        </Card>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="preferences" className="border-b-0">
            <Card className="shadow-lg">
              <AccordionTrigger className="p-6 [&[data-state=open]]:border-b">
                  <CardHeader className="p-0 text-right">
                    <CardTitle className="flex items-center gap-2"><WandSparkles /> اولویت‌های شما</CardTitle>
                    <CardDescription>به هوش مصنوعی بگویید چه برنامه‌ای برایتان بهتر است.</CardDescription>
                  </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-6">
                    <StudentPreferencesForm
                        preferences={studentPreferences}
                        onPreferencesChange={setStudentPreferences}
                        generalCourses={availableCourses.filter(c => c.category === 'عمومی')}
                        isProcessing={isProcessing}
                    />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>


        <Button size="lg" className="w-full shadow-lg" onClick={handleGenerateSchedule} disabled={isProcessing || availableCourses.length === 0}>
           {isProcessing ? (
                <>
                  <WandSparkles className="ml-2 h-4 w-4 animate-spin" />
                  در حال تحلیل و بررسی...
                </>
              ) : (
                <>
                  <WandSparkles className="ml-2 h-4 w-4" />
                  ایجاد بهترین برنامه ممکن
                </>
            )}
        </Button>
      </div>
      <div className="lg:col-span-3">
        <ScheduleDisplay scheduleResult={scheduleResult} isLoading={isProcessing} />
      </div>
    </div>
  );
}
