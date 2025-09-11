"use client";

import * as React from "react";
import type { SuggestOptimalScheduleOutput } from "@/ai/flows/suggest-optimal-schedule";
import { AlertCircle, CalendarDays, Lightbulb, Group, Download, FileDown, ImageDown, Sheet as ExcelIcon, BrainCircuit, Filter } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { useRef, useCallback, useMemo, useState } from "react";
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import type { Course, TimeSlot } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

const toPersianDigits = (num: string) => {
    if (!num) return "";
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
};

interface ScheduleDisplayProps {
  scheduleResult?: SuggestOptimalScheduleOutput | null;
  manualCourses?: Course[];
  isLoading: boolean;
  timeSlots: TimeSlot[];
  isAiGenerated?: boolean;
}

const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const mainTimeRanges = new Set(["07:30-09:30", "09:30-11:30", "13:30-15:30", "15:30-17:30", "17:30-19:30"]);

const timeToMinutes = (time: string): number => {
    try {
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 0;
        return hours * 60 + minutes;
    } catch {
        return 0;
    }
};


interface Conflict {
  course1: string;
  course2: string;
  timeslot: string;
}


export default function ScheduleDisplay({ scheduleResult, manualCourses, isLoading, timeSlots, isAiGenerated = false }: ScheduleDisplayProps) {
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [showSecondarySlots, setShowSecondarySlots] = useState(false);
  
  const isManualMode = manualCourses !== undefined;

  const sortedTimeSlots = useMemo(() => {
    if (!timeSlots) return [];
    const filtered = showSecondarySlots 
      ? timeSlots 
      : timeSlots.filter(ts => mainTimeRanges.has(`${ts.start}-${ts.end}`));

    return [...filtered].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  }, [timeSlots, showSecondarySlots]);
  
 const getGridPosition = useCallback((timeslot: string) => {
    try {
        const parts = timeslot.trim().split(/\s+/);
        if (parts.length < 2) return null;

        const day = parts[0];
        const timeRange = parts[1];
        const [startTime, endTime] = timeRange.split("-");

        if (!startTime || !endTime) return null;
        
        const dayIndex = days.indexOf(day);
        if (dayIndex === -1) return null;

        const gridRow = dayIndex + 2;

        let startCol = -1;
        let endCol = -1;

        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        
        // Find the starting column (more flexible)
        for (let i = 0; i < sortedTimeSlots.length; i++) {
            if (startMinutes < timeToMinutes(sortedTimeSlots[i].end)) {
                startCol = i + 2;
                break;
            }
        }
        // If start time is after all slots, place it in the last one
        if (startCol === -1 && sortedTimeSlots.length > 0) {
            startCol = sortedTimeSlots.length + 1;
        }


        // Find the ending column (more flexible)
        for (let i = sortedTimeSlots.length - 1; i >= 0; i--) {
            if (endMinutes > timeToMinutes(sortedTimeSlots[i].start)) {
                endCol = i + 3;
                break;
            }
        }
         // If end time is before all slots, place it in the first one
        if (endCol === -1 && sortedTimeSlots.length > 0) {
            endCol = 2;
        }


        if (startCol === -1 || endCol === -1) return null;
        
        const gridColumn = `${startCol} / ${endCol}`;
        
        return { 
            gridRow: `${gridRow} / span 1`,
            gridColumn: gridColumn,
        };
    } catch (e) {
        console.error("Error parsing timeslot:", timeslot, e);
        return null;
    }
}, [sortedTimeSlots]);



  const scheduleItems = useMemo(() => {
    if (isManualMode) {
      if (!manualCourses) return [];
      return manualCourses.map(course => ({
        courseCode: course.code,
        courseName: course.name,
        instructor: course.instructors.map(i => i.name).join(', '),
        timeslot: course.timeslots,
        location: course.locations,
        group: course.group,
      }));
    }
    return scheduleResult?.schedule || [];
  }, [manualCourses, scheduleResult, isManualMode]);

    const timeToFractionalHour = (time: string): number | null => {
      try {
        const [hourStr, minuteStr] = time.split(":");
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        if (isNaN(hour) || isNaN(minute)) return null;
        return hour + minute / 60;
      } catch {
        return null;
      }
    };


  const manualConflicts = useMemo((): Conflict[] => {
    if (!isManualMode || !manualCourses || manualCourses.length < 2) {
      return [];
    }

    const conflicts: Conflict[] = [];
    const timeBlocksByDay: Record<string, { courseName: string, courseCode: string, timeslot: string, start: number, end: number }[]> = {};

    manualCourses.forEach(course => {
      course.timeslots.forEach(ts => {
        const parts = ts.trim().split(/\s+/);
        if (parts.length < 2) return;
        const day = parts[0];
        const [startTime, endTime] = parts[1].split('-');
        const startHour = timeToFractionalHour(startTime);
        const endHour = timeToFractionalHour(endTime);

        if (startHour === null || endHour === null) return;
        
        if (!timeBlocksByDay[day]) {
          timeBlocksByDay[day] = [];
        }
        timeBlocksByDay[day].push({ courseName: course.name, courseCode: course.code, timeslot: ts, start: startHour, end: endHour });
      });
    });

    for (const day in timeBlocksByDay) {
      const blocks = timeBlocksByDay[day];
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          const block1 = blocks[i];
          const block2 = blocks[j];
          if (block1.start < block2.end && block1.end > block2.start) {
            conflicts.push({
              course1: `${block1.courseName} (${block1.courseCode})`,
              course2: `${block2.courseName} (${block2.courseCode})`,
              timeslot: day,
            });
          }
        }
      }
    }
    
    // Remove duplicate conflicts
    const uniqueConflicts = conflicts.filter((conflict, index, self) =>
      index === self.findIndex((c) => (
        (c.course1 === conflict.course1 && c.course2 === conflict.course2) ||
        (c.course1 === conflict.course2 && c.course2 === conflict.course1)
      ))
    );


    return uniqueConflicts;
  }, [isManualMode, manualCourses]);


  const downloadAsPng = useCallback(() => {
    if (scheduleRef.current === null) return;
    toPng(scheduleRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: 'white' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'schedule.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error("Could not generate PNG", err));
  }, [scheduleRef]);

  const downloadAsPdf = useCallback(() => {
    if (scheduleRef.current === null) return;
    toPng(scheduleRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: 'white' })
      .then((dataUrl) => {
        const pdf = new jsPDF('l', 'px', [scheduleRef.current!.offsetWidth, scheduleRef.current!.offsetHeight]);
        pdf.addImage(dataUrl, 'PNG', 0, 0, scheduleRef.current!.offsetWidth, scheduleRef.current!.offsetHeight);
        pdf.save('schedule.pdf');
      })
      .catch((err) => console.error("Could not generate PDF", err));
  }, [scheduleRef]);

  const downloadAsCsv = useCallback(() => {
    if (scheduleItems.length === 0) return;
    const csvData = scheduleItems.map(item => ({
      'نام درس': item.courseName,
      'کد درس': item.courseCode,
      'استاد': item.instructor,
      'زمان': Array.isArray(item.timeslot) ? item.timeslot.join('; ') : item.timeslot,
      'مکان': Array.isArray(item.location) ? item.location.join('; ') : item.location,
      'گروه': item.group || '',
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [scheduleItems]);

  const renderScheduleItems = () => {
    if (scheduleItems.length === 0) {
      return null;
    }
    
    return scheduleItems.flatMap((item, index) => {
      const timeslots = Array.isArray(item.timeslot) ? item.timeslot : [item.timeslot];
      const locations = Array.isArray(item.location) ? item.location : [item.location];

      return timeslots.map((ts, tsIndex) => {
        const pos = getGridPosition(ts);
        if (!pos) return null;
        
        const colorClasses = [
          "bg-sky-100 border-sky-200 text-sky-800 dark:bg-sky-900/50 dark:border-sky-800 dark:text-sky-200",
          "bg-teal-100 border-teal-200 text-teal-800 dark:bg-teal-900/50 dark:border-teal-800 dark:text-teal-200",
          "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/50 dark:border-amber-800 dark:text-amber-200",
          "bg-violet-100 border-violet-200 text-violet-800 dark:bg-violet-900/50 dark:border-violet-800 dark:text-violet-200",
          "bg-rose-100 border-rose-200 text-rose-800 dark:bg-rose-900/50 dark:border-rose-800 dark:text-rose-200",
          "bg-cyan-100 border-cyan-200 text-cyan-800 dark:bg-cyan-900/50 dark:border-cyan-800 dark:text-cyan-200",
          "bg-lime-100 border-lime-200 text-lime-800 dark:bg-lime-900/50 dark:border-lime-800 dark:text-lime-200",
          "bg-pink-100 border-pink-200 text-pink-800 dark:bg-pink-900/50 dark:border-pink-800 dark:text-pink-200",
        ];
        
        const courseColorIndex = (item.courseCode.charCodeAt(0) + item.courseCode.length + index) % colorClasses.length;
        const colorClass = colorClasses[courseColorIndex];

        return (
          <div
            key={`${index}-${tsIndex}`}
            className={`p-2 rounded-lg border text-xs flex flex-col justify-center overflow-hidden shadow-sm h-full ${colorClass}`}
            style={{ 
              gridRow: pos.gridRow, 
              gridColumn: pos.gridColumn,
            }}
          >
            <p className="font-bold truncate">{item.courseName}</p>
            <p className="opacity-80 truncate">{item.instructor}</p>
            <p className="opacity-60 mt-0.5 truncate">{locations[tsIndex] || item.location}</p>
          </div>
        );
      });
    });
  };

  const renderSkeleton = () => (
     <div className="p-4 space-y-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/5" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[800px] space-y-2">
            {/* Header */}
            <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 flex-1" />
                ))}
            </div>
            {/* Rows */}
             {days.map(day => (
                 <div key={day} className="flex gap-2">
                     <Skeleton className="h-16 w-24" />
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 flex-1" />
                    ))}
                 </div>
             ))}
        </div>
      </div>
    </div>
  );
  
  const getTitleAndDescription = () => {
    if (isManualMode) {
      return { title: "برنامه هفتگی", description: "برنامه ساخته شده توسط شما." };
    }
    if (isAiGenerated) {
        return { title: "برنامه پیشنهادی هوش مصنوعی", description: "برنامه بهینه پیشنهاد شده توسط هوش مصنوعی." };
    }
    return { title: "برنامه پیشنهادی سیستم", description: "برنامه بهینه پیشنهاد شده توسط تحلیلگر سیستم." };
  };

  const { title, description } = getTitleAndDescription();


  return (
    <Card className="shadow-md h-full sticky top-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
            <CardTitle className="font-headline flex items-center gap-2">
            <CalendarDays />
            {title}
            </CardTitle>
            <CardDescription className="mt-1">
                {description}
            </CardDescription>
        </div>
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap justify-start sm:justify-end w-full sm:w-auto">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch 
                id="show-secondary-slots" 
                checked={showSecondarySlots}
                onCheckedChange={setShowSecondarySlots}
                disabled={timeSlots.length === 0}
              />
              <Label htmlFor="show-secondary-slots" className="text-sm shrink-0">نمایش سانس‌های فرعی</Label>
            </div>
         {(scheduleItems.length > 0 || (isManualMode && manualCourses && manualCourses.length > 0)) && !isLoading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <Download className="ml-2 h-4 w-4" />
                  خروجی
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadAsPng}>
                  <ImageDown className="ml-2 h-4 w-4" />
                  ذخیره به صورت عکس (PNG)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsPdf}>
                  <FileDown className="ml-2 h-4 w-4" />
                  ذخیره به صورت PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsCsv}>
                  <ExcelIcon className="ml-2 h-4 w-4" />
                  ذخیره به صورت اکسل (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          renderSkeleton()
        ) : (
          <div className="overflow-x-auto pb-4">
             <div
                ref={scheduleRef} 
                className="grid gap-px bg-background p-1 min-w-[900px] border"
                style={{
                  gridTemplateColumns: `80px repeat(${sortedTimeSlots.length}, minmax(80px, 1fr))`,
                  gridTemplateRows: `auto repeat(${days.length}, 1fr)`,
                  direction: 'rtl'
                }}
             >
                {/* Top-left empty cell */}
                <div className="bg-card sticky right-0 z-20 border-b border-l"></div>

                {/* Time Slot Headers */}
                {sortedTimeSlots.map((ts, index) => (
                  <div key={ts.id} className="text-center font-semibold text-muted-foreground text-sm p-2 bg-card border-b border-l z-10" style={{ gridColumn: `${index + 2} / span 1` }}>
                    <div>{ts.name}</div>
                    <div className="font-mono tracking-tighter">{toPersianDigits(ts.start)}-{toPersianDigits(ts.end)}</div>
                  </div>
                ))}

                {/* Day Headers and Grid Cells */}
                {days.map((day, dayIndex) => (
                  <React.Fragment key={day}>
                      <div className="text-center font-semibold text-muted-foreground text-sm p-2 sticky right-0 bg-card border-b border-l z-10 flex items-center justify-center" style={{ gridRow: `${dayIndex + 2} / span 1` }}>{day}</div>
                      {sortedTimeSlots.map((ts, tsIndex) => (
                          <div key={`${day}-${ts.id}`} className="bg-secondary/20 min-h-[80px] border-b border-l" style={{ gridColumn: `${tsIndex + 2} / span 1`, gridRow: `${dayIndex + 2} / span 1` }}></div>
                      ))}
                  </React.Fragment>
                ))}
                
                {renderScheduleItems()}
                 
                {scheduleItems.length === 0 && (
                  <div 
                      className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 col-start-1 col-end-[-1] row-start-2 row-end-[-1] text-sm sm:text-base"
                  >
                        <CalendarDays className="h-12 w-12 mb-4 text-muted-foreground/50"/>
                        {timeSlots.length === 0
                          ? "برای مشاهده جدول، ابتدا حداقل یک سانس زمانی در بخش «مدیریت سانس‌ها» تعریف کنید."
                          : isManualMode
                              ? "درسی برای نمایش انتخاب نشده است. از لیست دروس، موارد دلخواه را تیک بزنید."
                              : "پس از افزودن دروس و تعیین اولویت‌ها، بهترین برنامه ممکن برای شما اینجا ساخته می‌شود."
                        }
                  </div>
                )}
            </div>

            {isManualMode && manualConflicts.length > 0 && (
                 <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-headline">هشدار تداخل زمانی</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc mr-4 space-y-1 mt-2">
                        {manualConflicts.map((conflict, index) => (
                            <li key={index}>
                                تداخل در روز {conflict.timeslot}: <span className="font-semibold">{conflict.course1}</span> با <span className="font-semibold">{conflict.course2}</span>
                            </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
            )}

            {!isManualMode && scheduleResult && (
              <div className="mt-6 space-y-4">
                 {scheduleResult.recommendedGroup && (
                  <Alert variant="default" className="bg-primary/10 border-primary/20">
                    <Group className="h-4 w-4" />
                    <AlertTitle className="font-headline text-primary">گروه پیشنهادی: {scheduleResult.recommendedGroup}</AlertTitle>
                  </Alert>
                )}
                {scheduleResult.conflicts && scheduleResult.conflicts.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-headline">تداخل در برنامه</AlertTitle>
                    <AlertDescription>
                      دروس زیر به دلیل تداخل قابل برنامه‌ریزی نبوده‌اند:
                      <div className="flex flex-wrap gap-2 mt-2">
                        {scheduleResult.conflicts.map(c => <Badge key={c} variant="destructive">{c}</Badge>)}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                {scheduleResult.rationale && (
                   <Alert>
                    <BrainCircuit className="h-4 w-4" />
                    <AlertTitle className="font-headline">منطق تحلیلگر سیستم</AlertTitle>
                    <AlertDescription>
                      {scheduleResult.rationale}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
