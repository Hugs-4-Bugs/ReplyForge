"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Upload, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { ParsedQuestion } from "@/lib/parsing";

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState<"details" | "upload" | "review">("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [type, setType] = useState("security_questionnaire");
  const [dueDate, setDueDate] = useState("");

  // Step 2
  const [file, setFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [pasteText, setPasteText] = useState("");

  async function createProject() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        client: client || null,
        type,
        dueDate: dueDate || null,
        questions: parsedQuestions,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to create project." }));
      setError(data.error ?? "Failed to create project.");
      return;
    }
    const data = await res.json();
    toast.success("Project created");
    router.push(`/app/projects/${data.id}`);
  }

  async function handleFile(f: File) {
    setFile(f);
    setError(null);
    const formData = new FormData();
    formData.append("file", f);
    const res = await fetch("/api/projects/parse-upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to parse file.");
      setParsedQuestions([]);
      return;
    }
    setParsedQuestions(data.questions ?? []);
    if ((data.questions ?? []).length > 0) setStep("review");
  }

  function handlePaste() {
    if (!pasteText.trim()) {
      setError("Paste at least one question.");
      return;
    }
    // Use the same parser endpoint
    fetch("/api/projects/parse-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: pasteText }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.questions || data.questions.length === 0) {
          setError("Couldn't parse any questions. Try numbered or Q-prefixed format.");
          return;
        }
        setParsedQuestions(data.questions);
        setStep("review");
      })
      .catch(() => setError("Parse failed."));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2 text-sm">
        <StepDot n={1} active={step === "details"} done={step !== "details"} label="Project details" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepDot n={2} active={step === "upload"} done={step === "review"} label="Upload questions" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <StepDot n={3} active={step === "review"} done={false} label="Review & create" />
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {step === "details" && (
        <Card>
          <CardHeader>
            <CardTitle>Project details</CardTitle>
            <CardDescription>Tell us about this questionnaire.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project name *</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp — Security Questionnaire Q4" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client">Client / buyer</Label>
                <Input id="client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security_questionnaire">Security questionnaire</SelectItem>
                    <SelectItem value="rfp">RFP / RFI</SelectItem>
                    <SelectItem value="ddq">Due diligence (DDQ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date (optional)</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => { if (!name) { setError("Project name is required."); return; } setError(null); setStep("upload"); }}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload the questionnaire</CardTitle>
            <CardDescription>
              Excel (.xlsx/.xls/.csv), Word (.docx), PDF, or text. Or paste questions below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              htmlFor="file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/30"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">{file ? file.name : "Click to upload or drag a file"}</div>
              <div className="text-xs text-muted-foreground">Max 10 MB · xlsx, xls, csv, docx, pdf, txt</div>
              <input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv,.docx,.pdf,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>

            <div className="text-center text-xs text-muted-foreground">— or —</div>

            <div className="space-y-2">
              <Label htmlFor="paste">Paste questions</Label>
              <Textarea
                id="paste"
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"1. Do you encrypt data at rest?\n2. Describe your access review process.\n3. List your sub-processors."}
              />
              <p className="text-xs text-muted-foreground">Numbered list, Q-prefixed, or one question per paragraph.</p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("details")}>Back</Button>
              <Button onClick={handlePaste} disabled={!pasteText.trim()}>Parse & continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card>
          <CardHeader>
            <CardTitle>Review questions ({parsedQuestions.length})</CardTitle>
            <CardDescription>
              We parsed {parsedQuestions.length} question{parsedQuestions.length === 1 ? "" : "s"}. You can edit them after creating the project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 space-y-2 overflow-y-auto rounded-md border p-3">
              {parsedQuestions.map((q, i) => (
                <div key={i} className="flex gap-3 border-b pb-2 text-sm last:border-0">
                  <span className="font-mono text-xs text-muted-foreground">{q.externalId ?? i + 1}</span>
                  <span className="flex-1">{q.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={createProject} disabled={loading || parsedQuestions.length === 0}>
                {loading ? "Creating…" : `Create project with ${parsedQuestions.length} question${parsedQuestions.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepDot({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
        done ? "bg-primary text-primary-foreground" : active ? "border-2 border-primary text-primary" : "border border-muted-foreground text-muted-foreground"
      }`}>
        {done ? "✓" : n}
      </div>
      <span className={active || done ? "font-medium" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
