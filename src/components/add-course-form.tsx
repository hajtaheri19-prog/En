"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Course, TimeSlot, CourseGroup } from "@/types";
import { Copy, PlusCircle, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Label } from "@/components/ui/label";

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

type AddCourseFormValues = z.infer<typeof formSchema>;

interface AddCourseFormProps {
  onAddCourse: (course: Omit<Course, "id">) => void;
  isProcessing: boolean;
  timeSlots: TimeSlot[];
  courseGroups: CourseGroup[];
  availableCourses: Course[];
}

const daysOfWeek = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"];

export function AddCourseForm({ onAddCourse, isProcessing, timeSlots, courseGroups, availableCourses }: AddCourseFormProps) {
  const form = useForm<AddCourseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      instructorName: "",
      schedule: [{ day: "", timeSlotId: "", location: "" }],
      group: "",
      category: "تخصصی",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedule"
  });

  const uniqueCourses = useMemo(() => {
    const uniqueMap = new Map<string, Course>();
    availableCourses.forEach(course => {
        if (!uniqueMap.has(course.code)) {
            uniqueMap.set(course.code, course);
        }
    });
    return Array.from(uniqueMap.values());
  }, [availableCourses]);

  const handleCourseCopy = (courseCode: string) => {
    const courseToCopy = uniqueCourses.find(c => c.code === courseCode);
    if (courseToCopy) {
        form.setValue("name", courseToCopy.name);
        form.setValue("code", courseToCopy.code);
        form.setValue("category", courseToCopy.category);
    }
  }


  function onSubmit(values: AddCourseFormValues) {
    const instructorId = values.instructorName.replace(/\s+/g, '-').toLowerCase();
    
    const newCourse: Omit<Course, "id"> = {
      name: values.name,
      code: values.code,
      instructors: [{ id: instructorId, name: values.instructorName }],
      category: values.category || "تخصصی",
      timeslots: values.schedule.map(s => {
        const timeSlot = timeSlots.find(ts => ts.id === s.timeSlotId);
        return `${s.day} ${timeSlot?.start}-${timeSlot?.end}`
      }),
      locations: values.schedule.map(s => s.location || 'مشخص نشده'),
      group: values.group || undefined,
    };
    onAddCourse(newCourse);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="space-y-2">
            <Label>کپی اطلاعات از درس موجود (اختیاری)</Label>
            <div className="flex items-center gap-2">
                <Select onValueChange={handleCourseCopy} dir="rtl" disabled={uniqueCourses.length === 0}>
                   <SelectTrigger className="w-full">
                      <SelectValue placeholder={uniqueCourses.length === 0 ? "درسی برای کپی وجود ندارد" : "یک درس را برای کپی کردن انتخاب کنید"} />
                    </SelectTrigger>
                  <SelectContent>
                    {uniqueCourses.map(course => <SelectItem key={course.id} value={course.code}>{course.name} ({course.code})</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نام درس</FormLabel>
                <FormControl>
                  <Input placeholder="مثال: مبانی کامپیوتر" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input placeholder="مثال: CS101" {...field} />
                </FormControl>
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
              <FormControl>
                <Input placeholder="مثال: دکتر احمدی" {...field} />
              </FormControl>
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
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب دسته‌بندی (اختیاری)" />
                    </SelectTrigger>
                  </FormControl>
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
                   <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={courseGroups.length === 0 ? "اول گروه تعریف کنید" : "انتخاب گروه (اختیاری)"} />
                    </SelectTrigger>
                  </FormControl>
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
            <div key={field.id} className="flex flex-col sm:flex-row items-end gap-2 p-3 border rounded-lg bg-secondary/30">
               <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
                 <FormField
                  control={form.control}
                  name={`schedule.${index}.day`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">روز هفته</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
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
                       <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl" disabled={timeSlots.length === 0}>
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
                      <FormControl>
                        <Input placeholder="مکان (اختیاری)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               </div>
                <div className="flex w-full sm:w-auto mt-2 sm:mt-0">
                   {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="shrink-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => append({ day: "", timeSlotId: "", location: "" })}>
            افزودن زمان دیگر
          </Button>
          <FormMessage>{form.formState.errors.schedule?.message}</FormMessage>
        </div>
        
        <Button type="submit" className="w-full" disabled={isProcessing || timeSlots.length === 0}>
          <PlusCircle className="ml-2 h-4 w-4" />
          افزودن درس
        </Button>
        {timeSlots.length === 0 && <p className="text-xs text-destructive text-center">برای افزودن درس، ابتدا باید حداقل یک سانس کلاسی تعریف کنید.</p>}
      </form>
    </Form>
  );
}
