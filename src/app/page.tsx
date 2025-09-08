import CourseScheduler from '@/components/course-scheduler';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { BookHeart, Bot, Github } from 'lucide-react';
import AiAssistant from '@/components/ai-assistant';

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar title="دستیار هوشمند">
        <SidebarHeader>
           <div className="inline-flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
              <h2 className="font-headline text-lg font-semibold tracking-tighter">
                دستیار هوشمند
              </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <AiAssistant />
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
        <header className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <BookHeart className="h-6 w-6 text-primary hidden sm:flex" />
               <h1 className="font-headline text-xl md:text-2xl font-bold tracking-tighter">
                انتخاب واحد هوشمند KPU
              </h1>
            </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <CourseScheduler />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
