import CourseScheduler from '@/components/course-scheduler';
import { Button } from '@/components/ui/button';
import { BookHeart, Github } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-svh">
        <header className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <BookHeart className="h-6 w-6 text-primary" />
              <h1 className="font-headline text-lg sm:text-xl md:text-2xl font-bold tracking-tighter">
                انتخاب واحد هوشمند KPU
              </h1>
            </div>
            <a href="https://github.com/firebase/studio-content-frameless-ai" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost">
                <Github className="ml-2" />
                مشاهده در گیت‌هاب
              </Button>
            </a>
        </header>
        <main className="p-4 sm:p-6 md:p-8 flex-1">
          <CourseScheduler />
        </main>
        <footer className="bg-card/50 text-center text-sm text-muted-foreground p-4 border-t mt-auto">
          <p>
            توسعه داده شده توسط حسین طاهری | تمامی حقوق محفوظ است &copy; {new Date().getFullYear()}
          </p>
        </footer>
    </div>
  );
}
