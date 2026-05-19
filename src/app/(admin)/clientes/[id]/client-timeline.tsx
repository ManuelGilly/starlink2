"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

type Note = { id: string; content: string; authorId: string | null; createdAt: string };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-VE");
}

export function ClientTimeline({ clientId, notes: initial }: { clientId: string; notes: Note[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initial);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/clientes/${clientId}/notas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setLoading(false);
    if (!res.ok) return toast.error("No se pudo guardar la nota");
    const note = await res.json();
    setNotes((prev) => [note, ...prev]);
    setContent("");
  }

  async function deleteNote(noteId: string) {
    await fetch(`/api/clientes/${clientId}/notas?noteId=${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Input nueva nota */}
      <form onSubmit={addNote} className="flex gap-2">
        <Textarea
          rows={2}
          className="flex-1 resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe una nota sobre este cliente... (llamada, acuerdo, problema, seguimiento)"
        />
        <Button type="submit" disabled={loading || !content.trim()} className="self-end">
          Guardar
        </Button>
      </form>

      {/* Timeline */}
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin notas. Registra el historial de interacciones con el cliente.</p>
      ) : (
        <div className="relative space-y-0">
          <div className="absolute left-2 top-0 h-full w-px bg-border" />
          {notes.map((note) => (
            <div key={note.id} className="relative pl-8 pb-4">
              <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-background" />
              <div className="rounded-md border border-border bg-card px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(note.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
