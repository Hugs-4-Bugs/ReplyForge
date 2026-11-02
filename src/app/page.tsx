import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import {
  Shield,
  FileText,
  Zap,
  Lock,
  CheckCircle2,
  ArrowRight,
  Clock,
  Users,
  Building2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { LandingFAQ } from "@/components/landing-faq";
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* NAV */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg">ReplyForge</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#how" className="text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#compare" className="text-muted-foreground hover:text-foreground">Compare</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Start free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — animated, with before/after comparison */}
      <Hero />

      {/* PROBLEM */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <Badge variant="outline" className="mb-3">The problem</Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Every enterprise deal now comes with a 200-question security questionnaire.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Your sales team finally closes the demo. Procurement says yes. Then a 200-row Excel lands in your inbox: encryption, access reviews, sub-processors, incident response, data residency, DPA, SOC 2, ISO 27001. It's due Friday. Your CTO and Head of Legal spend the next two days chasing answers across Slack, Notion, last quarter's SOC 2 report, and a shared spreadsheet that nobody owns.
              </p>
              <p className="mt-4 text-muted-foreground">
                The big RFP tools — <strong>Loopio ($15K–$150K/yr)</strong>, <strong>Responsive ($10K+/yr)</strong>, <strong>Conveyor ($9.6K/yr)</strong> — are built for enterprise proposal teams of 10+. They seat-price you to death and need a 6-week implementation. So most SMB SaaS teams keep drowning in spreadsheets and losing deals.
              </p>
              <p className="mt-4 font-medium">
                We built ReplyForge for the team that doesn't have a dedicated proposal manager.
              </p>
            </div>
            <Card className="p-6">
              <div className="space-y-4">
                {[
                  { label: "Avg. hours per questionnaire (manual)", val: "20–40 hrs", bad: true },
                  { label: "Avg. hours per questionnaire (ReplyForge)", val: "1–3 hrs", bad: false },
                  { label: "Avg. deal value gated by questionnaire", val: "$50K–$500K", bad: false },
                  { label: "Avg. annual cost of Loopio (mid-market)", val: "$30K–$60K", bad: true },
                  { label: "Avg. annual cost of ReplyForge (Pro)", val: "$3,588", bad: false },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{r.label}</span>
                    <span className={`font-semibold ${r.bad ? "text-destructive" : "text-primary"}`}>
                      {r.val}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                Sources: SiftHub customer data (2026), Vendr transaction data for Loopio, public pricing pages for Responsive and Conveyor.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-3">How it works</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              From questionnaire in inbox to submitted response in four steps.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { n: "1", title: "Upload the questionnaire", body: "Drag in an Excel, CSV, Word doc, or PDF. We parse every question — preserving IDs, sections, and categories — into a clean review queue." },
              { n: "2", title: "AI drafts every answer", body: "Each question is matched against your approved Q&A library and your uploaded reference docs (SOC 2, policies, whitepapers). The AI writes a grounded answer with confidence and source citations." },
              { n: "3", title: "Review & approve", body: "Filter by confidence, assign flagged answers to SMEs, edit in-line. Every change is audit-logged. Nothing leaves your tenant." },
              { n: "4", title: "Export in the original format", body: "Download a filled Excel that mirrors the source file's structure, or copy answers into the buyer's portal. Your library learns from every approved edit." },
            ].map((s, i) => (
              <Card key={i} className="p-6">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-3">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to ship a defensible response. Nothing you don't.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: FileText, title: "Multi-format parsing", body: "Excel (.xlsx/.xls/.csv), Word (.docx), PDF, and plain text. We preserve question IDs and sections, so your exported file maps cleanly back to the source." },
              { icon: Sparkles, title: "Grounded AI drafting", body: "Drafts come ONLY from your approved content library and uploaded reference docs. No invented answers. Every draft carries a confidence score and source citations." },
              { icon: Shield, title: "Approved content library", body: "A versioned Q&A library with categories, tags, statuses, and per-entry confidence. Your institutional knowledge, finally in one place." },
              { icon: Lock, title: "Source citations on every answer", body: "Every draft cites the exact approved entry or document snippet it came from. Reviewers can verify in one click. Auditors love it." },
              { icon: Users, title: "Reviewer assignments & statuses", body: "Flag low-confidence answers, assign to SMEs by category, track status (draft → needs review → approved). Built for a 3-person team, not a 30-person one." },
              { icon: Building2, title: "Multi-tenant from day one", body: "Strict tenant isolation enforced at the data layer. Every query is scoped to your organization. Your data is never visible to another customer." },
              { icon: Clock, title: "Audit log", body: "Every meaningful action — project created, answer approved, member invited — is recorded with user, IP, and timestamp. Exportable for SOC 2 evidence." },
              { icon: Zap, title: "Excel + CSV export", body: "Download a filled spreadsheet that mirrors the source file's columns. Paste into the buyer's portal in one shot. No more copy-paste-by-cell." },
              { icon: CheckCircle2, title: "Real billing, real Stripe", body: "Upgrade/downgrade/cancel from the UI. Stripe webhooks handle subscription state. No sales calls required to start." },
            ].map((f, i) => (
              <Card key={i} className="p-6">
                <f.icon className="mb-3 h-5 w-5 text-primary" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section id="compare" className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-3">Comparison</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              How we stack up against the incumbents.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Public pricing as of November 2026. We don't invent competitor shortcomings — these come from their own pricing pages and G2/Capterra review patterns.
            </p>
          </div>
          <Card className="mt-12 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Capability</th>
                    <th className="px-4 py-3 text-left font-medium">ReplyForge</th>
                    <th className="px-4 py-3 text-left font-medium">Loopio</th>
                    <th className="px-4 py-3 text-left font-medium">Responsive (RFPIO)</th>
                    <th className="px-4 py-3 text-left font-medium">Conveyor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["Starting price", "$0 (Free) / $99 Starter", "$15K–$150K / yr*", "$10K / yr", "$9,600 / yr"],
                    ["Pricing model", "Flat per-org", "Seat-based, opaque", "Platform fee + per-user add-ons", "Per-org, tiered"],
                    ["Per-seat trap", "No — flat seats per plan", "Yes — pay per SME", "Yes — pay per user add-on", "Limited"],
                    ["Implementation", "Self-serve, ~5 min", "6-week onboarding", "Consultant-led", "Self-serve"],
                    ["AI first drafts", "Yes — grounded + cited", "Yes — from static library", "Yes — generative", "Yes — from library"],
                    ["Source citations on every answer", "Yes", "Limited", "Yes (TRACE score)", "Yes"],
                    ["Excel/CSV/DOCX/PDF import", "All four", "Excel + portals", "Excel + portals", "Excel + portals"],
                    ["Export mirrors source format", "Yes", "Partial", "Partial", "Partial"],
                    ["Audit log", "Yes (exportable)", "Enterprise tier", "Enterprise tier", "Higher tier"],
                    ["Minimum contract", "None — cancel anytime", "Annual", "Annual", "Annual"],
                    ["Public pricing page", "Yes — see below", "No — quote-only", "Starts at $10K", "Yes"],
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-4 py-3 font-medium">{row[0]}</td>
                      <td className="px-4 py-3 text-primary font-medium">{row[1]}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row[2]}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row[3]}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              * Loopio's range is from Vendr's transaction data (realized-spend averages: $19,974 SMB, $50,421 enterprise). Source: arphie.ai comparison, March 2025.
            </div>
          </Card>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-3">Pricing</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Flat per-org. No per-seat traps. Cancel anytime.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every plan includes the full workflow — upload, AI draft, review, export. Higher tiers raise the limits and add API + SSO.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-4">
            {PLAN_ORDER.map((id) => {
              const p = PLANS[id];
              const highlight = id === "pro";
              return (
                <Card
                  key={id}
                  className={`relative flex flex-col p-6 ${highlight ? "border-primary shadow-lg ring-1 ring-primary" : ""}`}
                >
                  {highlight && (
                    <Badge className="absolute -top-3 left-6">Most popular</Badge>
                  )}
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground min-h-[2.5rem]">{p.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${p.priceMonthly}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    or ${p.priceYearly}/yr (2 months free)
                  </p>
                  <ul className="mt-6 flex-1 space-y-2 text-sm">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="mt-6">
                    <Button className="w-full" variant={highlight ? "default" : "outline"}>
                      {p.id === "free" ? "Start free" : `Start ${p.name}`}
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            All prices in USD. Billed via Stripe. Dev-mode (no Stripe key configured) activates plans instantly without charging — set <code className="bg-muted px-1 py-0.5 rounded">STRIPE_SECRET_KEY</code> to go live.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b">
        <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
          <div className="text-center">
            <Badge variant="outline" className="mb-3">FAQ</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Questions you probably have.
            </h2>
          </div>
          <div className="mt-10">
            <LandingFAQ />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Stop losing deals to a 200-row spreadsheet.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Set up your content library in 10 minutes. Answer your next questionnaire in 90 minutes. Free plan, no credit card.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary">
                Start free <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3" />
            </div>
            <span>ReplyForge — security questionnaire response for SMB SaaS.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
