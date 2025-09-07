"use client";

import {
  FileUp,
  Loader2,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";


interface CourseSelectionProps {
  onPdfUpload: (file: File) => void;
  isProcessing: boolean;
}

export default function CourseSelection({
  onPdfUpload,
  isProcessing,
}: CourseSelectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onPdfUpload(file);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <FileUp className="h-4 w-4" />
        <AlertTitle>آپلود چارت درسی</AlertTitle>
        <AlertDescription>
          فایل PDF چارت درسی ارائه شده توسط دانشگاه را اینجا بارگذاری کنید تا دروس به صورت خودکار استخراج شوند.
        </AlertDescription>
      </Alert>
      <Button 
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full"
          disabled={isProcessing}
          aria-label="آپلود PDF"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <FileUp className="h-4 w-4 ml-2" />
          )}
          <span>{isProcessing ? "در حال پردازش..." : "انتخاب و آپلود فایل PDF"}</span>
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="application/pdf"
        />
    </div>
  );
}
