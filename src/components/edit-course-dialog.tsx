"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Course, TimeSlot, CourseGroup } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Save, Trash2 } from "lucide-react";
import { useEffect } from "react";

const scheduleSchema = z.object({
  day: z.string().nonempty({ message: "انتخاب روز الزامی است." }),
  timeSlotId: z.string().nonempty({ message: "انتخاب سانس الزامی است." }),
  location: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(2, { message: "نام درس باید حداقل ۲ حرف باشد." }),
  code: z.string().min(3, { message: "کد درس باید حداقل ۳ حرف باشد." }),
  instructorName: z.string().min(2, { message: "نام استاد باید حداقل ۲ حرف باشد." }),
  category: z.enum(["عمومی", "تخصصی", "تربیتی", "فرهنگی"]).optional(),
  schedule: z.array(scheduleSchema).min(1, "حداقل یک زمان‌بندی برای درس مورد نیاز است."),
  group: z.string().optional(),
});

type EditCourseFormValues = z.infer<typeof formSchema>;

interface EditCourseDialogProps {
  course: Course;
  onUpdateCourse: (course: Course) => void;
  onOpenChange: (open: boolean) => void;
  timeSlots: TimeSlot[];
  courseGroups: CourseGroup[];
}

const daysOfWeek = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];

export default function EditCourseDialog({ course, onUpdateCourse, onOpenChange, timeSlots, courseGroups }: EditCourseDialogProps) {
    const parseTimeslot = (timeslot: string, location: string) => {
        const dayMatch = daysOfWeek.find(day => timeslot.startsWith(day));
        if (!dayMatch) return { day: "", timeSlotId: "", location };

        const timeRange = timeslot.substring(dayMatch.length).trim();
        const timeSlotMatch = timeSlots.find(ts => `${ts.start}-${ts.end}` === timeRange);

        return { day: dayMatch, timeSlotId: timeSlotMatch?.id || "", location: location === 'مشخص نشده' ? '' : location };
    };

    const form = useForm<EditCourseFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: course.name,
            code: course.code,
            instructorName: course.instructors[0]?.name || "",
            category: course.category,
            group: course.group || "",
            schedule: course.timeslots.map((ts, index) => parseTimeslot(ts, course.locations[index])),
        },
    });
    
    useEffect(() => {
        form.reset({
            name: course.name,
            code: course.code,
            instructorName: course.instructors[0]?.name || "",
            category: course.category,
            group: course.group || "",
            schedule: course.timeslots.map((ts, index) => parseTimeslot(ts, course.locations[index])),
        });
    }, [course, form, timeSlots]);


    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "schedule"
    });

    function onSubmit(values: EditCourseFormValues) {
        const instructorId = values.instructorName.replace(/\s+/g, '-').toLowerCase();

        const updatedCourse: Course = {
            ...course,
            name: values.name,
            code: values.code,
            instructors: [{ id: instructorId, name: values.instructorName }],
            category: values.category || "تخصصی",
            timeslots: values.schedule.map(s => {
                const timeSlot = timeSlots.find(ts => ts.id === s.timeSlotId);
                return `${s.day} ${timeSlot?.start}-${timeSlot?.end}`;
            }),
            locations: values.schedule.map(s => s.location || 'مشخص نشده'),
            group: values.group || undefined,
        };
        onUpdateCourse(updatedCourse);
    }

  return (
    <Dialog open={!!course} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>ویرایش درس: {course.name}</DialogTitle>
          <DialogDescription>اطلاعات درس را در اینجا ویرایش کرده و سپس ذخیره کنید.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام درس</FormLabel>
                    <FormControl><Input placeholder="مثال: مبانی کامپیوتر" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد درس</FormLabel>
                    <FormControl><Input placeholder="مثال: CS101" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="instructorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام استاد</FormLabel>
                  <FormControl><Input placeholder="مثال: دکتر احمدی" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>دسته‌بندی</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                      <FormControl><SelectTrigger><SelectValue placeholder="انتخاب دسته‌بندی (اختیاری)" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="عمومی">عمومی</SelectItem>
                        <SelectItem value="تخصصی">تخصصی</SelectItem>
                        <SelectItem value="تربیتی">تربیتی</SelectItem>
                        <SelectItem value="فرهنگی">فرهنگی</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>گروه</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={courseGroups.length === 0}>
                      <FormControl><SelectTrigger><SelectValue placeholder={courseGroups.length === 0 ? "اول گروه تعریف کنید" : "انتخاب گروه (اختیاری)"} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {courseGroups.map(cg => <SelectItem key={cg.id} value={cg.name}>{cg.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormLabel>زمان و مکان کلاس‌ها</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row items-end gap-2 p-2 border rounded-lg bg-secondary/30">
                  <div className="w-full flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name={`schedule.${index}.day`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">روز هفته</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                            <FormControl><SelectTrigger><SelectValue placeholder="انتخاب روز" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`schedule.${index}.timeSlotId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">سانس کلاس</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={timeSlots.length === 0}>
                            <FormControl><SelectTrigger><SelectValue placeholder={timeSlots.length === 0 ? "اول سانس تعریف کنید" : "انتخاب سانس"} /></SelectTrigger></FormControl>
                            <SelectContent>
                              {timeSlots.map(ts => <SelectItem key={ts.id} value={ts.id}>{ts.name} ({ts.start}-{ts.end})</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`schedule.${index}.location`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">مکان کلاس</FormLabel>
                          <FormControl><Input placeholder="مکان (اختیاری)" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="shrink-0 mt-2 sm:mt-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ day: "", timeSlotId: "", location: "" })}>
                افزودن زمان دیگر
              </Button>
              <FormMessage>{form.formState.errors.schedule?.message}</FormMessage>
            </div>
            <DialogFooter className="pt-4">
                 <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>لغو</Button>
                 <Button type="submit">
                    <Save className="ml-2 h-4 w-4" />
                    ذخیره تغییرات
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
