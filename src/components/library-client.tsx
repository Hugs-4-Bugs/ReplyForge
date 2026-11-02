"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Trash2, Edit, Library } from "lucide-react";
import { toast } from "sonner";

type Entry = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  tags: string;
  status: string;
  confidence: number;
  authorName: string;
  updatedAt: string;
};

export function LibraryClient({ entries: initial }: { entries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initial);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);

  const categories = Array.from(new Set(entries.map((e) => e.category).filter(Boolean))) as string[];

  const filtered = entries.filter((e) => {
    if (catFilter !== "all" && e.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.question.toLowerCase().includes(q) && !e.answer.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search library…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="mr-1 h-4 w-4" /> New entry
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Library className="h-10 w-10 text-muted-foreground" />
            <div>
              <h3 className="font-medium">{entries.length === 0 ? "Your library is empty" : "No matches"}</h3>
              <p className="text-sm text-muted-foreground">
                {entries.length === 0
                  ? "Add your first approved Q&A to start drafting."
                  : "Try a different search or category filter."}
              </p>
            </div>
            {entries.length === 0 && (
              <Button onClick={() => { setEditing(null); setShowForm(true); }}>
                <Plus className="mr-1 h-4 w-4" /> New entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <Card key={e.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {e.category && <Badge variant="outline" className="text-[10px]">{e.category}</Badge>}
                      <Badge variant="secondary" className="text-[10px]">{Math.round(e.confidence * 100)}% confidence</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        by {e.authorName} · {new Date(e.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium">{e.question}</div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.answer}</p>
                    {e.tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {e.tags.split(",").map((t, i) => (
                          <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setShowForm(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EntryFormDialog
        key={editing?.id ?? "new"}
        open={showForm}
        onOpenChange={setShowForm}
        editing={editing}
        categories={categories}
        onSaved={(entry) => {
          setEntries((prev) => {
            const idx = prev.findIndex((e) => e.id === entry.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = entry;
              return copy;
            }
            return [entry, ...prev];
          });
          setShowForm(false);
          setEditing(null);
        }}
      />
    </div>
  );

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Deleted");
  }
}

function EntryFormDialog({
  open, onOpenChange, editing, categories, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Entry | null;
  categories: string[];
  onSaved: (e: Entry) => void;
}) {
  const [form, setForm] = useState({
    question: editing?.question ?? "",
    answer: editing?.answer ?? "",
    category: editing?.category ?? "",
    tags: editing?.tags ?? "",
    confidence: editing ? String(editing.confidence) : "1.0",
  });
  const [loading, setLoading] = useState(false);

  // The parent uses key={editing?.id ?? 'new'} to remount this component
  // whenever the editing target changes, so the initial useState values
  // above are always fresh - no useEffect needed.

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const method = editing ? "PATCH" : "POST";
    const url = editing ? `/api/library/${editing.id}` : "/api/library";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: form.question,
        answer: form.answer,
        category: form.category || null,
        tags: form.tags,
        confidence: parseFloat(form.confidence) || 1.0,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Save failed" }));
      toast.error(data.error ?? "Save failed");
      return;
    }
    const data = await res.json();
    toast.success(editing ? "Updated" : "Created");
    onSaved(data.entry);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit entry" : "New library entry"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="q">Question *</Label>
            <Input id="q" required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a">Answer *</Label>
            <Textarea id="a" required rows={5} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat">Category</Label>
              <Input id="cat" list="cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Security" />
              <datalist id="cats">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="conf">Confidence (0-1)</Label>
              <Input id="conf" type="number" min="0" max="1" step="0.1" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="soc2, encryption, access-control" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
