import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * Core Intelligence - Auto-Categorize API
 *
 * AI-powered automatic transaction categorization.
 * This is part of the Core domain intelligence system.
 */

interface AutoCategorizeResponse {
  categorized: number;
  message?: string;
}

export async function POST(): Promise<NextResponse<AutoCategorizeResponse>> {
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { categorized: 0, message: "Unauthorized" },
      { status: 401 },
    );
  }

  // In production, this would:
  // 1. Fetch uncategorized transactions for the org
  // 2. Call Claude/AI to categorize them
  // 3. Update the transactions with suggested categories
  // 4. Return count of categorized transactions

  // For now, return demo response
  return NextResponse.json({
    categorized: 0,
    message: "Auto-categorization is not yet connected to backend. Demo mode.",
    _demo: true,
    _org_id: orgId,
  } as AutoCategorizeResponse & { _demo: boolean; _org_id: string | null });
}
