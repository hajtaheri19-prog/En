"use client";

import { useForm } from "react-hook-form";
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
import type { Course } from "@/types";
import { INSTRUCTORS } from "@/lib/mock-data";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "نام درس باید حداقل ۲ حرف باشد." }),
  code: z.string().min(3, { message: "کد درس باید حداقل ۳ حرف باشد." }),
  instructorId: z.string({ required_error: "انتخاب استاد الزامی است." }),
  category: z.enum(["عمومی", "تخصصی", "تربیتی", "فرهنگی"], {
    required_error: "انتخاب دسته‌بندی الزامی است.",
  }),
  timeslot: z.string().regex(/^[^\s]+\s\d{1,2}:\d{2}-\d{1,2}:\d{2}$/, {
    message: 'فرمت زمان باید "روز ساعت شروع-ساعت پایان" باشد (مثال: شنبه 10:00-12:00)',
  }),
  location: z.string().min(1, { message: "مکان کلاس الزامی است." }),
  group: z.string().optional(),
});

type AddCourseFormValues = z.infer<typeof formSchema>;

interface AddCourseFormProps {
  onAddCourse: (course: Omit<Course, "id">) => void;
  isProcessing: boolean;
}

export function AddCourseForm({ onAddCourse, isProcessing }: AddCourseFormProps) {
  const form = useForm<AddCourseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      timeslot: "",
      location: "",
      group: "",
    },
  });

  function onSubmit(values: AddCourseFormValues) {
    const instructor = Object.values(INSTRUCTORS).find(inst => inst.id === values.instructorId);
    if (!instructor) {
        console.error("استاد انتخاب شده نامعتبر است.");
        return;
    }

    const newCourse: Omit<Course, "id"> = {
      name: values.name,
      code: values.code,
      instructors: [instructor],
      category: values.category,
      timeslot: values.timeslot,
      location: values.location,
      group: values.group || undefined,
    };
    onAddCourse(newCourse);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="instructorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>استاد</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="یک استاد را انتخاب کنید" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(INSTRUCTORS).map(inst => (
                     <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="یک دسته‌بندی را انتخاب کنید" />
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
                <FormLabel>گروه (اختیاری)</FormLabel>
                <FormControl>
                  <Input placeholder="مثال: گروه 5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
         <FormField
          control={form.control}
          name="timeslot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>زمان کلاس</FormLabel>
              <FormControl>
                <Input placeholder="مثال: شنبه 14:00-16:00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>مکان کلاس</FormLabel>
              <FormControl>
                <Input placeholder="مثال: کلاس 201" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isProcessing}>
          <PlusCircle className="ml-2 h-4 w-4" />
          افزودن درس
        </Button>
      </form>
    </Form>
  );
}
