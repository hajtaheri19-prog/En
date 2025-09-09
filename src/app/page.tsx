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
        <div className="flex flex-col min-h-svh">
            <header className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  <SidebarTrigger asChild className="h-8 w-8 md:hidden">
                    <Button variant="ghost" size="icon">
                      <Bot />
                    </Button>
                  </SidebarTrigger>
                  <BookHeart className="h-6 w-6 text-primary hidden sm:flex" />
                   <h1 className="font-headline text-xl md:text-2xl font-bold tracking-tighter">
                    انتخاب واحد هوشمند KPU
                  </h1>
                </div>
                 <SidebarTrigger className="hidden md:flex" />
            </header>
            <main className="p-4 md:p-6 lg:p-8 flex-1">
              <CourseScheduler />
            </main>
            <footer className="bg-card/50 text-center text-sm text-muted-foreground p-4 border-t mt-auto">
              <p>
                توسعه داده شده توسط حسین طاهری | تمامی حقوق محفوظ است &copy; {new Date().getFullYear()}
              </p>
            </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
