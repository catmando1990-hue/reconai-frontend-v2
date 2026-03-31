"use client";

import "@/styles/components/AIChat.css"; // Reuse the same CSS for identical layout
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Building2,
  Calculator,
  CheckCircle,
  Clock,
  DollarSign,
  FileSearch,
  FileText,
  Info,
  Maximize2,
  MessageSquare,
  Minimize2,
  RefreshCw,
  ScrollText,
  Send,
  Shield,
  Sparkles,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    color: "#8b5cf6",
  },
};

// Response categories for GovCon intelligence
const RESPONSE_CATEGORIES = {
  CONTRACTS: { icon: ScrollText, label: "Contracts" },
  TIMEKEEPING: { icon: Clock, label: "Timekeeping" },
  INDIRECTS: { icon: Calculator, label: "Indirect Costs" },
  COMPLIANCE: { icon: Shield, label: "DCAA Compliance" },
  AUDIT: { icon: FileSearch, label: "Audit" },
  BILLING: { icon: DollarSign, label: "Billing" },
  PROPOSALS: { icon: FileText, label: "Proposals" },
  GENERAL: { icon: MessageSquare, label: "General" },
};

// Suggested prompts for GovCon
const suggestedPrompts = [
  "Show active contract status",
  "DCAA readiness summary",
  "Current indirect rates",
  "Timekeeping compliance check",
  "Upcoming contract deadlines",
  "Audit trail summary",
];

// Advisory disclaimer for GovCon
const DISCLAIMER =
  "Government contracting data shown is for tracking purposes. Verify all compliance matters with your DCAA auditor or contracting officer.";

// Simulated AI responses for GovCon
function generateResponse(userMessage) {
  const lowerMsg = userMessage.toLowerCase();

  // Contract queries
  if (
    lowerMsg.includes("contract") ||
    lowerMsg.includes("contracts") ||
    lowerMsg.includes("active") ||
    lowerMsg.includes("task order")
  ) {
    return {
      content:
        "**Active Contract Status**\n\n**Portfolio Summary:**\n• Active Contracts: 5 | Completed: 1\n• Total Portfolio Value: $42.1M\n\n**Active Contracts:**\n\n| Contract | Type | Value | % Complete |\n|----------|------|-------|------------|\n| FA-8721 | FFP | $4.2M | 68% |\n| W912DY | T&M | $6.8M | 42% |\n| N00024 | CPFF | $3.2M | 91% |\n| GS-35F | IDIQ | $25M | — |\n| HHSN-316 | CPAF | $2.1M | — |\n\n**Key Actions Required:**\n• N00024 closeout due May 2026\n• FA-8721 option year decision needed\n\n**Alerts:**\n• N00024 nearing completion — begin closeout preparation\n• FA-8721 option exercise deadline approaching\n\nWould you like details on a specific contract?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.CONTRACTS,
      sources: ["Contract Management System", "FPDS Records"],
    };
  }

  // DCAA readiness queries
  if (
    lowerMsg.includes("dcaa") ||
    lowerMsg.includes("readiness") ||
    lowerMsg.includes("compliance") ||
    lowerMsg.includes("audit ready")
  ) {
    return {
      content:
        "**DCAA Readiness Assessment**\n\n**Overall Readiness Score: 87%**\n\n**Areas Reviewed:**\n\n| Area | Status |\n|------|--------|\n| General Ledger | Pass |\n| Cost Accounting | Pass |\n| Timekeeping | Warning — supervisor approval gap |\n| Indirect Rates | Pass |\n| Billing | Pass |\n\n**Next DCAA Engagement:** Expected Q3 2026\n\n**Recommended Actions:**\n1. Formalize timesheet approval workflow\n2. Update CAS disclosure statement\n\n**Risk Assessment:**\n• Timekeeping approval gap is a moderate risk\n• All other areas meet DCAA standards\n• Disclosure statement update is low priority but recommended\n\nWould you like details on any specific area or help preparing for the engagement?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.COMPLIANCE,
      sources: ["Compliance Management System", "Internal Audit Records"],
    };
  }

  // Indirect rate queries
  if (
    lowerMsg.includes("indirect") ||
    lowerMsg.includes("rate") ||
    lowerMsg.includes("overhead") ||
    lowerMsg.includes("fringe") ||
    lowerMsg.includes("g&a") ||
    lowerMsg.includes("pool")
  ) {
    return {
      content:
        "**Indirect Cost Rate Summary**\n\n**Current Provisional Rates:**\n\n| Rate Pool | Provisional | Actual (Trending) |\n|-----------|------------|-------------------|\n| Fringe | 32.5% | 32.1% |\n| Overhead | 45.2% | 46.1% |\n| G&A | 12.8% | 12.5% |\n| Material Handling | 3.5% | 3.4% |\n| Facilities | 8.4% | 8.2% |\n\n**Total Indirect Rate: 90.5%**\n\n**Notable Variances:**\n• Overhead variance of +2.0% — may require rate adjustment request\n• All other pools within acceptable range\n\n**Prior Year Comparison:**\n• Fringe: 31.8% → 32.5% (+0.7pp)\n• Overhead: 44.0% → 45.2% (+1.2pp)\n• G&A: 13.2% → 12.8% (-0.4pp)\n\n**Action Items:**\n• Monitor overhead trending — consider provisional rate adjustment\n• Prepare incurred cost submission for prior year\n\nWant to drill into a specific rate pool or model scenarios?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.INDIRECTS,
      sources: ["Cost Accounting System", "Rate Pool Analysis"],
    };
  }

  // Timekeeping queries
  if (
    lowerMsg.includes("timesheet") ||
    lowerMsg.includes("timekeeping") ||
    lowerMsg.includes("hours") ||
    lowerMsg.includes("labor") ||
    lowerMsg.includes("charge")
  ) {
    return {
      content:
        "**Timekeeping Status**\n\n**Current Week:**\n• Total Hours Recorded: 38.5 hrs\n• Charge Codes Active: 5\n\n**Labor Distribution:**\n• Direct Labor: 35.5 hrs (92%)\n• Indirect Labor: 3.0 hrs (8%)\n\n**Status:** Draft — not yet submitted\n\n**Prior Weeks:**\n• Week of Mar 17: Approved\n• Week of Mar 10: Approved\n• Week of Mar 3: Approved\n\n**Compliance Note:**\nEnsure daily contemporaneous recording per DCAA requirements. Timesheets should reflect actual hours worked and be recorded no later than the end of each workday.\n\n**Charge Code Summary:**\n• FA-8721-001: 18.0 hrs\n• W912DY-003: 12.5 hrs\n• N00024-002: 5.0 hrs\n• IR&D: 2.0 hrs\n• G&A: 1.0 hr\n\nNeed to review charge code details or submission history?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.TIMEKEEPING,
      sources: ["Timekeeping System", "Labor Distribution Records"],
    };
  }

  // Audit queries
  if (
    lowerMsg.includes("audit") ||
    lowerMsg.includes("trail") ||
    lowerMsg.includes("evidence") ||
    lowerMsg.includes("hash") ||
    lowerMsg.includes("integrity")
  ) {
    return {
      content:
        "**Audit Trail Status**\n\n**Summary:**\n• Total Records: 1,247\n• Chain Integrity: Verified\n• Last DCAA Export: Mar 15, 2026\n• Retention Policy: 6-year active\n\n**Recent Activity (This Week):**\n1. Timesheet submission — Mar 28\n2. Rate update (overhead) — Mar 27\n3. Account reconciliation — Mar 26\n4. Contract modification (FA-8721) — Mar 25\n5. Invoice generation (W912DY) — Mar 25\n6. Labor correction entry — Mar 24\n\n**Evidence Status:**\n\n| Category | Status |\n|----------|--------|\n| Financial Statements | Current |\n| Bank Records | Current |\n| Labor Records | Current |\n| Indirect Cost Data | Pending Update |\n\n**Retention Schedule:**\n• Oldest record: Sep 2020\n• Next purge eligible: Sep 2026\n• All records within retention window\n\nWould you like to export audit data or review specific entries?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.AUDIT,
      sources: ["Audit Management System", "Document Repository"],
    };
  }

  // Billing / invoice queries
  if (
    lowerMsg.includes("billing") ||
    lowerMsg.includes("invoice") ||
    lowerMsg.includes("payment") ||
    lowerMsg.includes("progress") ||
    lowerMsg.includes("wawf")
  ) {
    return {
      content:
        "**Billing & Invoice Status**\n\n**Outstanding Invoices: 3 ($485,000 total)**\n\n**Pending Review:**\n• Progress Payment #INV-2026-042\n  — Contract: FA-8721 | Amount: $185,000\n  — Status: Awaiting COR approval\n\n**Approved — Not Yet Paid:**\n• #INV-2026-038 — $175,000 (W912DY)\n• #INV-2026-036 — $125,000 (N00024)\n\n**Payment Metrics:**\n• Avg Payment Cycle: 32 days\n• On-time Payment Rate: 94%\n\n**Upcoming Milestones:**\n• W912DY monthly T&M invoice due Apr 5\n• FA-8721 progress payment due Apr 15\n• N00024 final invoice (closeout) due May 2026\n\n**WAWF Status:**\n• All submissions current\n• No rejected invoices\n\nWould you like to prepare an invoice or review payment history?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.BILLING,
      sources: ["Billing System", "WAWF Records"],
    };
  }

  // SF-1408 / pre-award queries
  if (
    lowerMsg.includes("sf-1408") ||
    lowerMsg.includes("sf1408") ||
    lowerMsg.includes("pre-award") ||
    lowerMsg.includes("preaward") ||
    lowerMsg.includes("accounting system")
  ) {
    return {
      content:
        "**SF-1408 Self-Assessment**\n\n**Overall Status: 14/16 Items Documented (87.5%)**\n\n**Section Breakdown:**\n\n| Section | Score | Status |\n|---------|-------|--------|\n| General Accounting | 3/4 | Partial |\n| Cost Accounting | 4/4 | Complete |\n| Timekeeping | 3/4 | Partial |\n| Billing & Indirect | 4/4 | Complete |\n\n**Identified Gaps:**\n1. **Chart of Accounts FAR Mapping** — needs review\n   — Current COA exists but FAR cost element mapping needs documentation\n2. **Supervisor Approval Process** — partial\n   — Process exists but not fully formalized in written policy\n\n**Recommendations:**\n• Complete these 2 items before next DCAA engagement\n• Estimated effort: 2-3 days for both items\n• Priority: High — these are common audit focus areas\n\n**Resources:**\n• [SF-1408 Checklist] [Gap Analysis Report] [Remediation Plan]\n\nWould you like help addressing either gap?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.COMPLIANCE,
      sources: ["SF-1408 Assessment", "Compliance Records"],
    };
  }

  // Reconciliation queries
  if (
    lowerMsg.includes("reconciliation") ||
    lowerMsg.includes("reconcile") ||
    lowerMsg.includes("variance") ||
    lowerMsg.includes("ics")
  ) {
    return {
      content:
        "**Reconciliation Status**\n\n**Last Reconciliation:**\n• Date: Mar 28, 2026\n• Type: Full ICS (Q1 2026)\n• Result: Completed with variances\n\n**Open Variances: 3**\n\n| # | Severity | Description | Amount |\n|---|----------|-------------|--------|\n| 1 | High | Overhead pool allocation | $12,400 |\n| 2 | Medium | Labor reclassification | $3,200 |\n| 3 | Low | Material handling timing | $850 |\n\n**Resolved This Month:** 12 variances\n\n**ICS Schedule Documentation:**\n• Schedules current: 5 of 6\n• Schedule H (home office) — needs update\n\n**Next Recommended Action:**\n• Run labor reconciliation for March\n• Address high-severity overhead variance\n• Update Schedule H before Q2\n\nWould you like to drill into a specific variance or start a reconciliation?",
      confidence: CONFIDENCE.MEDIUM,
      category: RESPONSE_CATEGORIES.COMPLIANCE,
      sources: ["Reconciliation System", "ICS Records"],
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
        'Hello! I\'m your GovCon Intelligence assistant, specialized in government contracting support.\n\n**I can help you with:**\n• Review contract status and deadlines\n• Check DCAA readiness and compliance\n• Monitor indirect cost rates\n• Track timekeeping compliance\n• Review audit trail integrity\n• Check billing and invoice status\n\n**Try asking:**\n• "Show active contract status"\n• "DCAA readiness summary"\n• "Current indirect rates"\n\nWhat would you like to explore?',
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Thank you
  if (lowerMsg.includes("thank") || lowerMsg.includes("thanks")) {
    return {
      content:
        "You're welcome! I'm here whenever you need government contracting insights or compliance support.\n\nIs there anything else I can help you with?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Help
  if (lowerMsg.includes("help") || lowerMsg.includes("what can you do")) {
    return {
      content:
        '**GovCon Intelligence Capabilities**\n\nI\'m designed to help government contractors manage compliance, contracts, and cost accounting.\n\n**Contracts:**\n• "Show active contract status"\n• "Upcoming contract deadlines"\n• "Task order summary"\n\n**DCAA Compliance:**\n• "DCAA readiness summary"\n• "SF-1408 assessment"\n• "Compliance check"\n\n**Indirect Rates:**\n• "Current indirect rates"\n• "Overhead pool analysis"\n• "Rate variance report"\n\n**Timekeeping:**\n• "Timekeeping compliance check"\n• "Current week hours"\n• "Labor distribution"\n\n**Audit:**\n• "Audit trail summary"\n• "Evidence status"\n• "Integrity verification"\n\n**Billing:**\n• "Outstanding invoices"\n• "WAWF status"\n• "Payment history"\n\n**Reconciliation:**\n• "Reconciliation status"\n• "Open variances"\n• "ICS schedule review"\n\nJust ask naturally - I understand government contracting context!',
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Default response - GovCon focused
  return {
    content: `I understand you're asking about "${userMessage}".\n\nLet me help you with that. Could you provide more context?\n\n**I can assist with:**\n• Contract status and management\n• DCAA compliance and readiness\n• Indirect cost rate monitoring\n• Timekeeping compliance\n• Audit trail and integrity\n• Billing and invoicing\n• SF-1408 pre-award surveys\n• Reconciliation and variances\n\n**Example commands:**\n• "Show active contract status"\n• "DCAA readiness summary"\n• "Current indirect rates"\n\nWhat specific information would be most helpful?`,
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
      <p>GovCon Intelligence is temporarily unavailable. Please try again.</p>
      <button onClick={onRetry}>
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

export default function GovConChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Welcome to GovCon Intelligence. I'm your government contracting assistant, here to help manage contracts, track DCAA compliance, and monitor cost accounting.\n\n**I can help you:**\n• Review contract status and deadlines\n• Check DCAA readiness and compliance\n• Monitor indirect cost rates\n• Track timekeeping compliance\n• Review audit trail integrity\n• Check billing and invoice status\n\nWhat would you like to explore?",
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
    } catch {
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
          "Chat cleared. I'm ready to help with your government contracting operations.\n\nWhat would you like to explore?",
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
          <Building2 size={20} />
          <span>GovCon Intelligence</span>
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
              placeholder="Ask about contracts, compliance, or rates..."
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
