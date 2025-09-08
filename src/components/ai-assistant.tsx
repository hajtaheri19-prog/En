"use client";

import { menuSuggestionFlow } from "@/ai/flows/menu-suggestion-flow";
import { useState, useTransition, useRef, useEffect } from "react";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { SheetTitle } from "./ui/sheet";


type Message = {
  role: "user" | "model";
  content: { text: string }[];
};

export default function AiAssistant() {
  const [history, setHistory] = useState<Message[]>([]);
  const [context, setContext] = useState<string>("");
  const [isStreaming, startStreamingTransition] = useTransition();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [history, isStreaming]);


  const handleSendMessage = () => {
    if (!context.trim()) return;

    const newHistory: Message[] = [
      ...history,
      { role: "user", content: [{ text: context }] },
    ];
    setHistory(newHistory);
    const currentContext = context;
    setContext("");

    startStreamingTransition(async () => {
      try {
        const apiKey = (window as any).__GEMINI_API_KEY__;
        if (!apiKey) {
          toast({
            title: "کلید API مورد نیاز است",
            description: "لطفاً کلید API خود را در صفحه اصلی وارد کنید.",
            variant: "destructive",
          });
           setHistory(prev => prev.slice(0, -1)); // Remove user message if API key is missing
          return;
        }

        setHistory(prev => [...prev, { role: "model", content: [{ text: "" }] }]);

        const response = await menuSuggestionFlow({
          history: newHistory.slice(0, -1), // Send history without the latest user message
          context: currentContext,
        });
        
        setHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].content[0].text = response;
          return newHistory;
        });

      } catch (error) {
        console.error("Error calling AI flow:", error);
        toast({
          title: "خطا در ارتباط با هوش مصنوعی",
          description: "لطفاً اتصال اینترنت و کلید API خود را بررسی کنید.",
          variant: "destructive",
        });
        // Remove the user message and the empty model message on error
        setHistory(prev => prev.slice(0, -2));
      }
    });
  };

  return (
    <div className="flex flex-col h-full p-2">
        <SheetTitle className="sr-only">دستیار هوشمند</SheetTitle>
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-4" />
            <h3 className="font-semibold text-lg">دستیار هوشمند</h3>
            <p className="text-sm">می‌توانید سوالات خود را در مورد انتخاب واحد، برنامه درسی یا حتی برنامه غذایی بپرسید!</p>
          </div>
        )}
        {history.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
            <div className={`rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary/20' : 'bg-secondary'}`}>
               {msg.content[0].text ? (
                <p className="text-sm">{msg.content[0].text}</p>
              ) : (
                 <Loader2 className="h-5 w-5 animate-spin" />
              )}
            </div>
            {msg.role === 'user' && <User className="h-6 w-6 flex-shrink-0" />}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="relative mt-auto border-t pt-4">
        <Textarea
          placeholder="از من بپرسید..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          className="pr-12"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute bottom-6 left-2.5"
          onClick={handleSendMessage}
          disabled={isStreaming || !context.trim()}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">ارسال</span>
        </Button>
      </div>
    </div>
  );
}
