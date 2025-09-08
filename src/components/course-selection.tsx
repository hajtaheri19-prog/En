"use client";

import {
  FileUp,
  Loader2,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";


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
        />
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
    </div>
  );
}
