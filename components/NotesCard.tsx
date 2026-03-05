"use client";

import React, { useEffect, useState, useRef } from "react";
import { Plus, Check, Trash2, ClipboardCheck, History, X, ChevronDown, ChevronUp, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import gsap from "gsap";
import { logActivity } from "@/lib/logger";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  isCompleted: boolean;
  createdAt: any;
  date: any;
  completedAt?: any;
}

const COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD"];

export function NotesCard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "completed">("active");
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "notes"),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData: Note[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notesData.push({ 
          id: doc.id, 
          ...data,
          // Handle potential missing fields from old schema
          isCompleted: data.isCompleted ?? data.completed ?? false,
          title: data.title ?? "Untitled Note",
          content: data.content ?? data.text ?? "",
          color: data.color ?? "#FFD700"
        } as Note);
      });
      setNotes(notesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const now = serverTimestamp();
      await addDoc(collection(db, "notes"), {
        title: title.trim(),
        content: content.trim(),
        color: selectedColor,
        isCompleted: false,
        createdAt: now,
        date: now,
      });
      await logActivity(`Added Note: ${title.trim()}`);
      
      // Reset Form
      setTitle("");
      setContent("");
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const toggleComplete = async (note: Note) => {
    try {
      const noteRef = doc(db, "notes", note.id);
      const newStatus = !note.isCompleted;
      await updateDoc(noteRef, {
        isCompleted: newStatus,
        completedAt: newStatus ? serverTimestamp() : null
      });
      
      await logActivity(`${newStatus ? "Completed" : "Reopened"} Note: ${note.title}`);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const deleteNote = async (note: Note) => {
    try {
      await deleteDoc(doc(db, "notes", note.id));
      await logActivity(`Deleted Note: ${note.title}`);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const activeNotes = notes.filter(n => !n.isCompleted);
  const completedNotes = notes.filter(n => n.isCompleted);
  const displayNotes = view === "active" ? activeNotes : completedNotes;

  useEffect(() => {
    if (listRef.current && displayNotes.length > 0) {
      gsap.fromTo(
        listRef.current.querySelectorAll(".note-item"),
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "back.out(1.2)" }
      );
    }
  }, [displayNotes.length, view]);

  useEffect(() => {
    if (isAdding && formRef.current) {
      gsap.from(formRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  }, [isAdding]);

  const formatDate = (ts: any) => {
    if (ts instanceof Timestamp) return format(ts.toDate(), "MMM d, yyyy");
    return "Recently";
  };

  return (
    <div className="p-8 bg-background border border-border rounded-[40px] shadow-sm flex flex-col min-h-[600px] relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-secondary/30 text-foreground border border-border/50">
                <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">Notes</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Personal Workspace</p>
            </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-secondary/20 rounded-2xl border border-border/40 backdrop-blur-md">
           <button 
             onClick={() => setView("active")}
             className={cn(
               "px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
               view === "active" ? "bg-background text-foreground shadow-lg ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
             )}
           >
             Active
             <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
               {activeNotes.length}
             </span>
           </button>
           <button 
             onClick={() => setView("completed")}
             className={cn(
               "px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
               view === "completed" ? "bg-background text-foreground shadow-lg ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
             )}
           >
             History
             <History className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>

      {/* Add Note Section */}
      <div className="mb-8 overflow-hidden">
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-4 px-6 rounded-[28px] bg-secondary/10 border border-dashed border-border/60 hover:border-primary/40 hover:bg-secondary/20 transition-all flex items-center justify-center gap-3 group"
          >
            <div className="p-1.5 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-muted-foreground transition-colors group-hover:text-foreground">Create a new note...</span>
          </button>
        ) : (
          <form ref={formRef} onSubmit={handleAddNote} className="p-6 bg-secondary/5 border border-border/50 rounded-[32px] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">New Memory</span>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="p-1.5 rounded-full hover:bg-secondary/50 text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <input 
                autoFocus
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note Title" 
                className="w-full bg-transparent text-lg font-bold placeholder:text-muted-foreground/30 focus:outline-none"
              />
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your details here..." 
                className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/20 focus:outline-none min-h-[80px] resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground/40" />
                <div className="flex items-center gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all",
                        selectedColor === c ? "border-foreground scale-110" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <button 
                type="submit"
                className="px-6 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-black shadow-lg shadow-primary/20 hover:translate-y-[-2px] active:translate-y-[0] transition-all"
              >
                Save Note
              </button>
            </div>
          </form>
        )}
      </div>

      {/* List */}
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 min-h-0 relative">
        {loading ? (
             <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Synchronizing</p>
             </div>
        ) : displayNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 bg-secondary/5 rounded-[40px] border border-dashed border-border/40">
            <div className="p-5 rounded-full bg-secondary/10 border border-border/20">
                {view === "active" ? <ClipboardCheck className="w-8 h-8 text-muted-foreground/20" /> : <History className="w-8 h-8 text-muted-foreground/20" />}
            </div>
            <div>
                <p className="text-base font-black text-foreground">
                  {view === "active" ? "You're all caught up" : "Archive is empty"}
                </p>
                <p className="text-[11px] text-muted-foreground/60 max-w-[200px] mx-auto mt-2 font-bold leading-relaxed">
                  {view === "active" ? "No active notes found. Create your first memory today." : "Completed tasks will be preserved here for your history."}
                </p>
            </div>
          </div>
        ) : (
          displayNotes.map((note) => (
            <div 
              key={note.id} 
              className="note-item group relative overflow-hidden bg-card border border-border/40 rounded-[32px] hover:border-primary/20 hover:bg-secondary/5 transition-all duration-500 shadow-sm"
            >
              {/* Note Color Accent */}
              <div 
                className="absolute top-0 left-0 w-1.5 h-full opacity-60 group-hover:opacity-100 transition-opacity" 
                style={{ backgroundColor: note.color }}
              />

              <div className="p-6 pl-8">
                <div className="flex items-start gap-5">
                  <button 
                    onClick={() => toggleComplete(note)}
                    className={cn(
                      "shrink-0 mt-1 w-7 h-7 rounded-2xl border-2 flex items-center justify-center transition-all",
                      note.isCompleted 
                        ? "bg-primary border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]" 
                        : "border-border/60 hover:border-primary/50 bg-background"
                    )}
                  >
                    {note.isCompleted && <Check className="w-4 h-4 text-primary-foreground stroke-[4]" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h4 className={cn(
                        "text-base font-black tracking-tight transition-all truncate",
                        note.isCompleted ? "text-muted-foreground/40 line-through decoration-primary/30" : "text-foreground"
                      )}>
                        {note.title}
                      </h4>
                      <span className="shrink-0 text-[10px] font-black text-muted-foreground/30 uppercase tracking-tighter">
                        {formatDate(note.date)}
                      </span>
                    </div>
                    
                    {note.content && (
                      <p className={cn(
                        "text-sm font-medium leading-relaxed transition-all",
                        note.isCompleted ? "text-muted-foreground/20" : "text-muted-foreground/80"
                      )}>
                        {note.content}
                      </p>
                    )}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                    <button 
                      onClick={() => deleteNote(note)}
                      className="p-2.5 rounded-2xl text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
