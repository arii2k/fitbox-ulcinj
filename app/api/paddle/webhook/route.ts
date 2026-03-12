import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const event = body.event_type;
    const subscriptionId = body.data?.id;
    const status = body.data?.status;
    const nextBilledAt = body.data?.next_billed_at;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscription id" }, { status: 400 });
    }

    // Map Paddle status → your system status
    let mappedStatus = "inactive";

    if (status === "active" || status === "trialing") {
      mappedStatus = "active";
    }

    if (status === "paused" || status === "canceled") {
      mappedStatus = "inactive";
    }

    await supabase
      .from("gym_subscriptions")
      .update({
        status: mappedStatus,
        expires_at: nextBilledAt,
      })
      .eq("paddle_subscription_id", subscriptionId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Paddle webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}