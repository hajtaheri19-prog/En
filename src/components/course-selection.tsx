"use client";

import {
  FileUp,
  Loader2,
  Download,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


interface CourseSelectionProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  accept: string;
  title: string;
  description: string;
}

export default function CourseSelection({
  onFileUpload,
  isProcessing,
  accept,
  title,
  description
}: CourseSelectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      event.target.value = "";
    }
  };

  const getButtonText = () => {
      if (isProcessing) return "در حال پردازش...";
      if (accept.includes('pdf')) return "انتخاب و آپلود فایل (PDF)";
      if (accept.includes('csv') || accept.includes('sheet') || accept.includes('excel')) {
          return "انتخاب و آپلود فایل (اکسل/CSV)";
      }
      return "انتخاب و آپلود فایل";
  }

  const handleDownloadSample = () => {
    const sampleData = [
        {
            "کد درس": "40101",
            "نام درس": "تاریخ امامت",
            "نام استاد": "دکتر حسینی",
            "دسته بندی": "عمومی",
            "زمانبندی": "شنبه 08:00-10:00",
            "مکان": "کلاس 101",
            "گروه": "",
        },
        {
            "شماره و گروه درس": "91034_01",
            "نام درس": "فیزیک ۱",
            "نام استاد": "دکتر احمدی",
            "دسته بندی": "تخصصی",
            "ساعات ارائه و امتحان": "درس(اصلی): شنبه 10:00-12:00\nدرس(حل تمرین): دوشنبه 10:00-11:00\nامتحان: 1403/11/01",
            "مکان": "کلاس 202;آزمایشگاه فیزیک",
            "گروه": "01",
        },
        {
            "شماره و گروه درس": "91034_02",
            "نام درس": "فیزیک ۱",
            "نام استاد": "دکتر رضایی",
            "دسته بندی": "تخصصی",
            "ساعات ارائه و امتحان": "درس(اصلی): یکشنبه 13:00-15:00\nدرس(حل تمرین): سه شنبه 13:00-14:00\nامتحان: 1403/11/01",
            "مکان": "کلاس 203;آزمایشگاه فیزیک",
            "گروه": "02",
        },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "نمونه");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, 'نمونه-چارت-درسی.xlsx');
  };

  const isExcel = accept.includes('csv') || accept.includes('sheet') || accept.includes('excel');

  return (
    <div className="space-y-4">
      <Alert>
        <FileUp className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {description}
        </AlertDescription>
      </Alert>
      <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={accept}
          disabled={isProcessing}
        />
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
            disabled={isProcessing}
            aria-label="آپلود فایل"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <FileUp className="h-4 w-4 ml-2" />
            )}
            <span>{getButtonText()}</span>
        </Button>
        {isExcel && (
            <Button onClick={handleDownloadSample} variant="secondary" className="w-full sm:w-auto" disabled={isProcessing}>
                <Download className="h-4 w-4 ml-2" />
                دانلود فایل نمونه
            </Button>
        )}
      </div>
    </div>
  );
}
