"use client";

import type { SuggestOptimalScheduleOutput } from "@/ai/flows/suggest-optimal-schedule";
import { AlertCircle, CalendarDays, Lightbulb } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface ScheduleDisplayProps {
  scheduleResult: SuggestOptimalScheduleOutput | null;
  isLoading: boolean;
}

const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];
const timeSlots = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`); // 8:00 to 19:00

const dayToGridCol = (day: string) => {
  const d = day.toLowerCase();
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
  return hour - 8 + 2; // +2 to account for header row
};

const getGridPosition = (timeslot: string) => {
  try {
    const [day, timeRange] = timeslot.split(" ");
    const [startTime, endTime] = timeRange.split("-");
    
    const gridColumnStart = dayToGridCol(day);
    const gridRowStart = timeToGridRow(startTime);
    const gridRowEnd = timeToGridRow(endTime);
    
    return { gridColumnStart, gridRowStart, gridRowEnd };
  } catch (e) {
    return null;
  }
};


export default function ScheduleDisplay({ scheduleResult, isLoading }: ScheduleDisplayProps) {

  const renderSchedule = () => {
    if (!scheduleResult || scheduleResult.schedule.length === 0) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <p className="text-muted-foreground">برنامه ایجاد شده شما در اینجا نمایش داده می‌شود.</p>
        </div>
      );
    }
    
    return scheduleResult.schedule.map((item, index) => {
      const pos = getGridPosition(item.timeslot);
      if (!pos) return null;
      
      const { gridColumnStart, gridRowStart, gridRowEnd } = pos;
      
      const colorClasses = [
        "bg-blue-100 border-blue-300 text-blue-800",
        "bg-green-100 border-green-300 text-green-800",
        "bg-yellow-100 border-yellow-300 text-yellow-800",
        "bg-purple-100 border-purple-300 text-purple-800",
        "bg-pink-100 border-pink-300 text-pink-800",
        "bg-indigo-100 border-indigo-300 text-indigo-800",
      ];
      
      return (
        <div
          key={index}
          className={`p-2 rounded-lg border text-xs flex flex-col justify-center ${colorClasses[index % colorClasses.length]}`}
          style={{ gridColumn: gridColumnStart, gridRow: `${gridRowStart} / ${gridRowEnd}` }}
        >
          <p className="font-bold">{item.courseCode}</p>
          <p className="text-xs">{item.instructor}</p>
        </div>
      );
    });
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-[auto_repeat(6,1fr)] grid-rows-[auto_repeat(12,1fr)] gap-1 w-full min-h-[400px] pointer-events-none">
       {/* Headers */}
      <div className="p-2"></div>
      {days.map(day => <div key={day} className="p-2 text-center font-semibold text-muted-foreground text-sm"><Skeleton className="h-4 w-12 mx-auto" /></div>)}
      {/* Time slots and grid lines */}
      {timeSlots.map(time => (
        <div key={time} className="p-2 text-right font-mono text-muted-foreground text-xs row-start-auto">{time}</div>
      ))}
      {[...Array(72)].map((_, i) => <div key={i} className="border-r border-b border-dashed"></div>)}
      {/* Skeleton blocks */}
      <Skeleton className="col-start-2 row-start-3 row-end-5 rounded-lg" />
      <Skeleton className="col-start-4 row-start-4 row-end-6 rounded-lg" />
      <Skeleton className="col-start-6 row-start-7 row-end-9 rounded-lg" />
    </div>
  );

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <CalendarDays className="ml-2" />
          برنامه ایجاد شده
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          renderSkeleton()
        ) : (
          <>
            <div className="grid grid-cols-[auto_repeat(6,1fr)] grid-rows-[auto_repeat(12,1fr)] gap-1 w-full bg-card rounded-lg p-2 border">
              {/* Headers */}
              <div className="p-2"></div>
              {days.map(day => <div key={day} className="p-2 text-center font-semibold text-muted-foreground text-sm">{day}</div>)}
              {/* Time slots and grid lines */}
              {timeSlots.map(time => (
                <div key={time} className="p-2 text-left font-mono text-muted-foreground text-xs row-start-auto border-l border-dashed">{time}</div>
              ))}
              {[...Array(6*12)].map((_, i) => <div key={i} className={`border-l border-b border-dashed ${ (i) % 6 === 0 ? 'border-l-0' : ''}`}></div>)}
              
              {/* Rendered schedule */}
              {renderSchedule()}
            </div>

            {scheduleResult && (
              <div className="mt-6 space-y-4">
                {scheduleResult.conflicts.length > 0 && (
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
