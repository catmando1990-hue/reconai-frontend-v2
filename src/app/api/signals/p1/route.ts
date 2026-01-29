import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/signals/p1
 *
 * Phase 6.2 Exception Signals API
 * Returns rule-based exception signals for the Exception Report
 *
 * Query params:
 * - min_confidence: minimum confidence threshold (default 0.5)
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const url = new URL(req.url);
    const minConfidence = parseFloat(
      url.searchParams.get("min_confidence") || "0.5",
    );

    const supabase = supabaseAdmin();

    // Get transactions for exception analysis
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        "id, amount, merchant_name, name, date, category, account_id, pending",
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(500);

    if (error) {
      console.error("[Signals P1] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    const signals: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      entity_id: string;
      evidence_ref: string;
      created_at: string;
      confidence: number;
    }> = [];

    // E1: Uncategorized Transaction
    const uncategorized = (transactions || []).filter(
      (tx) => !tx.category || tx.category === "Uncategorized",
    );
    for (const tx of uncategorized.slice(0, 10)) {
      signals.push({
        id: `e1_${tx.id}`,
        type: "E1",
        title: "Uncategorized Transaction",
        description: `Transaction "${tx.merchant_name || tx.name || "Unknown"}" has no category assigned.`,
        entity_id: tx.id,
        evidence_ref: tx.id,
        created_at: new Date().toISOString(),
        confidence: 1.0,
      });
    }

    // E2: Duplicate Transaction (same merchant, amount, date)
    const seen = new Map<string, typeof transactions>();
    for (const tx of transactions || []) {
      const key = `${tx.merchant_name || tx.name}|${tx.amount}|${tx.date}`;
      const existing = seen.get(key);
      if (existing && existing.length > 0) {
        signals.push({
          id: `e2_${tx.id}`,
          type: "E2",
          title: "Duplicate Transaction",
          description: `Possible duplicate: "${tx.merchant_name || tx.name}" for $${Math.abs(tx.amount).toFixed(2)} on ${tx.date}.`,
          entity_id: tx.id,
          evidence_ref: existing[0].id,
          created_at: new Date().toISOString(),
          confidence: 0.85,
        });
      }
      seen.set(key, [...(existing || []), tx]);
    }

    // E3: Amount Threshold Breach (over $10,000)
    const largeTransactions = (transactions || []).filter(
      (tx) => Math.abs(tx.amount) > 10000,
    );
    for (const tx of largeTransactions) {
      signals.push({
        id: `e3_${tx.id}`,
        type: "E3",
        title: "Amount Threshold Breach",
        description: `Large transaction of $${Math.abs(tx.amount).toFixed(2)} at "${tx.merchant_name || tx.name || "Unknown"}".`,
        entity_id: tx.id,
        evidence_ref: tx.id,
        created_at: new Date().toISOString(),
        confidence: 1.0,
      });
    }

    // E5: Missing Counterparty
    const missingCounterparty = (transactions || []).filter(
      (tx) => !tx.merchant_name && !tx.name,
    );
    for (const tx of missingCounterparty.slice(0, 10)) {
      signals.push({
        id: `e5_${tx.id}`,
        type: "E5",
        title: "Missing Counterparty",
        description: `Transaction on ${tx.date} for $${Math.abs(tx.amount).toFixed(2)} has no merchant or name.`,
        entity_id: tx.id,
        evidence_ref: tx.id,
        created_at: new Date().toISOString(),
        confidence: 1.0,
      });
    }

    // Filter by confidence threshold
    const filteredSignals = signals.filter(
      (s) => s.confidence >= minConfidence,
    );

    return NextResponse.json(
      {
        mode: "live",
        signals: filteredSignals,
        disclaimer:
          "Exception signals are advisory and rule-based. They do not imply enforcement or automated action.",
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Signals P1] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
