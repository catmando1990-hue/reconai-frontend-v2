import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Info,
  Maximize2,
  MessageSquare,
  Minimize2,
  Receipt,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./AIChat.css"; // Reuse the same CSS for identical layout

// Confidence levels
const CONFIDENCE = {
  HIGH: {
    level: "high",
    label: "High Confidence",
    icon: CheckCircle,
    color: "#1abc9c",
  },
  MEDIUM: {
    level: "medium",
    label: "Medium Confidence",
    icon: AlertCircle,
    color: "#f39c12",
  },
  LOW: {
    level: "low",
    label: "Low Confidence",
    icon: AlertTriangle,
    color: "#e74c3c",
  },
  ADVISORY: {
    level: "advisory",
    label: "General Guidance",
    icon: Info,
    color: "#4680ff",
  },
};

// Response categories for Invoicing intelligence
const RESPONSE_CATEGORIES = {
  INVOICES: { icon: FileText, label: "Invoices" },
  CUSTOMERS: { icon: Users, label: "Customers" },
  VENDORS: { icon: Building2, label: "Vendors" },
  BILLS: { icon: Receipt, label: "Bills" },
  PAYMENTS: { icon: CreditCard, label: "Payments" },
  RECEIVABLES: { icon: TrendingUp, label: "Receivables" },
  PAYABLES: { icon: TrendingDown, label: "Payables" },
  GENERAL: { icon: MessageSquare, label: "General" },
};

// Suggested prompts for Invoicing
const suggestedPrompts = [
  "Show outstanding invoices",
  "Who has overdue payments?",
  "Upcoming bills due",
  "Payment history this month",
  "Customer account summary",
  "Cash flow from invoicing",
];

// Advisory disclaimer for Invoicing
const DISCLAIMER =
  "Invoice and payment data shown is for informational purposes. Please verify amounts with your accounting records.";

// Simulated AI responses for Invoicing
function generateResponse(userMessage) {
  const lowerMsg = userMessage.toLowerCase();

  // Invoice queries
  if (
    lowerMsg.includes("invoice") ||
    lowerMsg.includes("invoices") ||
    lowerMsg.includes("outstanding")
  ) {
    return {
      content:
        "**Outstanding Invoices Summary**\n\n**Total Outstanding: 8 invoices ($42,850)**\n\n| Invoice # | Customer | Amount | Status | Age |\n|-----------|----------|--------|--------|-----|\n| INV-2026-042 | Atlas Group | $15,000 | Sent | 5 days |\n| INV-2026-041 | Meridian Corp | $8,200 | Sent | 12 days |\n| INV-2026-040 | Brightpath LLC | $4,500 | Viewed | 18 days |\n| INV-2026-039 | Summit Partners | $3,800 | Sent | 22 days |\n| INV-2026-038 | NovaTech | $2,100 | Partial Pay | 28 days |\n| INV-2026-037 | Global Tech | $5,250 | Overdue | 35 days |\n| INV-2026-036 | Pinnacle Inc | $2,500 | Overdue | 42 days |\n| INV-2026-035 | Vertex Systems | $1,500 | Overdue | 45 days |\n\n**Aging Breakdown:**\n• 0-15 days: $23,200 (54%)\n• 16-30 days: $10,400 (24%)\n• 31-45 days: $9,250 (22%)\n\n**Oldest:** INV-2026-035 (45 days)\n**Newest:** Draft invoice pending review\n\nWould you like to send reminders or view invoice details?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.INVOICES,
      sources: ["Invoice System", "Accounts Receivable"],
    };
  }

  // Overdue queries
  if (
    lowerMsg.includes("overdue") ||
    lowerMsg.includes("late") ||
    lowerMsg.includes("past due") ||
    lowerMsg.includes("delinquent")
  ) {
    return {
      content:
        "**Overdue Accounts Report**\n\n**Total Overdue: 3 invoices ($12,350)**\n\n| Invoice # | Customer | Amount | Days Overdue | Last Contact |\n|-----------|----------|--------|--------------|--------------|\n| INV-2026-037 | Global Tech | $5,250 | 5 days | Mar 28, 2026 |\n| INV-2026-036 | Pinnacle Inc | $2,500 | 12 days | Mar 22, 2026 |\n| INV-2026-035 | Vertex Systems | $1,500 | 15 days | Mar 20, 2026 |\n\n**Biggest Overdue: Global Tech ($12,350 total outstanding)**\n\n**Aging Breakdown:**\n• 1-7 days overdue: $5,250 (1 invoice)\n• 8-14 days overdue: $2,500 (1 invoice)\n• 15+ days overdue: $1,500 (1 invoice)\n\n**Actions Taken:**\n• Global Tech: Reminder sent Mar 28\n• Pinnacle Inc: Follow-up email Mar 22\n• Vertex Systems: Second reminder sent Mar 20\n\n**Recommendations:**\n• Escalate Vertex Systems (15 days overdue)\n• Schedule call with Global Tech (largest balance)\n• Consider payment plans for repeat late payers\n\nWould you like to send collection reminders or escalate any accounts?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.RECEIVABLES,
      sources: ["Accounts Receivable", "Collections Log"],
    };
  }

  // Bills queries
  if (
    lowerMsg.includes("bill") ||
    lowerMsg.includes("bills") ||
    lowerMsg.includes("payable") ||
    lowerMsg.includes("owe")
  ) {
    return {
      content:
        "**Bills & Payables Summary**\n\n**Total Due: 5 bills ($18,750)**\n\n| Bill # | Vendor | Amount | Due Date | Status |\n|--------|--------|--------|----------|--------|\n| BILL-0412 | CloudHost Pro | $2,850 | Apr 1 | Due Soon |\n| BILL-0413 | SecureIT Solutions | $11,700 | Mar 28 | **Overdue** |\n| BILL-0414 | Office Supplies Co | $450 | Apr 5 | Pending |\n| BILL-0415 | Marketing Agency | $2,500 | Apr 10 | Pending |\n| BILL-0416 | Utility Services | $1,250 | Apr 15 | Pending |\n\n**Next Due:** Apr 1 - CloudHost Pro ($2,850)\n**Overdue:** 1 bill - SecureIT Solutions ($11,700)\n\n**This Month's Payables:**\n• Total Bills: $18,750\n• Overdue: $11,700 (1 bill)\n• Due This Week: $2,850 (1 bill)\n• Due Later: $4,200 (3 bills)\n\n**Action Required:**\n• Pay SecureIT Solutions immediately (overdue)\n• Schedule CloudHost Pro payment (due Apr 1)\n\nWould you like to schedule payments or view vendor details?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.BILLS,
      sources: ["Accounts Payable", "Vendor Records"],
    };
  }

  // Payment queries
  if (
    lowerMsg.includes("payment") ||
    lowerMsg.includes("payments") ||
    lowerMsg.includes("paid") ||
    lowerMsg.includes("received") ||
    lowerMsg.includes("collected")
  ) {
    return {
      content:
        "**Payment Activity - This Month**\n\n**Received (Incoming):**\n• Total Received: $68,200\n• Number of Payments: 15\n• Average Payment: $4,547\n\n**Top Payments Received:**\n| Customer | Amount | Date | Method |\n|----------|--------|------|--------|\n| Atlas Group | $12,000 | Mar 25 | ACH |\n| Meridian Corp | $9,800 | Mar 22 | Wire |\n| Brightpath LLC | $8,500 | Mar 18 | ACH |\n| Summit Partners | $7,200 | Mar 15 | Check |\n| NovaTech | $6,400 | Mar 12 | ACH |\n\n**Sent (Outgoing):**\n• Total Sent: $9,290\n• Number of Payments: 4\n• Average Payment: $2,323\n\n**Net Cash Flow: +$58,910**\n\n**Payment Methods (Received):**\n• ACH: 9 payments (60%)\n• Wire: 3 payments (20%)\n• Check: 2 payments (13%)\n• Credit Card: 1 payment (7%)\n\n**Trends:**\n• vs. Last Month: +12.4% received\n• Collection Rate: 94.2%\n\nWould you like to see payment details or reconciliation status?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.PAYMENTS,
      sources: ["Payment Gateway", "Bank Records"],
    };
  }

  // Customer queries
  if (
    lowerMsg.includes("customer") ||
    lowerMsg.includes("client") ||
    lowerMsg.includes("account")
  ) {
    return {
      content:
        "**Customer Account Summary**\n\n**Active Customers: 6**\n\n| Customer | Revenue (YTD) | Outstanding | Status |\n|----------|---------------|-------------|--------|\n| Atlas Group | $48,000 | $15,000 | Active |\n| Global Tech | $35,200 | $5,250 | Overdue |\n| Meridian Corp | $28,600 | $8,200 | Active |\n| Brightpath LLC | $22,400 | $4,500 | Active |\n| Summit Partners | $18,900 | $3,800 | Active |\n| NovaTech | $15,100 | $2,100 | Active |\n\n**Top by Revenue:**\n1. Atlas Group: $48,000 YTD\n2. Global Tech: $35,200 YTD\n\n**Highest Outstanding:**\n• Atlas Group: $15,000\n• Meridian Corp: $8,200\n• Global Tech: $5,250\n\n**Customer Health:**\n• On-time payers: 4/6 (67%)\n• Repeat customers: 6/6 (100%)\n• Average payment terms: Net 30\n\n**Recent Activity:**\n• Atlas Group: Invoice sent Mar 25\n• Meridian Corp: Payment received Mar 22\n• Global Tech: Overdue reminder sent Mar 28\n\nWould you like to view detailed account history or create a new invoice?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.CUSTOMERS,
      sources: ["Customer Database", "Accounts Receivable"],
    };
  }

  // Vendor queries
  if (lowerMsg.includes("vendor") || lowerMsg.includes("supplier")) {
    return {
      content:
        "**Vendor Summary**\n\n**Total Vendors: 5 (4 Active, 1 Inactive)**\n\n| Vendor | Status | Outstanding | Payment Terms |\n|--------|--------|-------------|---------------|\n| CloudHost Pro | Active | $2,850 | Net 30 |\n| SecureIT Solutions | Active | $11,700 | Net 15 |\n| Office Supplies Co | Active | $450 | Net 30 |\n| Marketing Agency | Active | $2,500 | Net 45 |\n| Utility Services | Active | $1,250 | Net 30 |\n\n**Total Outstanding Bills: $18,750**\n\n**Next Payment Due:**\n• Apr 1 - CloudHost Pro ($2,850)\n\n**Spending by Category (YTD):**\n• Technology & Hosting: $14,550 (38%)\n• Security Services: $11,700 (31%)\n• Marketing: $7,500 (20%)\n• Office & Utilities: $4,200 (11%)\n\n**Vendor Metrics:**\n• Average Days to Pay: 24 days\n• On-time Payment Rate: 92%\n• Early Payment Discounts Captured: $1,200\n\nWould you like to view vendor details or schedule payments?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.VENDORS,
      sources: ["Vendor Database", "Accounts Payable"],
    };
  }

  // Cash flow / DSO queries
  if (
    lowerMsg.includes("cash flow") ||
    lowerMsg.includes("dso") ||
    lowerMsg.includes("days sales") ||
    lowerMsg.includes("collections") ||
    lowerMsg.includes("aging")
  ) {
    return {
      content:
        "**Cash Flow & Collections Analysis**\n\n**Days Sales Outstanding (DSO):**\n• Current DSO: 32 days\n• Previous Month: 38 days\n• Improvement: -6 days (15.8% better)\n• Industry Average: 35 days\n\n**AR Aging Breakdown:**\n| Aging Bucket | Amount | % of Total | Count |\n|-------------|--------|------------|-------|\n| Current (0-30 days) | $31,500 | 73.5% | 5 |\n| 31-60 days | $9,250 | 21.6% | 2 |\n| 61-90 days | $2,100 | 4.9% | 1 |\n| 90+ days | $0 | 0% | 0 |\n| **Total AR** | **$42,850** | **100%** | **8** |\n\n**Cash Flow Timing:**\n• Expected Collections (Next 7 Days): $15,000\n• Expected Collections (Next 30 Days): $33,600\n• Scheduled Payments Out: $18,750\n• Projected Net: +$14,850\n\n**Collection Efficiency:**\n• Collection Rate: 94.2%\n• Average Time to Collect: 28 days\n• Bad Debt Write-offs (YTD): $0\n\n**Trends:**\n• DSO improving 3 consecutive months\n• Cash conversion cycle shortened by 4 days\n\nWould you like to drill into aging details or review collection strategies?",
      confidence: CONFIDENCE.MEDIUM,
      category: RESPONSE_CATEGORIES.RECEIVABLES,
      sources: ["Accounts Receivable", "Cash Flow Reports"],
    };
  }

  // New invoice / create queries
  if (
    lowerMsg.includes("new invoice") ||
    lowerMsg.includes("create invoice") ||
    lowerMsg.includes("send invoice")
  ) {
    return {
      content:
        "**Create New Invoice**\n\n**Quick Steps:**\n1. Select or add a customer\n2. Set invoice date and payment terms\n3. Add line items (description, quantity, rate)\n4. Review totals and apply tax if applicable\n5. Send or save as draft\n\n**Required Fields:**\n• Customer name\n• Invoice date\n• Due date / Payment terms\n• At least one line item with amount\n\n**Last Invoice:** INV-2026-042 (Atlas Group, $15,000)\n**Suggested Next:** INV-2026-043\n\n**Default Settings:**\n• Payment Terms: Net 30\n• Tax Rate: 0% (adjust per item)\n• Currency: USD\n• Late Fee: 1.5% monthly\n\n**Templates Available:**\n• Standard Invoice\n• Recurring Invoice\n• Time & Materials\n• Fixed Fee / Milestone\n\n**Tip:** You can duplicate a recent invoice to save time. Just update the customer, dates, and amounts.\n\nWould you like to start creating INV-2026-043 or use a template?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.INVOICES,
      sources: ["Invoice System"],
    };
  }

  // Greeting
  if (
    lowerMsg.match(
      /^(hello|hi|hey|good morning|good afternoon|good evening)$/i,
    ) ||
    lowerMsg.includes("hello") ||
    lowerMsg.includes("hi there")
  ) {
    return {
      content:
        'Hello! I\'m your Invoicing Assistant, ready to help you manage invoices, payments, and billing operations.\n\n**I can help you with:**\n• Review outstanding invoices and overdue accounts\n• Track bills, payments, and cash flow\n• Manage customer and vendor accounts\n• Analyze receivables aging and trends\n\n**Try asking:**\n• "Show outstanding invoices"\n• "Who has overdue payments?"\n• "Payment history this month"\n\nWhat would you like to explore?',
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Thank you
  if (lowerMsg.includes("thank") || lowerMsg.includes("thanks")) {
    return {
      content:
        "You're welcome! I'm here whenever you need invoicing insights or payment data.\n\nIs there anything else I can help you with?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Help
  if (lowerMsg.includes("help") || lowerMsg.includes("what can you do")) {
    return {
      content:
        '**Invoicing Assistant Capabilities**\n\nI\'m designed to help you manage invoicing, payments, and billing operations efficiently.\n\n**Invoices:**\n• "Show outstanding invoices"\n• "Create a new invoice"\n• "Invoice aging breakdown"\n\n**Payments:**\n• "Payment history this month"\n• "Who has overdue payments?"\n• "Collection status"\n\n**Bills & Payables:**\n• "Upcoming bills due"\n• "Vendor payment schedule"\n• "Outstanding payables"\n\n**Customers & Vendors:**\n• "Customer account summary"\n• "Top customers by revenue"\n• "Vendor spending breakdown"\n\n**Cash Flow & Analytics:**\n• "Cash flow from invoicing"\n• "DSO analysis"\n• "Receivables aging report"\n\nJust ask naturally - I understand invoicing context!',
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Default response - invoicing focused
  return {
    content: `I understand you're asking about "${userMessage}".\n\nLet me help you with that. Could you provide more context?\n\n**I can assist with:**\n• Outstanding invoices and overdue accounts\n• Bills, payments, and cash flow tracking\n• Customer and vendor account management\n• Receivables aging and collection analysis\n• Creating and sending invoices\n\n**Example questions:**\n• "Show outstanding invoices"\n• "Who has overdue payments?"\n• "Upcoming bills due"\n\nWhat specific information would be most helpful?`,
    confidence: CONFIDENCE.ADVISORY,
    category: RESPONSE_CATEGORIES.GENERAL,
    sources: [],
  };
}

// Confidence Badge Component
function ConfidenceBadge({ confidence }) {
  const Icon = confidence.icon;
  return (
    <span
      className={`confidence-badge ${confidence.level}`}
      title={confidence.label}
    >
      <Icon size={12} />
      <span>{confidence.label}</span>
    </span>
  );
}

// Category Badge Component
function CategoryBadge({ category }) {
  const Icon = category.icon;
  return (
    <span className="category-badge">
      <Icon size={12} />
      <span>{category.label}</span>
    </span>
  );
}

// Message Component
function Message({ message, showMeta = true }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`message ${message.role}`}>
      <div className="message-avatar">
        {isAssistant ? <Bot size={18} /> : <User size={18} />}
      </div>
      <div className="message-wrapper">
        {isAssistant && showMeta && message.category && (
          <div className="message-meta">
            <CategoryBadge category={message.category} />
            {message.confidence && (
              <ConfidenceBadge confidence={message.confidence} />
            )}
          </div>
        )}
        <div className="message-content">
          <div className="message-text">{message.content}</div>
          {isAssistant && message.requiresDisclaimer && (
            <div className="message-disclaimer">
              <AlertTriangle size={12} />
              <span>
                Forecasts are projections based on current data and assumptions.
              </span>
            </div>
          )}
          {isAssistant && message.sources && message.sources.length > 0 && (
            <div className="message-sources">
              <span className="sources-label">Data from:</span>
              {message.sources.map((source, i) => (
                <span key={i} className="source-tag">
                  {source}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="message-time">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ onRetry }) {
  return (
    <div className="chat-error-state">
      <XCircle size={32} />
      <h4>Unable to connect</h4>
      <p>Invoicing Assistant is temporarily unavailable. Please try again.</p>
      <button onClick={onRetry}>
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

export default function InvoicingChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Welcome to Invoicing Intelligence. I'm your invoicing and payments assistant, here to help manage receivables and payables.\n\n**I can help you:**\n• Review outstanding invoices and overdue accounts\n• Track bills, payments, and cash flow\n• Manage customer and vendor accounts\n• Analyze receivables aging and trends\n\nWhat would you like to explore?",
      timestamp: new Date(),
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateResponse = async (userMessage) => {
    setIsTyping(true);
    setHasError(false);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 800 + Math.random() * 800),
      );

      if (Math.random() < 0.03) {
        throw new Error("Connection failed");
      }

      const response = generateResponse(userMessage);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          content: response.content,
          timestamp: new Date(),
          confidence: response.confidence,
          category: response.category,
          sources: response.sources,
          requiresDisclaimer: response.requiresDisclaimer,
        },
      ]);
    } catch (error) {
      setHasError(true);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setHasError(false);
    simulateResponse(input);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt) => {
    setInput(prompt);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setHasError(false);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const handleRetryError = () => {
    setHasError(false);
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (lastUserMessage) {
      simulateResponse(lastUserMessage.content);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content:
          "Chat cleared. I'm ready to help with your invoicing operations.\n\nWhat would you like to explore?",
        timestamp: new Date(),
        confidence: CONFIDENCE.ADVISORY,
        category: RESPONSE_CATEGORIES.GENERAL,
        sources: [],
      },
    ]);
    setHasError(false);
  };

  return (
    <div className={`ai-chat ${isExpanded ? "expanded" : "collapsed"}`}>
      <div className="chat-header">
        <div className="chat-title">
          <FileText size={20} />
          <span>Invoicing Assistant</span>
          <span className={`status-dot ${hasError ? "error" : ""}`}></span>
        </div>
        <div className="chat-actions">
          <button
            onClick={handleManualRefresh}
            title="Refresh connection"
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
          </button>
          <button onClick={clearChat} title="Clear chat">
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {showDisclaimer && (
            <div className="advisory-banner">
              <Shield size={14} />
              <span>{DISCLAIMER}</span>
              <button
                className="banner-dismiss"
                onClick={() => setShowDisclaimer(false)}
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="chat-messages">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="message assistant">
                <div className="message-avatar">
                  <Bot size={18} />
                </div>
                <div className="message-wrapper">
                  <div className="message-content typing">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}

            {hasError && <ErrorState onRetry={handleRetryError} />}

            <div ref={messagesEndRef} />
          </div>

          <div className="suggested-prompts">
            <span className="prompts-label">
              <Sparkles size={12} />
              Quick actions
            </span>
            <div className="prompts-list">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="prompt-chip"
                  onClick={() => handleSuggestedPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about invoices, payments, or billing..."
              rows={1}
              disabled={hasError}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isTyping || hasError}
            >
              <Send size={18} />
            </button>
          </div>

          <div className="chat-footer">
            <span className="refresh-time">
              <Clock size={10} />
              Data synced:{" "}
              {lastRefresh.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
