import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, X, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  pinned: boolean;
  color: string;
}

const NOTE_COLORS = [
  'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
  'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
  'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
];

interface QuickNotesProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const QuickNotes: React.FC<QuickNotesProps> = ({ open, onOpenChange }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const stored = localStorage.getItem('retailmind_notes');
    if (stored) {
      return JSON.parse(stored).map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) }));
    }
    return [];
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    localStorage.setItem('retailmind_notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: `note_${Date.now()}`,
      content: newNote,
      createdAt: new Date(),
      pinned: false,
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
    };
    
    setNotes(prev => [note, ...prev]);
    setNewNote('');
    setIsAdding(false);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const togglePin = (id: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, pinned: !n.pinned } : n
    ));
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <StickyNote className="w-5 h-5" />
          {notes.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
              {notes.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80 sm:w-96">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            Quick Notes
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4">
          {/* Add Note Section */}
          {isAdding ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Write your note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-24 resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addNote} className="flex-1">
                  Save Note
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setNewNote(''); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full gap-2" 
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4" />
              Add Note
            </Button>
          )}
          
          {/* Notes List */}
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-3 pr-4">
              {sortedNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notes yet</p>
                  <p className="text-xs mt-1">Jot down quick ideas and insights!</p>
                </div>
              ) : (
                sortedNotes.map(note => (
                  <div
                    key={note.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      note.color
                    )}
                  >
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(note.createdAt, { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePin(note.id)}
                          className={cn(
                            "p-1 rounded hover:bg-background/50 transition-colors",
                            note.pinned ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {note.pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-background/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
