import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

type ChatRequest = {
  message: string;
  context?: string;
};

/**
 * POST /api/intelligence/worker/chat
 *
 * AI Worker chat endpoint for interactive assistance.
 * Provides structured responses for finance workflow questions.
 */
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const body = (await req.json()) as ChatRequest;
    const { message, context } = body;

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        { ok: false, error: "Message is required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // Generate contextual response based on message content
    const response = generateAssistantResponse(message.trim(), context);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        ok: true,
        message: assistantMessage,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[AI Worker Chat] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to process message", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * Generate contextual response based on user query.
 * In production, this would integrate with an LLM.
 */
function generateAssistantResponse(message: string, context?: string): string {
  const lowerMessage = message.toLowerCase();

  // Task-related queries
  if (lowerMessage.includes("task") || lowerMessage.includes("queue")) {
    return "I can help you manage your task queue. Tasks are AI-generated recommendations based on your financial data patterns. Each task shows a confidence score - tasks with ≥0.85 confidence are typically ready for review. You can approve tasks to execute the recommended action, or dismiss them if they're not relevant.";
  }

  // Categorization queries
  if (lowerMessage.includes("categoriz") || lowerMessage.includes("category")) {
    return "Transaction categorization uses pattern matching and historical data to suggest categories. If you see uncategorized transactions, I can help identify patterns. Common categories include: Operating Expenses, Revenue, Payroll, Utilities, and Professional Services. Would you like me to analyze any specific transactions?";
  }

  // Reconciliation queries
  if (lowerMessage.includes("reconcil") || lowerMessage.includes("match")) {
    return "Reconciliation matches your bank transactions against expected entries. I can identify discrepancies, duplicate entries, and missing transactions. For best results, ensure your bank connections are synced and all manual entries are recorded. What specific reconciliation issue are you working on?";
  }

  // Report queries
  if (lowerMessage.includes("report") || lowerMessage.includes("export")) {
    return "I can help you generate various reports: Transaction Ledger, Account Activity, Recurring Transactions, Category Spend, and Exception Reports. Reports can be exported as CSV or PDF. The Exception Report is particularly useful for identifying items that need attention. Which report would you like to generate?";
  }

  // Alert queries
  if (lowerMessage.includes("alert") || lowerMessage.includes("notif")) {
    return "Alerts are generated when I detect unusual patterns in your financial data - large transactions, duplicate payments, or unexpected category changes. You can configure alert thresholds and notification preferences in Settings. Would you like me to explain any specific alert you've received?";
  }

  // Workflow queries
  if (lowerMessage.includes("workflow") || lowerMessage.includes("automat")) {
    return "AI Worker automates common finance workflows: transaction categorization, duplicate detection, vendor normalization, and recurring transaction identification. Each automated action requires your approval before execution. You maintain full control while I handle the analysis. What workflow would you like to set up?";
  }

  // Help or getting started
  if (
    lowerMessage.includes("help") ||
    lowerMessage.includes("start") ||
    lowerMessage.includes("how")
  ) {
    return "I'm your AI finance assistant. Here's how I can help:\n\n• **Task Queue**: Review and approve AI-generated recommendations\n• **Categorization**: Organize transactions into proper categories\n• **Reconciliation**: Match and verify transactions\n• **Reports**: Generate financial reports and exports\n• **Alerts**: Get notified about unusual patterns\n\nWhat would you like to work on?";
  }

  // Confidence queries
  if (lowerMessage.includes("confidence") || lowerMessage.includes("score")) {
    return "Confidence scores indicate how certain I am about a recommendation. Scores ≥0.85 (high confidence) are typically accurate and ready for approval. Scores between 0.60-0.84 (medium) may need verification. Scores below 0.60 (low) require careful review. The score is based on pattern matching, historical accuracy, and data quality.";
  }

  // Default response
  return `I understand you're asking about: "${message}"\n\nAs your AI finance assistant, I can help with:\n• Task queue management\n• Transaction categorization\n• Reconciliation\n• Report generation\n• Alert configuration\n\nCould you provide more details about what you'd like to accomplish?`;
}
