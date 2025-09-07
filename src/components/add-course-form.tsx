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
import type { Course } from "@/types";
import { PlusCircle, Trash2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "نام درس باید حداقل ۲ حرف باشد." }),
  code: z.string().min(3, { message: "کد درس باید حداقل ۳ حرف باشد." }),
  instructorName: z.string().min(2, { message: "نام استاد باید حداقل ۲ حرف باشد." }),
  category: z.enum(["عمومی", "تخصصی", "تربیتی", "فرهنگی"], {
    required_error: "انتخاب دسته‌بندی الزامی است.",
  }),
  schedule: z.array(z.object({
    timeslot: z.string().regex(/^[^\s]+\s\d{1,2}:\d{2}-\d{1,2}:\d{2}$/, {
      message: 'فرمت زمان باید "روز ساعت شروع-ساعت پایان" باشد (مثال: شنبه 10:00-12:00)',
    }),
    location: z.string().min(1, { message: "مکان کلاس الزامی است." }),
  })).min(1, "حداقل یک زمان‌بندی برای درس مورد نیاز است."),
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
      instructorName: "",
      schedule: [{ timeslot: "", location: "" }],
      group: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedule"
  });

  function onSubmit(values: AddCourseFormValues) {
    const instructorId = values.instructorName.replace(/\s+/g, '-').toLowerCase();
    
    const newCourse: Omit<Course, "id"> = {
      name: values.name,
      code: values.code,
      instructors: [{ id: instructorId, name: values.instructorName }],
      category: values.category,
      timeslots: values.schedule.map(s => s.timeslot),
      locations: values.schedule.map(s => s.location),
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

        <div className="space-y-4">
          <FormLabel>زمان و مکان کلاس‌ها</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2 p-2 border rounded-lg bg-secondary/30">
               <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                 <FormField
                  control={form.control}
                  name={`schedule.${index}.timeslot`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">زمان کلاس</FormLabel>
                      <FormControl>
                        <Input placeholder="شنبه 14:00-16:00" {...field} />
                      </FormControl>
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
                        <Input placeholder="کلاس 201" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               </div>
               {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="shrink-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => append({ timeslot: "", location: "" })}>
            افزودن زمان دیگر
          </Button>
          <FormMessage>{form.formState.errors.schedule?.message}</FormMessage>
        </div>
        
        <Button type="submit" className="w-full" disabled={isProcessing}>
          <PlusCircle className="ml-2 h-4 w-4" />
          افزودن درس
        </Button>
      </form>
    </Form>
  );
}
