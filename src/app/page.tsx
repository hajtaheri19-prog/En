import CourseScheduler from '@/components/course-scheduler';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { BookHeart, Github } from 'lucide-react';

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <div className="inline-flex items-center gap-2">
            <BookHeart className="h-6 w-6 text-primary" />
            <h2 className="font-headline text-lg font-semibold tracking-tighter">
              انتخاب واحد هوشمند
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Add sidebar navigation here if needed */}
        </SidebarContent>
        <SidebarFooter>
           <a href="https://github.com/firebase/studio-content-frameless-ai" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" className="w-full justify-start">
              <Github className="ml-2" />
              مشاهده در گیت‌هاب
            </Button>
          </a>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger />
            <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tighter">
              داشبورد انتخاب واحد
            </h1>
        </header>
        <main className="p-4 md:p-8">
          <CourseScheduler />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
