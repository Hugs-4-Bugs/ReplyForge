import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeMode, handleWebhookEvent } from "@/lib/stripe";
import Stripe from "stripe";

// Stripe webhook. Reads raw body - must NOT use the JSON body parser.
export async function POST(req: NextRequest) {
  if (stripeMode !== "live" || !stripe) {
    return NextResponse.json(
      { error: "Stripe not configured. Set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET to enable webhooks." },
      { status: 400 },
    );
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const raw = Buffer.from(await req.arrayBuffer());
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }
  try {
    await handleWebhookEvent(event);
  } catch (err: any) {
    console.error("[stripe.webhook] handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
