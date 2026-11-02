// AI drafting. Uses z-ai-web-dev-sdk which is already a project dependency
// and works inside this sandbox without external API keys. If the SDK call
// fails (e.g. quota), we fall back to a deterministic "best-match" draft
// from the content library so the workflow never breaks.

import ZAI from "z-ai-web-dev-sdk";

export type DraftSource = {
  type: "content" | "document";
  id: string;
  label: string;
  snippet?: string;
};

export type DraftResult = {
  draft: string;
  confidence: number; // 0..1
  sources: DraftSource[];
  model: string;
  fallback: boolean; // true if we used the deterministic fallback
};

export type DraftContext = {
  question: string;
  category?: string;
  // Approved Q&A pairs that look relevant (already retrieved by caller)
  relevantContent: { id: string; question: string; answer: string; category?: string | null }[];
  // Snippets from uploaded documents that look relevant
  relevantSnippets: { id: string; filename: string; snippet: string }[];
  // Company context (org name, what they sell) — improves answer tone
  companyContext?: string;
};

const SYSTEM_PROMPT = `You are a meticulous security & RFP response drafter.
You write concise, factual, defensible answers grounded STRICTLY in the
provided approved content. You never invent facts. When the provided content
does not cover the question, you say "We will provide this information on
request." and set confidence to 0.2. You never use marketing language.
You write in the voice of the company whose context is given.`;

export async function draftAnswer(ctx: DraftContext): Promise<DraftResult> {
  const sources: DraftSource[] = [];
  const contextBlock = buildContextBlock(ctx, sources);

  const userPrompt = `Company context:
${ctx.companyContext ?? "(not provided)"}

Approved content (use ONLY this; cite by [Cn] index):
${contextBlock.content || "(none)"}

Reference snippets (use to support, not as primary source; cite by [Dn] index):
${contextBlock.snippets || "(none)"}

Question:
${ctx.question}

Write the answer (2-5 sentences, plain prose, no markdown headings). Then on
a final line, write "CONFIDENCE: 0.XX" where 0.XX is your confidence that the
answer is fully grounded in the approved content (0.00 if you couldn't answer).`;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 600,
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const { text, confidence } = parseConfidence(raw);
    if (!text.trim()) {
      return fallbackDraft(ctx, sources, "empty-llm-response");
    }
    return {
      draft: text.trim(),
      confidence,
      sources,
      model: "zai-glm",
      fallback: false,
    };
  } catch (err: any) {
    return fallbackDraft(ctx, sources, `error:${String(err?.message ?? err).slice(0, 80)}`);
  }
}

function buildContextBlock(
  ctx: DraftContext,
  sources: DraftSource[],
): { content: string; snippets: string } {
  const contentLines: string[] = [];
  ctx.relevantContent.forEach((c, i) => {
    contentLines.push(
      `[C${i + 1}] (category: ${c.category ?? "general"}) Q: ${c.question}\nA: ${c.answer}`,
    );
    sources.push({ type: "content", id: c.id, label: c.question.slice(0, 80) });
  });
  const snippetLines: string[] = [];
  ctx.relevantSnippets.forEach((s, i) => {
    snippetLines.push(`[D${i + 1}] (from ${s.filename}) ${s.snippet}`);
    sources.push({ type: "document", id: s.id, label: s.filename, snippet: s.snippet.slice(0, 200) });
  });
  return { content: contentLines.join("\n\n"), snippets: snippetLines.join("\n\n") };
}

function parseConfidence(raw: string): { text: string; confidence: number } {
  const m = raw.match(/CONFIDENCE:\s*([0-9.]+)/i);
  const confidence = m ? Math.max(0, Math.min(1, parseFloat(m[1]))) : 0.5;
  const text = raw.replace(/CONFIDENCE:\s*[0-9.]+/i, "").trim();
  return { text, confidence };
}

// Deterministic fallback. Picks the most-relevant approved content by simple
// keyword overlap and returns its answer verbatim with low confidence.
// Used only when the LLM call fails so the workflow stays unblocked.
function fallbackDraft(
  ctx: DraftContext,
  sources: DraftSource[],
  reason: string,
): DraftResult {
  if (ctx.relevantContent.length === 0) {
    return {
      draft: "We will provide this information on request.",
      confidence: 0.1,
      sources: [],
      model: `fallback:${reason}`,
      fallback: true,
    };
  }
  const best = ctx.relevantContent[0];
  return {
    draft: best.answer,
    confidence: 0.4,
    sources: [
      { type: "content", id: best.id, label: best.question.slice(0, 80) },
    ],
    model: `fallback:${reason}`,
    fallback: true,
  };
}

// Lightweight retrieval — keyword overlap scoring. Good enough for v1 and
// avoids the cost/complexity of vector embeddings. Returns top-k.
export function retrieveRelevant<T extends { question: string; answer?: string; category?: string | null }>(
  query: string,
  pool: T[],
  k: number,
): T[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return pool.slice(0, k);
  return pool
    .map((p) => {
      const text = `${p.question} ${p.answer ?? ""} ${p.category ?? ""}`.toLowerCase();
      let score = 0;
      for (const t of qTokens) if (text.includes(t)) score += 1;
      // Tiny boost for category match if query mentions it
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.p);
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

// Snippet retrieval from document text. Splits each document into ~500-char
// chunks, scores them by keyword overlap, returns the top-N across all docs.
export function retrieveSnippets(
  query: string,
  docs: { id: string; filename: string; textContent: string }[],
  totalSnippets: number,
): { id: string; filename: string; snippet: string }[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const candidates: { id: string; filename: string; snippet: string; score: number }[] = [];
  for (const doc of docs) {
    const chunks = chunkText(doc.textContent, 500);
    for (const ch of chunks) {
      const lower = ch.toLowerCase();
      let score = 0;
      for (const t of qTokens) if (lower.includes(t)) score += 1;
      if (score > 0) candidates.push({ id: doc.id, filename: doc.filename, snippet: ch, score });
    }
  }
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, totalSnippets)
    .map(({ id, filename, snippet }) => ({ id, filename, snippet }));
}

function chunkText(text: string, size: number): string[] {
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}
