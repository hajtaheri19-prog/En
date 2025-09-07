"use client"

import type { Course, StudentPreferences } from "@/types";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

const preferencesSchema = z.object({
  preferDayOff: z.string().optional(),
  shiftPreference: z.enum(["больше-утром", "больше-днем", "меньше-утром", "меньше-днем", ""]).optional(),
  instructorPreferences: z.array(z.object({
    courseCode: z.string().nonempty("انتخاب درس الزامی است."),
    instructorId: z.string().nonempty("انتخاب استاد الزامی است."),
  })),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

interface StudentPreferencesFormProps {
  preferences: StudentPreferences;
  onPreferencesChange: (preferences: StudentPreferences) => void;
  generalCourses: Course[];
  isProcessing: boolean;
}

export default function StudentPreferencesForm({ preferences, onPreferencesChange, generalCourses, isProcessing }: StudentPreferencesFormProps) {
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      ...preferences,
      shiftPreference: preferences.shiftPreference || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "instructorPreferences",
  });

  // Automatically call onPreferencesChange when form values change
  form.watch((values) => {
    onPreferencesChange(values as StudentPreferences);
  });

  // Get unique instructors for general courses
  const uniqueGeneralInstructors = Array.from(new Set(
    generalCourses.flatMap(course => course.instructors.map(inst => JSON.stringify(inst)))
  )).map(instStr => JSON.parse(instStr));
  
  const uniqueGeneralCourses = Array.from(new Map(generalCourses.map(c => [c.code, c])).values());


  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="preferDayOff"
          render={({ field }) => (
            <FormItem>
              <FormLabel>روز تعطیل دلخواه</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl" disabled={isProcessing}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="یک روز را انتخاب کنید (اختیاری)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="شنبه">شنبه</SelectItem>
                  <SelectItem value="یکشنبه">یکشنبه</SelectItem>
                  <SelectItem value="دوشنبه">دوشنبه</SelectItem>
                  <SelectItem value="سه‌شنبه">سه‌شنبه</SelectItem>
                  <SelectItem value="چهارشنبه">چهارشنبه</SelectItem>
                  <SelectItem value="پنجشنبه">پنجشنبه</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>روزی که ترجیح می‌دهید هیچ کلاسی نداشته باشید.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shiftPreference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ترجیح شیفت کلاس‌ها</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl" disabled={isProcessing}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="ترجیح خود را انتخاب کنید (اختیاری)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="больше-утром">بیشتر کلاس‌ها صبح</SelectItem>
                  <SelectItem value="больше-днем">بیشتر کلاس‌ها عصر</SelectItem>
                  <SelectItem value="меньше-утром">کمتر کلاس صبح</SelectItem>
                  <SelectItem value="меньше-днем">کمتر کلاس عصر</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>به هوش مصنوعی بگویید کلاس‌های صبح را ترجیح می‌دهید یا عصر.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
            <FormLabel>اولویت استاد برای دروس عمومی</FormLabel>
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-2 border rounded-lg">
                    <FormField
                    control={form.control}
                    name={`instructorPreferences.${index}.courseCode`}
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl" disabled={isProcessing}>
                                <FormControl><SelectTrigger><SelectValue placeholder="درس" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {uniqueGeneralCourses.map(course => (
                                        <SelectItem key={course.id} value={course.code}>{course.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name={`instructorPreferences.${index}.instructorId`}
                    render={({ field }) => (
                        <FormItem className="flex-1">
                             <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl" disabled={isProcessing}>
                                <FormControl><SelectTrigger><SelectValue placeholder="استاد" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {uniqueGeneralInstructors.map(inst => (
                                        <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isProcessing}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
             <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ courseCode: "", instructorId: "" })}
                disabled={isProcessing || uniqueGeneralCourses.length === 0}
            >
                افزودن اولویت استاد
            </Button>
             {uniqueGeneralCourses.length === 0 && (
                <p className="text-xs text-muted-foreground">برای تعیین اولویت، ابتدا باید یک درس عمومی اضافه کنید.</p>
            )}
        </div>
      </form>
    </Form>
  );
}
