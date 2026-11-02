"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is the AI making up answers?",
    a: "No. Every draft is grounded in YOUR approved content library and the reference documents you upload. If the AI can't find a grounded answer, it returns \"We will provide this information on request.\" with low confidence - it never invents facts. Every draft also cites the source entry or document snippet it was built from, so a reviewer can verify in one click.",
  },
  {
    q: "How is this different from just pasting the questionnaire into ChatGPT?",
    a: "Three things. (1) Grounding: ChatGPT will happily invent answers from its training data; we constrain it to your content and cite every source. (2) Workflow: question parsing, reviewer assignment, status tracking, audit log, source-format export - none of that exists in a chat prompt. (3) Compliance: your data lives in a multi-tenant system with tenant isolation and an audit trail, which is what your enterprise buyers actually want to hear during procurement.",
  },
  {
    q: "Can I export back into the buyer's original Excel format?",
    a: "Yes. When you upload an Excel/CSV questionnaire, we preserve the question IDs and source structure. On export, we generate a filled spreadsheet that mirrors the source columns (ID, question, answer, confidence, source). Paste it into the buyer's portal or attach it directly.",
  },
  {
    q: "What happens when my plan limits are hit?",
    a: "You get a clear in-app message naming the limit (e.g. \"15 projects/month on Starter\"). We never silently block work - you can upgrade from the billing page in one click, or wait for the next monthly reset. The Free plan resets on the 1st of each month.",
  },
  {
    q: "Do you train AI models on my data?",
    a: "No. Your content library, documents, and questionnaire projects are never used to train any model. They're used at request time only to generate the draft for that specific question.",
  },
  {
    q: "Where is my data stored?",
    a: "In the default deployment, your data is in a Postgres database (SQLite for the dev sandbox) on your hosting provider. The deployment docs show how to run it on Vercel + Neon, Railway, Fly.io, or your own VPC. We never see your data.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from the billing page; your subscription stops at the end of the current period and your account drops to the Free plan. No phone calls, no retention gauntlet. Your data stays accessible on the Free plan.",
  },
  {
    q: "Do you support SSO / SAML?",
    a: "SAML SSO is available on the Business plan. Email hello@replyforge.app after subscribing and we'll configure your IdP (Okta, Google Workspace, Azure AD, etc.) within one business day.",
  },
];

export function LandingFAQ() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQS.map((f, i) => (
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
