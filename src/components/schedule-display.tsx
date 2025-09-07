"use client";

import type { SuggestOptimalScheduleOutput } from "@/ai/flows/suggest-optimal-schedule";
import { AlertCircle, CalendarDays, Lightbulb, Group, Download, FileDown, ImageDown, Sheet as ExcelIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { useRef, useCallback } from "react";
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface ScheduleDisplayProps {
  scheduleResult: SuggestOptimalScheduleOutput | null;
  isLoading: boolean;
}

const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const timeSlots = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`); // 8:00 to 20:00

const dayToGridCol = (day: string) => {
  const d = day.trim().toLowerCase();
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

const timeToGridRow = (time: string) => {
  const hour = parseInt(time.split(":")[0], 10);
  return hour - 7; // 8:00 is row 1
};

const getGridPosition = (timeslot: string) => {
  try {
    const parts = timeslot.split(" ");
    if (parts.length < 2) return null;

    const day = parts[0];
    const timeRange = parts[1];
    const [startTime, endTime] = timeRange.split("-");
    
    const gridColumn = dayToGridCol(day);
    const gridRowStart = timeToGridRow(startTime);
    // Use Math.ceil for end time to handle cases like 13:30
    const gridRowEnd = Math.ceil(timeToGridRow(endTime.split(':')[0] + ':00'));

    if (gridColumn === 0 || !gridRowStart || !gridRowEnd) return null;
    
    return { 
      gridColumn,
      gridRow: `${gridRowStart} / ${gridRowEnd + 1}`, // +1 because grid row end is exclusive
    };
  } catch (e) {
    console.error("Error parsing timeslot:", timeslot, e);
    return null;
  }
};


export default function ScheduleDisplay({ scheduleResult, isLoading }: ScheduleDisplayProps) {
  const scheduleRef = useRef<HTMLDivElement>(null);

  const downloadAsPng = useCallback(() => {
    if (scheduleRef.current === null) return;
    toPng(scheduleRef.current, { cacheBust: true })
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
    toPng(scheduleRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const pdf = new jsPDF('landscape', 'px', [scheduleRef.current!.offsetWidth, scheduleRef.current!.offsetHeight]);
        pdf.addImage(dataUrl, 'PNG', 0, 0, scheduleRef.current!.offsetWidth, scheduleRef.current!.offsetHeight);
        pdf.save('schedule.pdf');
      })
      .catch((err) => console.error(err));
  }, [scheduleRef]);

  const downloadAsCsv = useCallback(() => {
    if (!scheduleResult || scheduleResult.schedule.length === 0) return;
    const csvData = scheduleResult.schedule.map(item => ({
      'نام درس': item.courseName,
      'کد درس': item.courseCode,
      'استاد': item.instructor,
      'زمان': item.timeslot,
      'مکان': item.location,
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
  }, [scheduleResult]);

  const renderScheduleItems = () => {
    if (!scheduleResult || scheduleResult.schedule.length === 0) {
      return null;
    }
    
    return scheduleResult.schedule.map((item, index) => {
      const pos = getGridPosition(item.timeslot);
      if (!pos) return null;
      
       const colorClasses = [
        "bg-sky-100 border-sky-200 text-sky-800 dark:bg-sky-900/50 dark:border-sky-800 dark:text-sky-200",
        "bg-teal-100 border-teal-200 text-teal-800 dark:bg-teal-900/50 dark:border-teal-800 dark:text-teal-200",
        "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/50 dark:border-amber-800 dark:text-amber-200",
        "bg-violet-100 border-violet-200 text-violet-800 dark:bg-violet-900/50 dark:border-violet-800 dark:text-violet-200",
        "bg-rose-100 border-rose-200 text-rose-800 dark:bg-rose-900/50 dark:border-rose-800 dark:text-rose-200",
        "bg-cyan-100 border-cyan-200 text-cyan-800 dark:bg-cyan-900/50 dark:border-cyan-800 dark:text-cyan-200",
      ];
      
      const courseColor = item.group ? (parseInt(item.group.replace('گروه', '').trim()) % colorClasses.length) : (index % colorClasses.length);

      return (
        <div
          key={index}
          className={`p-2 rounded-lg border text-xs flex flex-col justify-center shadow-sm ${colorClasses[courseColor]}`}
          style={{ gridColumn: pos.gridColumn, gridRow: pos.gridRow }}
        >
          <p className="font-bold">{item.courseName}</p>
          <p className="text-xs opacity-80">{item.instructor}</p>
          <p className="text-xs opacity-60 mt-1">{item.location}</p>
        </div>
      );
    });
  };

  const renderSkeleton = () => (
     <div className="relative grid grid-cols-[auto_repeat(6,1fr)] grid-rows-[auto_repeat(13,1fr)] gap-0 w-full min-h-[520px]">
      {/* Grid structure */}
      <div className="row-span-1 col-span-1 sticky top-0 z-10 bg-card"></div>
      {days.map(day => (
        <div key={day} className="row-span-1 col-span-1 text-center font-semibold text-muted-foreground text-sm p-2 sticky top-0 z-10 bg-card border-b">
          <Skeleton className="h-4 w-12 mx-auto" />
        </div>
      ))}
      {timeSlots.map((time, index) => (
        <div key={time} className={`row-start-${index + 2} col-span-1 text-left font-mono text-muted-foreground text-xs p-2 pr-4 border-r`}>{time}</div>
      ))}
       {[...Array(6 * 13)].map((_, i) => (
        <div key={i} className="border-r border-b"></div>
      ))}
      {/* Skeleton blocks */}
      <div className="absolute inset-0 p-1 grid grid-cols-[auto_repeat(6,1fr)] grid-rows-[repeat(13,minmax(0,1fr))] gap-1">
        <Skeleton className="col-start-2 row-start-2 row-end-4 rounded-lg" />
        <Skeleton className="col-start-4 row-start-3 row-end-5 rounded-lg" />
        <Skeleton className="col-start-6 row-start-6 row-end-8 rounded-lg" />
        <Skeleton className="col-start-3 row-start-9 row-end-11 rounded-lg" />
        <Skeleton className="col-start-5 row-start-1 row-end-3 rounded-lg" />
      </div>
    </div>
  );

  return (
    <Card className="shadow-lg h-full sticky top-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="font-headline flex items-center gap-2">
            <CalendarDays className="ml-2" />
            برنامه هفتگی پیشنهادی
            </CardTitle>
            <CardDescription>برنامه بهینه پیشنهاد شده توسط هوش مصنوعی در اینجا نمایش داده می‌شود.</CardDescription>
        </div>
         {scheduleResult && !isLoading && (
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
      <CardContent>
        {isLoading ? (
          renderSkeleton()
        ) : (
          <>
             <div ref={scheduleRef} className="relative grid grid-cols-[auto_repeat(6,1fr)] grid-rows-[auto_repeat(13,40px)] gap-0 w-full bg-card rounded-lg border">
                {/* Headers */}
                <div className="row-span-1 col-span-1 sticky top-0 z-10 bg-card"></div>
                {days.map(day => <div key={day} className="row-span-1 col-span-1 text-center font-semibold text-muted-foreground text-sm p-2 sticky top-0 z-10 bg-card border-b">{day}</div>)}
                
                {/* Time slots */}
                {timeSlots.map((time, index) => (
                    <div key={time} className={`row-start-${index + 2} col-span-1 text-center font-mono text-muted-foreground text-xs p-2 border-r`}>{time}</div>
                ))}
                
                {/* Grid Lines */}
                <div className="col-start-2 col-span-full row-start-2 row-span-full grid grid-cols-6 grid-rows-13">
                  {[...Array(6 * 13)].map((_, i) => (
                      <div key={i} className="border-r border-b"></div>
                  ))}
                </div>
                
                {/* Schedule Items Container */}
                <div className="absolute inset-0 top-[41px] right-[57px] p-1 grid grid-cols-6 grid-rows-[repeat(13,40px)] gap-1">
                  {(!scheduleResult || scheduleResult.schedule.length === 0) && (
                     <div className="col-span-full row-span-full flex items-center justify-center text-center">
                        <p className="text-muted-foreground">پس از افزودن دروس و تعیین اولویت‌ها، <br /> بهترین برنامه ممکن برای شما اینجا ساخته می‌شود.</p>
                     </div>
                  )}
                  {renderScheduleItems()}
                </div>
            </div>

            {scheduleResult && (
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
