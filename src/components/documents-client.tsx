"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Doc = {
  id: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  summary: string | null;
  status: string;
  createdAt: string;
};

export function DocumentsClient({ docs: initial }: { docs: Doc[] }) {
  const [docs, setDocs] = useState<Doc[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList) {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await fetch("/api/documents", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          toast.error(`${files[i].name}: ${data.error ?? "upload failed"}`);
          continue;
        }
        setDocs((prev) => [data.document, ...prev]);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      toast.success(`Uploaded ${files.length} file(s)`);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this document?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast.success("Deleted");
  }

  return (
    <div className="space-y-4">
      <label
        htmlFor="doc-upload"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/30"
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-sm font-medium">Upload reference documents</div>
        <div className="text-xs text-muted-foreground">
          PDF, DOCX, XLSX, CSV, TXT · Max 10 MB · parsed and indexed for AI retrieval
        </div>
        <input
          id="doc-upload"
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.xls,.csv,.txt"
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </label>

      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">Uploading & extracting text…</p>
        </div>
      )}

      {docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{d.filename}</span>
                    <Badge variant={d.status === "ready" ? "secondary" : "outline"} className="text-[10px]">
                      {d.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(d.sizeBytes / 1024).toFixed(0)} KB · uploaded {new Date(d.createdAt).toLocaleDateString()}
                  </div>
                  {d.summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.summary}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
