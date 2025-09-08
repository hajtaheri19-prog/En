"use client";

import * as React from "react";
import type { SuggestOptimalScheduleOutput } from "@/ai/flows/suggest-optimal-schedule";
import { AlertCircle, CalendarDays, Lightbulb, Group, Download, FileDown, ImageDown, Sheet as ExcelIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { useRef, useCallback, useMemo } from "react";
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import { Course } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface ScheduleDisplayProps {
  scheduleResult?: SuggestOptimalScheduleOutput | null;
  manualCourses?: Course[];
  isLoading: boolean;
}

const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const timeSlots = Array.from({ length: 15 }, (_, i) => `${i + 7}:00`); // 7:00 to 21:00

const dayToGridCol = (day: string) => {
  const d = day.trim();
  switch (d) {
    case "شنبه": return 2;
    case "یکشنبه": return 3;
    case "دوشنبه": return 4;
    case "سه‌شنبه": return 5;
    case "چهارشنبه": return 6;
    case "پنجشنبه": return 7;
    default: return 0;
  }
};

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

interface TimeBlock {
  day: string;
  start: number;
  end: number;
}

interface Conflict {
  course1: string;
  course2: string;
  timeslot: string;
}

const getGridPosition = (timeslot: string) => {
  try {
    const parts = timeslot.trim().split(/\s+/);
    if (parts.length < 2) return null;

    const day = parts[0];
    const timeRange = parts[1];
    const [startTime, endTime] = timeRange.split("-");
    
    if (!startTime || !endTime) return null;

    const gridColumn = dayToGridCol(day);
    const startHour = timeToFractionalHour(startTime);
    const endHour = timeToFractionalHour(endTime);
    
    if (gridColumn === 0 || startHour === null || endHour === null || endHour <= startHour) return null;

    // Grid row starts at 2 because row 1 is for headers. Base hour is 7:00.
    const gridRowStart = (startHour - 7) * 2 + 2; // Using half-hour increments for more precision
    const durationInHalfHours = (endHour - startHour) * 2;
    const gridRowEnd = gridRowStart + durationInHalfHours;

    return { 
      gridColumn,
      gridRow: `${Math.round(gridRowStart)} / ${Math.round(gridRowEnd)}`,
    };
  } catch (e) {
    console.error("Error parsing timeslot:", timeslot, e);
    return null;
  }
};


export default function ScheduleDisplay({ scheduleResult, manualCourses, isLoading }: ScheduleDisplayProps) {
  const scheduleRef = useRef<HTMLDivElement>(null);
  
  const isManualMode = manualCourses !== undefined;

  const scheduleItems = useMemo(() => {
    if (isManualMode) {
      return manualCourses!.map(course => ({
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
          // Check for overlap. If start time of one is less than end time of another,
          // AND end time of one is greater than start time of another, they overlap.
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
    toPng(scheduleRef.current, { cacheBust: true, pixelRatio: 1.5, skipFonts: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'schedule.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error(err));
  }, [scheduleRef]);

  const downloadAsPdf = useCallback(() => {
    if (scheduleRef.current === null) return;
    toPng(scheduleRef.current, { cacheBust: true, pixelRatio: 2, skipFonts: true })
      .then((dataUrl) => {
        const pdf = new jsPDF('landscape', 'px', [scheduleRef.current!.offsetWidth, scheduleRef.current!.offsetHeight]);
        pdf.addImage(dataUrl, 'PNG', 0, 0, scheduleRef.current!.offsetWidth, scheduleRef.current!.offsetHeight);
        pdf.save('schedule.pdf');
      })
      .catch((err) => console.error(err));
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
      return (
         <div className="col-start-1 col-span-full row-start-2 row-span-full flex items-center justify-center text-center">
            <p className="text-muted-foreground">
                {isManualMode
                    ? "درسی برای نمایش انتخاب نشده است. از لیست دروس، موارد دلخواه را تیک بزنید."
                    : "پس از افزودن دروس و تعیین اولویت‌ها، بهترین برنامه ممکن برای شما اینجا ساخته می‌شود."
                }
            </p>
         </div>
      );
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
            className={`absolute p-1.5 rounded-lg border text-[11px] flex flex-col justify-center overflow-hidden shadow-sm w-full ${colorClass}`}
            style={{ 
              gridColumn: pos.gridColumn, 
              gridRow: pos.gridRow,
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
      <div className="relative grid grid-cols-[auto_repeat(6,1fr)] grid-rows-[auto_repeat(30,20px)] gap-0.5 w-full bg-card p-4 rounded-lg border">
         {/* Headers */}
         <div className="row-span-1 col-span-1 sticky top-0 z-10 bg-card"></div>
         {days.map(day => <div key={day} className="row-span-1 col-span-1 text-center font-semibold text-muted-foreground text-sm p-2 sticky top-0 z-10 bg-card"><Skeleton className="h-5 w-12 mx-auto" /></div>)}
          {/* Time slots & Grid Lines */}
         {Array.from({ length: 15 }).map((_, index) => (
           <React.Fragment key={`skeleton-time-${index}`}>
            <div className={`row-start-${index * 2 + 2} col-span-1 text-center font-mono text-muted-foreground text-xs p-2 self-start`}><Skeleton className="h-4 w-10 mx-auto" /></div>
             {[...Array(6)].map((_, dayIndex) => (
                <div key={`${index}-${dayIndex}`} className={`row-start-${index * 2 + 2} row-span-2 col-start-${dayIndex + 2} border-t border-r border-dashed border-border/50`}></div>
             ))}
           </React.Fragment>
        ))}
         {/* Skeleton blocks */}
         <div className="absolute inset-0 top-[50px] left-[60px] right-0 bottom-0 p-1 grid grid-cols-[repeat(6,1fr)] grid-rows-[repeat(30,20px)] gap-1">
            <Skeleton className="col-start-2 row-start-2 row-span-4 rounded-lg" />
            <Skeleton className="col-start-4 row-start-4 row-span-3 rounded-lg" />
            <Skeleton className="col-start-6 row-start-10 row-span-4 rounded-lg" />
            <Skeleton className="col-start-3 row-start-16 row-span-3 rounded-lg" />
            <Skeleton className="col-start-5 row-start-1 row-span-4 rounded-lg" />
            <Skeleton className="col-start-3 row-start-8 row-span-2 rounded-lg" />
         </div>
      </div>
    </div>
  );

  return (
    <Card className="shadow-lg h-full sticky top-8">
      <CardHeader className="flex flex-row items-start sm:items-center justify-between">
        <div>
            <CardTitle className="font-headline flex items-center gap-2">
            <CalendarDays />
            برنامه هفتگی
            </CardTitle>
            <CardDescription>
                {isManualMode ? "برنامه ساخته شده توسط شما." : "برنامه بهینه پیشنهاد شده توسط هوش مصنوعی."}
            </CardDescription>
        </div>
         {(scheduleItems.length > 0 || isManualMode) && !isLoading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
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
      </CardHeader>
      <CardContent className="pr-0 sm:pr-6">
        {isLoading ? (
          renderSkeleton()
        ) : (
          <>
             <div ref={scheduleRef} className="relative grid grid-cols-[auto_repeat(6,1fr)] grid-rows-[auto_repeat(30,20px)] w-full bg-card p-4 rounded-lg border">
                {/* Headers */}
                <div className="row-span-1 col-span-1 sticky top-0 z-10 bg-card"></div>
                {days.map(day => <div key={day} className="row-span-1 col-span-1 text-center font-semibold text-muted-foreground text-sm p-2 sticky top-0 z-10 bg-card">{day}</div>)}
                
                {/* Time slots & Grid Lines */}
                {Array.from({ length: 15 }).map((_, index) => (
                   <React.Fragment key={`time-${index}`}>
                    <div className={`row-start-${index * 2 + 2} col-span-1 text-center font-mono text-muted-foreground text-xs p-2 self-start -translate-y-2`}>{`${index + 7}:00`}</div>
                     {[...Array(6)].map((_, dayIndex) => (
                        <div key={`${index}-${dayIndex}`} className={`row-start-${index * 2 + 2} row-span-2 col-start-${dayIndex + 2} border-t border-r border-dashed border-border/50`}></div>
                     ))}
                   </React.Fragment>
                ))}
                
                
                {/* Schedule Items */}
                {renderScheduleItems()}
            </div>

            {isManualMode && manualConflicts.length > 0 && (
                 <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4 ml-2" />
                    <AlertTitle className="font-headline">هشدار تداخل زمانی</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pr-4 space-y-1 mt-2">
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
                    <Group className="h-4 w-4 ml-2 text-primary" />
                    <AlertTitle className="font-headline text-primary">گروه پیشنهادی: {scheduleResult.recommendedGroup}</AlertTitle>
                  </Alert>
                )}
                {scheduleResult.conflicts && scheduleResult.conflicts.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4 ml-2" />
                    <AlertTitle className="font-headline">تداخل در برنامه</AlertTitle>
                    <AlertDescription>
                      دروس زیر به دلیل تداخل قابل برنامه‌ریزی نبودند:
                      <div className="flex flex-wrap gap-2 mt-2">
                        {scheduleResult.conflicts.map(c => <Badge key={c} variant="destructive">{c}</Badge>)}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                {scheduleResult.rationale && (
                   <Alert>
                    <Lightbulb className="h-4 w-4 ml-2" />
                    <AlertTitle className="font-headline">منطق هوش مصنوعی</AlertTitle>
                    <AlertDescription>
                      {scheduleResult.rationale}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
