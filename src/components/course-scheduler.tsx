"use client";

import type { SuggestOptimalScheduleOutput } from "@/ai/flows/suggest-optimal-schedule";
import { suggestOptimalSchedule } from "@/ai/flows/suggest-optimal-schedule";
import type { Course, TimeSlot, CourseGroup } from "@/types";
import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import CourseSelection from "./course-selection";
import ScheduleDisplay from "./schedule-display";
import { useToast } from "@/hooks/use-toast";
import { extractCoursesFromPdf } from "@/ai/flows/extract-courses-from-pdf";
import { AddCourseForm } from "./add-course-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FileUp, ListPlus, WandSparkles, Trash2, Group, Settings, KeyRound, Sheet, Save, FolderOpen, Calendar, Edit, Info, AlertTriangle, Clock, PlusCircle, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import StudentPreferencesForm from "./student-preferences-form";
import type { StudentPreferences } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Checkbox } from "./ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Alert, AlertTitle } from "./ui/alert";
import EditCourseDialog from "./edit-course-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";


export default function CourseScheduler() {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [manuallySelectedCourseIds, setManuallySelectedCourseIds] = useState<Set<string>>(new Set());
  const [studentPreferences, setStudentPreferences] = useState<StudentPreferences>({
      instructorPreferences: [],
  });
  const [scheduleResult, setScheduleResult] = useState<SuggestOptimalScheduleOutput | null>(null);
  const [isProcessing, startProcessingTransition] = useTransition();
  const [apiProvider, setApiProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState({ name: "", start: "", end: "" });
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [newCourseGroup, setNewCourseGroup] = useState("");
  const { toast } = useToast();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      (window as any).__GEMINI_API_KEY__ = storedApiKey;
    }

    const storedTimeSlots = localStorage.getItem('course-time-slots');
    if(storedTimeSlots) {
        setTimeSlots(JSON.parse(storedTimeSlots));
    }
    const storedCourseGroups = localStorage.getItem('course-groups');
    if(storedCourseGroups) {
        setCourseGroups(JSON.parse(storedCourseGroups));
    }
  }, []);
  
  useEffect(() => {
      localStorage.setItem('course-time-slots', JSON.stringify(timeSlots));
  }, [timeSlots])

  useEffect(() => {
    localStorage.setItem('course-groups', JSON.stringify(courseGroups));
  }, [courseGroups])


  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
  };

  const handleSaveApiKey = () => {
    localStorage.setItem(`${apiProvider}-api-key`, apiKey);
    if (apiProvider === 'gemini') {
        (window as any).__GEMINI_API_KEY__ = apiKey;
    }
    toast({
      title: "کلید API ذخیره شد",
      description: `کلید API شما برای ${apiProvider} ذخیره شد.`,
    });
  };

  const handleAddCourse = (newCourse: Omit<Course, "id">) => {
    const courseWithId = { ...newCourse, id: `${newCourse.code}-${Math.random().toString(36).substring(7)}` };
    setAvailableCourses(prev => [...prev, courseWithId]);
    toast({
      title: "درس جدید اضافه شد",
      description: `درس "${newCourse.name}" به لیست دروس موجود اضافه شد.`,
    });
  };
  
  const handleUpdateCourse = (updatedCourse: Course) => {
    setAvailableCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    toast({
        title: "درس ویرایش شد",
        description: `درس "${updatedCourse.name}" با موفقیت به‌روزرسانی شد.`,
    });
    setEditingCourse(null); // Close the dialog
  };

  const handleGenerateSchedule = () => {
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
        // This now calls the local algorithm, not an AI flow
        const result = await suggestOptimalSchedule(input);
        setScheduleResult(result);
        toast({
          title: "برنامه بهینه ایجاد شد",
          description: result.rationale,
        });
      } catch (error) {
        console.error("خطا در ایجاد برنامه:", error);
        toast({
          title: "خطا در ایجاد برنامه",
          description: "ایجاد برنامه با شکست مواجه شد. لطفاً ورودی‌ها را بررسی کرده و دوباره تلاش کنید.",
          variant: "destructive",
        });
      }
    });
  };

  const handlePdfUpload = (file: File) => {
     if (!apiKey) {
       toast({
        title: "کلید API مورد نیاز است",
        description: "لطفاً کلید API خود را برای استخراج دروس از PDF وارد کنید (بزودی این قابلیت نیاز به کلید نخواهد داشت).",
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
            (newCourse: any) => !availableCourses.some(
                (existing) => existing.code === newCourse.code && existing.group === newCourse.group
            )
          );
          setAvailableCourses(prev => [...prev, ...newCourses as Course[]]);
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

  const processAndAddCourses = (data: any[]) => {
      try {
          if (!data || data.length === 0) {
              throw new Error('فایل اکسل خالی است یا داده‌ای ندارد.');
          }
          const headers = Object.keys(data[0]);
          const requiredColumns = ['code', 'name', 'instructorName', 'category', 'timeslots', 'locations'];
          const missingColumns = requiredColumns.filter(col => !headers.includes(col));
          if (missingColumns.length > 0) {
              throw new Error(`فایل اکسل ستون‌های الزامی زیر را ندارد: ${missingColumns.join(', ')}`);
          }

          const parsedCourses: Omit<Course, "id">[] = data.map((row: any, index: number) => {
              if (!row.code || !row.name || !row.instructorName || !row.category || !row.timeslots || !row.locations) {
                console.warn(`ردیف ${index + 2} در فایل اکسل نادیده گرفته شد چون داده‌های ضروری را نداشت.`);
                return null;
              }
              const instructorId = String(row.instructorName).replace(/\s+/g, '-').toLowerCase();
              return {
                  code: String(row.code),
                  name: String(row.name),
                  instructors: [{ id: instructorId, name: String(row.instructorName) }],
                  category: row.category,
                  timeslots: String(row.timeslots).split(';').map((s: string) => s.trim()),
                  locations: String(row.locations).split(';').map((s: string) => s.trim()),
                  group: row.group ? String(row.group) : undefined,
              };
          }).filter((c): c is Omit<Course, "id"> => c !== null);

          const coursesWithIds = parsedCourses.map(course => ({
              ...course,
              id: `${course.code}-${course.group || 'X'}-${Math.random().toString(36).substring(7)}`,
          }));

          const newCourses = coursesWithIds.filter(
              (newCourse) => !availableCourses.some(
                  (existing) => existing.code === newCourse.code && existing.group === newCourse.group
              )
          );

          setAvailableCourses(prev => [...prev, ...newCourses]);
          toast({
              title: "استخراج موفق",
              description: `${newCourses.length} درس جدید از فایل اکسل استخراج شد.`,
          });
      } catch (error: any) {
          console.error("خطا در پردازش اکسل:", error);
          toast({
              title: "خطا در پردازش فایل",
              description: error.message || "ساختار فایل اکسل صحیح نیست.",
              variant: "destructive",
          });
      }
  }

  const handleFileUpload = (file: File) => {
      startProcessingTransition(() => {
          const reader = new FileReader();
          if (file.name.endsWith('.csv')) {
              reader.onload = (e) => {
                  const text = e.target?.result as string;
                  Papa.parse(text, {
                      header: true,
                      skipEmptyLines: true,
                      complete: (results) => processAndAddCourses(results.data as any[]),
                      error: (error: any) => {
                           toast({
                              title: "خطا در آپلود",
                              description: "پارس کردن فایل CSV با شکست مواجه شد.",
                              variant: "destructive",
                          });
                      }
                  });
              };
              reader.readAsText(file);
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
              reader.onload = (e) => {
                  const data = e.target?.result;
                  const workbook = XLSX.read(data, { type: 'array' });
                  const sheetName = workbook.SheetNames[0];
                  const worksheet = workbook.Sheets[sheetName];
                  const json = XLSX.utils.sheet_to_json(worksheet);
                  processAndAddCourses(json);
              };
              reader.readAsArrayBuffer(file);
          } else {
              toast({
                  title: "فرمت فایل نامعتبر",
                  description: "لطفاً یک فایل با فرمت .csv، .xlsx یا .xls آپلود کنید.",
                  variant: "destructive",
              });
          }
      });
  };

  const handleBackup = () => {
    if (availableCourses.length === 0) {
      toast({
        title: "هیچ درسی برای پشتیبان‌گیری وجود ندارد",
        variant: "destructive"
      });
      return;
    }
    const dataStr = JSON.stringify(availableCourses, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'course_backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({
        title: "پشتیبان‌گیری موفق",
        description: "لیست دروس شما در فایل course_backup.json ذخیره شد."
    })
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            throw new Error("محتوای فایل قابل خواندن نیست.")
        }
        const restoredCourses = JSON.parse(text);
        // Basic validation
        if (Array.isArray(restoredCourses) && restoredCourses.every(c => c.id && c.code && c.name)) {
          setAvailableCourses(restoredCourses);
          toast({
            title: "بازیابی موفق",
            description: `${restoredCourses.length} درس از فایل پشتیبان بازیابی شد.`
          });
        } else {
          throw new Error("فرمت فایل پشتیبان صحیح نیست.");
        }
      } catch (error: any) {
        toast({
          title: "خطا در بازیابی",
          description: error.message || "فایل پشتیبان نامعتبر است.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset file input
  };
  
  const handleRemoveCourse = (courseId: string) => {
    setAvailableCourses(prev => prev.filter(c => c.id !== courseId));
    setManuallySelectedCourseIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
    });
  };
  
  const handleClearAllCourses = () => {
    setAvailableCourses([]);
    setManuallySelectedCourseIds(new Set());
    toast({
        title: "همه دروس پاک شدند",
        description: "لیست دروس موجود اکنون خالی است.",
    });
  };

  const handleManualCourseSelect = (courseId: string, isSelected: boolean) => {
      setManuallySelectedCourseIds(prev => {
          const newSet = new Set(prev);
          if (isSelected) {
              newSet.add(courseId);
          } else {
              newSet.delete(courseId);
          }
          return newSet;
      });
  };

  const manuallySelectedCourses = useMemo(() => {
    return availableCourses.filter(course => manuallySelectedCourseIds.has(course.id));
  }, [availableCourses, manuallySelectedCourseIds]);


  const courseGroupsByName = useMemo(() => {
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

  const handleAddNewTimeSlot = () => {
      if (!newTimeSlot.name || !newTimeSlot.start || !newTimeSlot.end) {
          toast({ title: "لطفاً تمام فیلدهای سانس را پر کنید.", variant: "destructive" });
          return;
      }
       if (newTimeSlot.start >= newTimeSlot.end) {
          toast({ title: "زمان شروع باید قبل از زمان پایان باشد.", variant: "destructive" });
          return;
      }
      setTimeSlots(prev => [...prev, { id: `ts-${Date.now()}`, ...newTimeSlot }]);
      setNewTimeSlot({ name: "", start: "", end: "" });
       toast({ title: "سانس جدید با موفقیت اضافه شد.", variant: "default" });
  }
  
  const handleRemoveTimeSlot = (id: string) => {
      setTimeSlots(prev => prev.filter(ts => ts.id !== id));
  }

  const handleAddNewCourseGroup = () => {
    if (!newCourseGroup.trim()) {
        toast({ title: "نام گروه درسی نمی‌تواند خالی باشد.", variant: "destructive" });
        return;
    }
    setCourseGroups(prev => [...prev, { id: `cg-${Date.now()}`, name: newCourseGroup.trim() }]);
    setNewCourseGroup("");
    toast({ title: "گروه درسی جدید اضافه شد.", variant: "default" });
  }

  const handleRemoveCourseGroup = (id: string) => {
      setCourseGroups(prev => prev.filter(cg => cg.id !== id));
  }


  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="api-settings" className="border-b-0">
            <Card className="shadow-lg">
                <AccordionTrigger className="p-4 sm:p-6 text-right [&[data-state=open]]:border-b">
                    <CardHeader className="p-0">
                        <CardTitle className="flex items-center gap-2"><Settings /> تنظیمات API</CardTitle>
                        <CardDescription>برای فعالسازی قابلیت‌های هوشمند در آینده، کلید API را وارد کنید.</CardDescription>
                    </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-6 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="api-provider">ارائه دهنده هوش مصنوعی</Label>
                            <Select value={apiProvider} onValueChange={setApiProvider}>
                                <SelectTrigger id="api-provider">
                                    <SelectValue placeholder="یک ارائه دهنده را انتخاب کنید" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Gemini (بزودی)</SelectItem>
                                    <SelectItem value="openai" disabled>OpenAI (بزودی)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="api-key">کلید API</Label>
                          <div className="flex gap-2">
                            <Input
                              id="api-key"
                              type="password"
                              placeholder="کلید API خود را وارد کنید"
                              value={apiKey}
                              onChange={handleApiKeyChange}
                            />
                            <Button onClick={handleSaveApiKey}><KeyRound className="ml-2 h-4 w-4" /> ذخیره</Button>
                          </div>
                        </div>
                    </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock /> مدیریت سانس‌ها</CardTitle>
                    <CardDescription>بازه‌های زمانی کلاس‌ها را اینجا تعریف کنید.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-end gap-2">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="ts-name" className="text-xs">نام سانس</Label>
                            <Input id="ts-name" value={newTimeSlot.name} onChange={e => setNewTimeSlot(p => ({...p, name: e.target.value}))} placeholder="سانس اول" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="ts-start" className="text-xs">شروع</Label>
                            <Input id="ts-start" type="time" value={newTimeSlot.start} onChange={e => setNewTimeSlot(p => ({...p, start: e.target.value}))} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="ts-end" className="text-xs">پایان</Label>
                            <Input id="ts-end" type="time" value={newTimeSlot.end} onChange={e => setNewTimeSlot(p => ({...p, end: e.target.value}))} />
                        </div>
                        <Button onClick={handleAddNewTimeSlot} size="icon" className="shrink-0 mt-4 sm:mt-0"><PlusCircle className="h-4 w-4"/></Button>
                    </div>
                    {timeSlots.length > 0 && (
                        <ScrollArea className="h-24 mt-4 pr-3">
                            <div className="space-y-2">
                            {timeSlots.map(ts => (
                                <div key={ts.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-secondary">
                                    <p><span className="font-semibold">{ts.name}:</span> {ts.start} - {ts.end}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveTimeSlot(ts.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Group /> مدیریت گروه‌ها</CardTitle>
                    <CardDescription>گروه‌های درسی خود را اینجا تعریف کنید.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <Label htmlFor="cg-name" className="text-xs">نام گروه</Label>
                            <Input id="cg-name" value={newCourseGroup} onChange={e => setNewCourseGroup(e.target.value)} placeholder="مثال: گروه ۱" />
                        </div>
                        <Button onClick={handleAddNewCourseGroup} size="icon" className="shrink-0"><PlusCircle className="h-4 w-4"/></Button>
                    </div>
                    {courseGroups.length > 0 && (
                        <ScrollArea className="h-24 mt-4 pr-3">
                            <div className="space-y-2">
                            {courseGroups.map(cg => (
                                <div key={cg.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-secondary">
                                    <p className="font-semibold">{cg.name}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveCourseGroup(cg.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListPlus /> افزودن دروس</CardTitle>
            <CardDescription>دروس را به صورت دستی یا با آپلود چارت درسی اضافه کنید.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="manual">
              <TabsList className="flex flex-col sm:flex-row h-auto">
                <TabsTrigger value="pdf" disabled={isProcessing} className="w-full sm:w-auto"><FileUp className="ml-2" /> PDF (بزودی)</TabsTrigger>
                <TabsTrigger value="excel" disabled={isProcessing} className="w-full sm:w-auto"><Sheet className="ml-2" /> اکسل</TabsTrigger>
                <TabsTrigger value="manual" disabled={isProcessing} className="w-full sm:w-auto"><ListPlus className="ml-2" /> دستی</TabsTrigger>
              </TabsList>
              <TabsContent value="pdf" className="pt-4">
                 <CourseSelection onFileUpload={handlePdfUpload} isProcessing={isProcessing} accept="application/pdf" title="آپلود چارت درسی (PDF)" description="این قابلیت با استفاده از هوش مصنوعی کار می‌کند و بزودی فعال خواهد شد. لطفاً کلید API خود را در تنظیمات وارد کنید." />
              </TabsContent>
               <TabsContent value="excel" className="pt-4">
                 <CourseSelection onFileUpload={handleFileUpload} isProcessing={isProcessing} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" title="آپلود چارت درسی (اکسل)" description="فایل اکسل (CSV, XLSX, XLS) را آپلود کنید. ستون‌ها باید شامل: code, name, instructorName, category, timeslots, locations, group (اختیاری) باشند. برای زمان‌ها و مکان‌های چندگانه، آن‌ها را با ; از هم جدا کنید." />
              </TabsContent>
               <TabsContent value="manual" className="pt-4">
                <AddCourseForm onAddCourse={handleAddCourse} isProcessing={isProcessing} timeSlots={timeSlots} courseGroups={courseGroups} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Group /> لیست دروس موجود</CardTitle>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardDescription className="mt-1">
                    {availableCourses.length} درس در {Object.keys(courseGroupsByName).length} گروه
                </CardDescription>
                 <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleBackup} disabled={isProcessing || availableCourses.length === 0}>
                        <Save className="ml-1 h-4 w-4" />
                        ذخیره
                    </Button>
                     <Button variant="outline" size="sm" onClick={() => restoreInputRef.current?.click()} disabled={isProcessing}>
                        <FolderOpen className="ml-1 h-4 w-4" />
                        بازیابی
                    </Button>
                    <input
                      type="file"
                      ref={restoreInputRef}
                      onChange={handleRestore}
                      className="hidden"
                      accept="application/json"
                    />
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
             <ScrollArea className="h-[300px] pr-3">
                {availableCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                        <FileUp className="h-10 w-10 mb-4" />
                        <h3 className="font-semibold mb-1">هنوز درسی اضافه نشده</h3>
                        <p className="text-sm">برای شروع، یک فایل اکسل یا به صورت دستی درس اضافه کنید.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(courseGroupsByName).map(([groupName, courses]) => (
                            <div key={groupName}>
                                <h4 className="font-semibold mb-2 sticky top-0 bg-card py-1">{groupName}</h4>
                                <div className="space-y-2">
                                    {courses.map(course => (
                                        <div key={course.id} className="flex items-start justify-between p-2 rounded-lg border bg-secondary/50">
                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                <Checkbox 
                                                  id={`manual-select-${course.id}`}
                                                  checked={manuallySelectedCourseIds.has(course.id)}
                                                  onCheckedChange={(checked) => handleManualCourseSelect(course.id, !!checked)}
                                                  aria-label={`انتخاب درس ${course.name}`}
                                                />
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-medium text-sm truncate">{course.name} ({course.code})</p>
                                                    <p className="text-xs text-muted-foreground truncate">زمان: {course.timeslots.join('، ')}</p>
                                                    <p className="text-xs text-muted-foreground truncate">مکان: {course.locations.join('، ')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center flex-shrink-0">
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8" onClick={() => setEditingCourse(course)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => handleRemoveCourse(course.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </ScrollArea>
             {availableCourses.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="destructive" size="sm" disabled={isProcessing} className="w-full mt-4">
                        <Trash2 className="ml-2 h-4 w-4" />
                        پاک کردن همه دروس
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>آیا از پاک کردن همه دروس مطمئن هستید؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        این عمل قابل بازگشت نیست. تمام دروسی که به صورت دستی یا از طریق فایل وارد کرده‌اید برای همیشه حذف خواهند شد.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>لغو</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAllCourses}>بله، پاک کن</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            )}
          </CardContent>
        </Card>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="preferences" className="border-b-0">
            <Card className="shadow-lg">
              <AccordionTrigger className="p-4 sm:p-6 text-right [&[data-state=open]]:border-b">
                  <CardHeader className="p-0">
                    <CardTitle className="flex items-center gap-2"><BrainCircuit /> اولویت‌های شما</CardTitle>
                    <CardDescription>به تحلیلگر سیستم بگویید چه برنامه‌ای برایتان بهتر است.</CardDescription>
                  </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-6 p-4 sm:p-6">
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
        <Tabs defaultValue="system-schedule">
          <TabsList className="flex h-auto flex-col sm:flex-row">
            <TabsTrigger value="system-schedule" className="w-full sm:w-auto"><WandSparkles className="ml-1" /> برنامه پیشنهادی سیستم</TabsTrigger>
            <TabsTrigger value="ai-schedule" disabled className="w-full sm:w-auto"><BrainCircuit className="ml-1" /> پیشنهادی هوش مصنوعی</TabsTrigger>
            <TabsTrigger value="manual-schedule" className="w-full sm:w-auto"><Edit className="ml-1" /> برنامه دستی</TabsTrigger>
          </TabsList>
          <TabsContent value="system-schedule">
            <ScheduleDisplay scheduleResult={scheduleResult} isLoading={isProcessing} timeSlots={timeSlots} />
          </TabsContent>
          <TabsContent value="ai-schedule">
             <Card className="shadow-lg h-full sticky top-8">
                <CardHeader>
                   <CardTitle className="font-headline flex items-center gap-2">
                    <BrainCircuit />
                    پیشنهادی هوش مصنوعی
                    </CardTitle>
                    <CardDescription>
                        این قابلیت قدرتمند به زودی فعال خواهد شد.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 rounded-lg border-2 border-dashed h-96">
                        <WandSparkles className="h-16 w-16 mb-4 text-primary/50" />
                        <h3 className="text-xl font-bold mb-2">در حال توسعه...</h3>
                        <p className="max-w-md">
                            این بخش با استفاده از هوش مصنوعی پیشرفته (مانند Gemini) بهترین برنامه ممکن را با در نظر گرفتن تمام قوانین و اولویت‌های پیچیده برای شما ایجاد خواهد کرد. برای استفاده از این قابلیت در آینده به کلید API نیاز خواهید داشت.
                        </p>
                    </div>
                </CardContent>
             </Card>
          </TabsContent>
          <TabsContent value="manual-schedule">
            <ScheduleDisplay manualCourses={manuallySelectedCourses} isLoading={false} timeSlots={timeSlots} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
      {editingCourse && (
        <EditCourseDialog
          course={editingCourse}
          onUpdateCourse={handleUpdateCourse}
          onOpenChange={(isOpen) => !isOpen && setEditingCourse(null)}
          timeSlots={timeSlots}
          courseGroups={courseGroups}
        />
      )}
    </>
  );
}
