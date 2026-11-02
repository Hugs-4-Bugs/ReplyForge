"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Shield, Sparkles, ArrowRight, Clock, DollarSign, Users,
  TrendingDown, TrendingUp, CheckCircle2, XCircle, Zap,
  FileText, Lock, Building2,
} from "lucide-react";

// Animated counter that counts up when scrolled into view
function Counter({
  to, suffix = "", prefix = "", decimals = 0, duration = 1.5,
}: {
  to: number; suffix?: string; prefix?: string; decimals?: number; duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (startTime === null) startTime = ts;
      const progress = Math.min((ts - startTime) / (duration * 1000), 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(to * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
}

const beforeAfterData = [
  {
    metric: "Time per questionnaire",
    before: { value: "20–40", unit: "hours", icon: Clock },
    after: { value: "1–3", unit: "hours", icon: Zap },
    savings: "92% faster",
  },
  {
    metric: "Annual software cost",
    before: { value: "$15K–$150K", unit: "/yr (Loopio)", icon: DollarSign },
    after: { value: "$1,188", unit: "/yr (Starter)", icon: DollarSign },
    savings: "96% cheaper",
  },
  {
    metric: "Deal slip time",
    before: { value: "1–2", unit: "weeks", icon: TrendingDown },
    after: { value: "0", unit: "days", icon: TrendingUp },
    savings: "Same-day response",
  },
  {
    metric: "People pulled in",
    before: { value: "3–5", unit: "(CTO, Legal, Sec)", icon: Users },
    after: { value: "1", unit: "(reviewer only)", icon: Users },
    savings: "85% less SME time",
  },
];

const trustStats = [
  { value: 1700, suffix: "+", label: "Loopio customers paying $15K–$150K/yr (proof of demand)", decimals: 0 },
  { value: 24, suffix: "+ hrs", label: "saved per questionnaire (SiftHub, 2026)", decimals: 0 },
  { value: 90, suffix: "%", label: "reduction in completion time (industry data)", decimals: 0 },
  { value: 500, prefix: "$", suffix: "K", label: "avg deal value gated by questionnaires", decimals: 0 },
];

export function Hero() {
  const [showAfter, setShowAfter] = useState(true);

  return (
    <section className="relative overflow-hidden border-b">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.96_0.03_120)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_80%_20%,oklch(0.95_0.02_240)_0%,transparent_60%)]" />
        {/* Floating orbs */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              left: `${10 + i * 30}%`,
              top: `${20 + i * 15}%`,
              background: i === 0 ? "oklch(0.7 0.15 120)" : i === 1 ? "oklch(0.6 0.1 240)" : "oklch(0.7 0.12 60)",
              filter: "blur(40px)",
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Built for SMB SaaS closing enterprise deals
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-balance text-center text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl"
        >
          Answer security questionnaires in{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              minutes
            </span>
            <motion.span
              className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-gradient-to-r from-green-600 to-emerald-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              style={{ originX: 0 }}
            />
          </span>
          , not days.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-6 max-w-3xl text-pretty text-center text-lg text-muted-foreground md:text-xl"
        >
          ReplyForge drafts defensible answers from your own approved content library —
          with source citations on every line. The same workflow Loopio charges{" "}
          <span className="font-semibold text-foreground">$30K+/year</span> for, at{" "}
          <span className="font-semibold text-foreground">$99/month</span>. No seat traps. No contract. No implementation fee.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/signup">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="w-full sm:w-auto">
                Start free — no card <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
          <a href="#before-after">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                See the numbers
              </Button>
            </motion.div>
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-4 text-center text-xs text-muted-foreground"
        >
          Free plan: 2 questionnaires/month, 25 questions each, 25 AI drafts. No credit card.
        </motion.p>

        {/* Trust stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {trustStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1 + i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="p-4 text-center transition-shadow hover:shadow-lg">
                <div className="text-2xl font-bold text-green-600 md:text-3xl">
                  <Counter
                    to={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Before / After comparison */}
        <motion.div
          id="before-after"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mt-20"
        >
          <div className="mb-8 text-center">
            <Badge variant="outline" className="mb-3">Before vs. After</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              The math is unambiguous.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Click the toggle to see what changes when you switch from spreadsheets + Slack (or Loopio) to ReplyForge.
            </p>
          </div>

          {/* Toggle */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-lg border bg-muted p-1">
              <button
                onClick={() => setShowAfter(false)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  !showAfter ? "bg-destructive text-white shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Before (manual / Loopio)
              </button>
              <button
                onClick={() => setShowAfter(true)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  showAfter ? "bg-green-600 text-white shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                After (ReplyForge)
              </button>
            </div>
          </div>

          {/* Comparison cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={showAfter ? "after" : "before"}
              initial={{ opacity: 0, x: showAfter ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: showAfter ? -30 : 30 }}
              transition={{ duration: 0.3 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
              {beforeAfterData.map((item, i) => {
                const data = showAfter ? item.after : item.before;
                const isAfter = showAfter;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card
                      className={`h-full p-5 transition-all ${
                        isAfter
                          ? "border-green-500/30 bg-green-50/50"
                          : "border-destructive/20 bg-red-50/30"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <data.icon className={`h-5 w-5 ${isAfter ? "text-green-600" : "text-destructive"}`} />
                        {isAfter ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {item.metric}
                      </div>
                      <div className={`mt-1 text-2xl font-bold ${isAfter ? "text-green-700" : "text-destructive"}`}>
                        {data.value}
                      </div>
                      <div className="text-xs text-muted-foreground">{data.unit}</div>
                      {isAfter && (
                        <div className="mt-3 inline-block rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {item.savings}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* ROI callout */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <Card className="border-2 border-green-500/20 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
              <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900">
                    One saved deal pays for 4 years of ReplyForge.
                  </h3>
                  <p className="text-sm text-green-800">
                    Average enterprise deal gated by a questionnaire:{" "}
                    <strong>$50K–$500K</strong>. ReplyForge Starter:{" "}
                    <strong>$1,188/year</strong>. ROI:{" "}
                    <strong>42×–421× on a single deal</strong>.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
