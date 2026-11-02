"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, Download, Sparkles, CheckCircle2, Flag, Loader2,
  ChevronLeft, ChevronRight, Search, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Source = { type: "content" | "document"; id: string; label: string; snippet?: string };
type Answer = {
  id: string;
  draft: string;
  final: string | null;
  confidence: number;
  status: string;
  sources: string; // JSON
  aiModel: string | null;
  fallback: boolean;
  approvedAt: string | null;
  updatedAt?: string;
};
type Question = {
  id: string;
  externalId: string | null;
  text: string;
  category: string | null;
  answer: Answer | null;
};
type Project = {
  id: string;
  name: string;
  client: string | null;
  type: string;
  status: string;
  dueDate: string | null;
  notes: string | null;
  stats: { total: number; approved: number; flagged: number; drafted: number };
  questions: Question[];
};

export function ProjectWorkspace({ project }: { project: Project }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(project.questions);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    return questions
      .map((q, originalIdx) => ({ q, originalIdx }))
      .filter(({ q }) => {
        if (filter === "undrafted" && q.answer) return false;
        if (filter === "flagged" && q.answer?.status !== "flagged") return false;
        if (filter === "needs_review" && q.answer?.status !== "needs_review") return false;
        if (filter === "approved" && q.answer?.status !== "approved") return false;
        if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      });
  }, [questions, filter, search]);

  const current = questions[selectedIdx];

  async function draftAll() {
    setDrafting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Drafting failed");
        return;
      }
      // Reload the project to get fresh answers
      const projRes = await fetch(`/api/projects/${project.id}`);
      const projData = await projRes.json();
      if (projData.project) {
        setQuestions(projData.project.questions);
        toast.success(`Drafted ${data.drafted} answers${data.skipped ? ` · ${data.skipped} skipped (limit)` : ""}`);
      }
    } finally {
      setDrafting(false);
    }
  }

  async function draftOne(questionId: string) {
    setDrafting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: [questionId] }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Drafting failed");
        return;
      }
      const projRes = await fetch(`/api/projects/${project.id}`);
      const projData = await projRes.json();
      if (projData.project) setQuestions(projData.project.questions);
      toast.success("Draft generated");
    } finally {
      setDrafting(false);
    }
  }

  async function saveAnswer(answerId: string, final: string, status: string) {
    const res = await fetch(`/api/projects/${project.id}/answers/${answerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ final, status }),
    });
    if (!res.ok) {
      toast.error("Failed to save answer");
      return;
    }
    const data = await res.json();
    setQuestions((prev) => prev.map((q, i) => i === selectedIdx ? { ...q, answer: data.answer } : q));
    toast.success(status === "approved" ? "Approved" : "Saved");
  }

  async function exportFile(format: "xlsx" | "csv") {
    setExporting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/export?format=${format}`);
      if (!res.ok) {
        toast.error("Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  }

  const approvedPct = project.stats.total === 0
    ? 0
    : Math.round((questions.filter((q) => q.answer?.status === "approved").length / project.stats.total) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/app/projects" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> All projects
          </Link>
          <h1 className="truncate text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.client ?? "—"} · {project.type.replace(/_/g, " ")}
            {project.dueDate && ` · due ${new Date(project.dueDate).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => exportFile("csv")} disabled={exporting}>
            <Download className="mr-1 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportFile("xlsx")} disabled={exporting}>
            <Download className="mr-1 h-4 w-4" /> Excel
          </Button>
          <Button size="sm" onClick={draftAll} disabled={drafting || project.stats.drafted === project.stats.total}>
            {drafting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            {project.stats.drafted === 0 ? "Draft all" : "Draft remaining"}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatPill label="Total" value={project.stats.total} />
        <StatPill label="Drafted" value={questions.filter((q) => q.answer).length} />
        <StatPill label="Flagged" value={questions.filter((q) => q.answer?.status === "flagged").length} tone="amber" />
        <StatPill label="Approved" value={questions.filter((q) => q.answer?.status === "approved").length} tone="green" />
      </div>
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded bg-muted">
          <div className="h-full bg-primary" style={{ width: `${approvedPct}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{approvedPct}% approved</span>
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        {/* Question list */}
        <Card className="flex h-[70vh] flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({questions.length})</SelectItem>
                <SelectItem value="undrafted">Undrafted ({questions.filter((q) => !q.answer).length})</SelectItem>
                <SelectItem value="flagged">Flagged ({questions.filter((q) => q.answer?.status === "flagged").length})</SelectItem>
                <SelectItem value="needs_review">Needs review ({questions.filter((q) => q.answer?.status === "needs_review").length})</SelectItem>
                <SelectItem value="approved">Approved ({questions.filter((q) => q.answer?.status === "approved").length})</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No questions match.</div>
            ) : (
              filtered.map(({ q, originalIdx }) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedIdx(originalIdx)}
                  className={cn(
                    "flex w-full flex-col gap-1 border-b px-3 py-2 text-left text-sm hover:bg-muted/30",
                    selectedIdx === originalIdx && "bg-muted",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{q.externalId ?? "·"}</span>
                    {q.answer ? <StatusBadge status={q.answer.status} /> : <Badge variant="outline" className="text-[10px]">undrafted</Badge>}
                  </div>
                  <span className={cn("line-clamp-2", !q.answer && "text-muted-foreground")}>{q.text}</span>
                  {q.answer && (
                    <span className={cn("text-[10px]", confidenceColor(q.answer.confidence))}>
                      {Math.round(q.answer.confidence * 100)}% confidence
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Editor */}
        <Card className="flex h-[70vh] flex-col">
          {current ? (
            <QuestionEditor
              // Remount the editor when the question OR its answer changes
              // (e.g. after draftAll creates a new answer for a previously
              // undrafted question, or after Regenerate updates the draft).
              key={`${current.id}-${current.answer?.id ?? "none"}-${current.answer?.updatedAt ?? ""}`}
              question={current}
              onDraft={() => draftOne(current.id)}
              onSave={saveAnswer}
              drafting={drafting}
              onPrev={() => setSelectedIdx(Math.max(0, selectedIdx - 1))}
              onNext={() => setSelectedIdx(Math.min(questions.length - 1, selectedIdx + 1))}
              idx={selectedIdx}
              total={questions.length}
            />
          ) : (
            <CardContent className="p-8 text-center text-muted-foreground">Select a question.</CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

function QuestionEditor({
  question, onDraft, onSave, drafting, onPrev, onNext, idx, total,
}: {
  question: Question;
  onDraft: () => void;
  onSave: (answerId: string, final: string, status: string) => void;
  drafting: boolean;
  onPrev: () => void;
  onNext: () => void;
  idx: number;
  total: number;
}) {
  const [text, setText] = useState(question.answer?.final ?? question.answer?.draft ?? "");

  // No effect needed: parent passes key={question.id} which remounts this
  // component fresh whenever the question changes, so initial state is correct.

  const sources: Source[] = useMemo(() => {
    try { return JSON.parse(question.answer?.sources ?? "[]"); } catch { return []; }
  }, [question.answer?.sources]);

  return (
    <>
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{question.externalId ?? "—"}</span>
              {question.category && <Badge variant="outline" className="text-[10px]">{question.category}</Badge>}
            </div>
            <p className="text-base font-medium leading-snug">{question.text}</p>
          </div>
          {question.answer && (
            <div className="text-right">
              <div className={cn("text-xs font-medium", confidenceColor(question.answer.confidence))}>
                {Math.round(question.answer.confidence * 100)}%
              </div>
              <div className="text-[10px] text-muted-foreground">confidence</div>
            </div>
          )}
        </div>
      </CardHeader>

      <div className="flex-1 overflow-y-auto p-4">
        {!question.answer ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No draft yet. Generate one to start.</p>
            <Button onClick={onDraft} disabled={drafting}>
              {drafting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
              Generate draft
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {question.answer.fallback && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                Fallback draft (AI unavailable). Review carefully or regenerate.
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase text-muted-foreground">Your answer</label>
                <Button size="sm" variant="ghost" onClick={onDraft} disabled={drafting} className="h-7 text-xs">
                  {drafting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                  Regenerate
                </Button>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="resize-none font-mono text-sm"
              />
            </div>

            {sources.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Sources cited ({sources.length})
                </label>
                <div className="space-y-2">
                  {sources.map((src, i) => (
                    <div key={i} className="rounded-md border p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {src.type === "content" ? "Library" : "Document"}
                        </Badge>
                        <span className="font-medium">{src.label}</span>
                      </div>
                      {src.snippet && (
                        <p className="mt-1 line-clamp-3 text-muted-foreground">{src.snippet}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              AI model: <code className="bg-background px-1 py-0.5 rounded">{question.answer.aiModel ?? "—"}</code>
              {question.answer.approvedAt && ` · approved ${new Date(question.answer.approvedAt).toLocaleDateString()}`}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t p-3">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={idx === 0}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <div className="flex gap-2">
          {question.answer && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSave(question.answer!.id, text, "flagged")}
              >
                <Flag className="mr-1 h-3 w-3" /> Flag
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSave(question.answer!.id, text, "needs_review")}
              >
                Save
              </Button>
              <Button
                size="sm"
                onClick={() => onSave(question.answer!.id, text, "approved")}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
              </Button>
            </>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onNext} disabled={idx === total - 1}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone?: "amber" | "green" }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn(
        "text-xl font-semibold",
        tone === "amber" && "text-amber-600",
        tone === "green" && "text-green-600",
      )}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-green-600 text-[10px]">approved</Badge>;
  if (status === "flagged") return <Badge className="bg-amber-600 text-[10px]">flagged</Badge>;
  if (status === "needs_review") return <Badge variant="secondary" className="text-[10px]">review</Badge>;
  return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
}

function confidenceColor(c: number): string {
  if (c >= 0.7) return "text-green-600";
  if (c >= 0.4) return "text-amber-600";
  return "text-destructive";
}
