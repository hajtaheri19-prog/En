import CourseScheduler from '@/components/course-scheduler';
import { BookHeart } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-3">
          <BookHeart className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter">
            انتخاب واحد هوشمند KPU
          </h1>
        </div>
        <p className="mt-2 text-lg text-muted-foreground">
          دستیار هوشمند انتخاب واحد شما برای دانشگاه فرهنگیان
        </p>
      </header>
      <CourseScheduler />
    </main>
  );
}
