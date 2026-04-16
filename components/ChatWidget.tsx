'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "profiles", "user-id-placeholder");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileUrl(docSnap.data().photoURL || null);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };
    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };

    const history = [...messages, userMessage].map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const clean = accumulated
          .split('\n')
          .filter((line) => !line.startsWith('data: ') && line !== '[DONE]' && line !== '')
          .join('');
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: clean } : m))
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ Error: ${err.message ?? 'Something went wrong.'}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:shadow-[0_0_60px_rgba(234,179,8,0.5)] hover:-translate-y-2 transition-all duration-500 z-50 flex items-center justify-center bg-primary text-primary-foreground border border-white/20 ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        aria-label="Open AI Assistant"
      >
        <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
        <Sparkles size={28} className="relative z-10" />
      </button>

      {/* Chat Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-8 right-8 w-[420px] h-[650px] max-h-[85vh] max-w-[calc(100vw-2rem)] bg-card/80 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-b from-white/10 to-transparent border-b border-white/5">
              <div className="flex items-center space-x-4">
                <div className="relative flex items-center justify-center p-2.5 bg-primary/20 text-primary rounded-2xl border border-primary/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                  <Bot size={24} />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground tracking-tight">Gems AI</h3>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Intelligent Assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/80 transition-all border border-transparent hover:border-white/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground mt-8"
                >
                  <div className="relative p-6 bg-secondary/50 rounded-full border border-white/5 shadow-inner">
                    <Sparkles size={40} className="text-primary/70" />
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground/80">Hello there!</p>
                    <p className="text-xs max-w-[250px] mx-auto text-muted-foreground/80 leading-relaxed">
                      I&apos;m your AI assistant. Ask me anything about your stones, sales, or workspace stats.
                    </p>
                  </div>
                </motion.div>
              )}

              {messages.map((m, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  key={m.id}
                  className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[85%] gap-3 ${
                      m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 mt-auto mb-1 h-9 w-9 rounded-full flex items-center justify-center overflow-hidden border ${
                        m.role === 'user'
                          ? 'border-primary/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] bg-secondary'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      {m.role === 'user' ? (
                        profileUrl ? (
                          <img src={profileUrl} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} className="text-foreground/70" />
                        )
                      ) : (
                        <Bot size={18} />
                      )}
                    </div>
                    <div
                      className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-[24px] rounded-br-[8px] shadow-[0_4px_20px_rgba(234,179,8,0.25)] font-medium'
                          : 'bg-secondary/60 backdrop-blur-md text-foreground border border-white/5 rounded-[24px] rounded-bl-[8px]'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {m.content || (
                          <span className="flex items-center space-x-1.5 opacity-60 h-6">
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-[bounce_1s_infinite_0.0s]" />
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-[bounce_1s_infinite_0.15s]" />
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-[bounce_1s_infinite_0.3s]" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-background/50 backdrop-blur-xl border-t border-white/5">
              <form
                onSubmit={handleSend}
                className="relative flex items-center bg-secondary/80 rounded-full border border-white/5 shadow-inner p-1.5 focus-within:ring-2 focus-within:ring-primary/50 focus-within:bg-secondary transition-all"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  className="w-full pl-5 pr-14 py-3 bg-transparent border-none text-sm placeholder:text-muted-foreground/60 focus:outline-none text-foreground disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute right-2 p-2.5 text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all rounded-full shadow-md"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} className="ml-0.5" />
                  )}
                </button>
              </form>
              <div className="text-center mt-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/40">
                  Powered by Gems AI
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
