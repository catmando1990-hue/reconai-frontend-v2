"use client";

import "@/styles/components/AIChat.css"; // Reuse the same CSS for identical layout
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Heart,
  Info,
  Maximize2,
  MessageSquare,
  Minimize2,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  Trash2,
  User,
  Users,
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
    color: "#4680ff",
  },
};

// Response categories for Payroll intelligence
const RESPONSE_CATEGORIES = {
  PAYROLL: { icon: DollarSign, label: "Payroll Analysis" },
  PEOPLE: { icon: Users, label: "People & HR" },
  COMPENSATION: { icon: CreditCard, label: "Compensation" },
  TIMEKEEPING: { icon: Clock, label: "Time & Labor" },
  BENEFITS: { icon: Heart, label: "Benefits" },
  TAXES: { icon: FileText, label: "Tax & Compliance" },
  COMPLIANCE: { icon: Shield, label: "Compliance" },
  GENERAL: { icon: MessageSquare, label: "General" },
};

// Suggested prompts for Payroll
const suggestedPrompts = [
  "Show me this month's payroll summary",
  "Who has overtime this week?",
  "Next pay run details",
  "Benefits enrollment status",
  "Tax withholding breakdown",
  "Time-off balances",
];

// Advisory disclaimer for Payroll
const DISCLAIMER =
  "Payroll data shown is for informational purposes. Please verify with your HR team or payroll administrator.";

// Simulated AI responses for Payroll
function generateResponse(userMessage) {
  const lowerMsg = userMessage.toLowerCase();

  // Payroll / pay run queries
  if (
    lowerMsg.includes("payroll") ||
    lowerMsg.includes("pay run") ||
    lowerMsg.includes("payday") ||
    lowerMsg.includes("paycheck")
  ) {
    return {
      content:
        "**Payroll Summary**\n\n**Next Pay Run:**\n• Pay Date: Apr 15, 2026\n• Pay Period: Apr 1 - Apr 15, 2026\n• Total Payroll Amount: $385,200\n• Active Headcount: 47 employees\n\n**Breakdown:**\n• Gross Wages: $312,400\n• Employer Taxes: $42,800\n• Benefits Contributions: $30,000\n\n**Status:**\n• Timesheets Approved: 44/47\n• Pending Approvals: 3\n• Exceptions Flagged: 1\n\n**Recent Pay Runs:**\n• Mar 31: $382,100 (completed)\n• Mar 15: $380,500 (completed)\n• Feb 28: $378,900 (completed)\n\nWould you like to review pending approvals or see a detailed breakdown?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.PAYROLL,
      sources: ["Payroll System", "Timesheet Records"],
    };
  }

  // Overtime queries
  if (
    lowerMsg.includes("overtime") ||
    lowerMsg.includes(" ot ") ||
    lowerMsg.includes("extra hours")
  ) {
    return {
      content:
        "**Overtime Report - This Week**\n\n**Summary:**\n• Employees with OT: 5\n• Total OT Hours: 42.5\n• Estimated OT Cost: $3,825\n\n**Employee Breakdown:**\n\n| Employee | Dept | OT Hours | Est. Cost |\n|----------|------|----------|----------|\n| J. Martinez | Operations | 12.0 | $1,080 |\n| S. Patel | Engineering | 10.5 | $945 |\n| R. Kim | Support | 8.0 | $640 |\n| T. Williams | Operations | 7.0 | $630 |\n| A. Chen | Engineering | 5.0 | $530 |\n\n**Department Summary:**\n• Operations: 19.0 hrs (45%)\n• Engineering: 15.5 hrs (36%)\n• Support: 8.0 hrs (19%)\n\n**Trend:**\n• Last week: 38.0 hrs ($3,420)\n• This week: 42.5 hrs ($3,825) +11.8%\n\nWould you like to set overtime alerts or review policies?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.TIMEKEEPING,
      sources: ["Timesheet System", "Payroll Records"],
    };
  }

  // Benefits queries
  if (
    lowerMsg.includes("benefit") ||
    lowerMsg.includes("enrollment") ||
    lowerMsg.includes("health") ||
    lowerMsg.includes("dental") ||
    lowerMsg.includes("401k") ||
    lowerMsg.includes("insurance")
  ) {
    return {
      content:
        "**Benefits Enrollment Status**\n\n**Overall Enrollment:**\n• Total Eligible: 47 employees\n• Total Enrolled: 43 (91.5%)\n• Not Enrolled: 4 (recently hired, in waiting period)\n\n**Plan Breakdown:**\n\n| Plan | Enrolled | Rate |\n|------|----------|------|\n| Medical (PPO/HMO) | 38 | 80.9% |\n| Dental | 35 | 74.5% |\n| Vision | 32 | 68.1% |\n| 401(k) | 28 | 59.6% |\n| Life Insurance | 40 | 85.1% |\n| FSA/HSA | 22 | 46.8% |\n\n**Monthly Employer Cost:**\n• Medical: $18,200\n• Dental: $3,500\n• Vision: $1,600\n• 401(k) Match: $8,400\n• Total: $31,700/month\n\n**Open Enrollment:**\n• Next Period: Nov 1 - Nov 30, 2026\n• Changes Effective: Jan 1, 2027\n\nWould you like to see plan details or cost projections?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.BENEFITS,
      sources: ["Benefits Administration", "HR Records"],
    };
  }

  // Time off / PTO queries
  if (
    lowerMsg.includes("time off") ||
    lowerMsg.includes("pto") ||
    lowerMsg.includes("vacation") ||
    lowerMsg.includes("sick") ||
    lowerMsg.includes("leave")
  ) {
    return {
      content:
        "**Time-Off & PTO Balances**\n\n**Company Overview:**\n• Average PTO Balance: 12.3 days\n• Employees with Low Balance (<3 days): 4\n• Upcoming PTO Requests: 6\n• Pending Approvals: 2\n\n**Balance Distribution:**\n• 0-5 days remaining: 8 employees\n• 6-10 days remaining: 14 employees\n• 11-15 days remaining: 15 employees\n• 16+ days remaining: 10 employees\n\n**Upcoming Time Off (Next 2 Weeks):**\n• Apr 2-4: M. Johnson (Vacation)\n• Apr 3: K. Lee (Personal)\n• Apr 7-11: D. Garcia (Vacation)\n• Apr 8: P. Brown (Medical)\n• Apr 10: S. Wilson (Personal)\n• Apr 14-15: J. Taylor (Vacation)\n\n**Blackout Dates:**\n• Apr 15 (Pay run processing)\n• Jun 30 - Jul 1 (Quarter-end close)\n\n**YTD Usage:**\n• Total PTO Used: 285 days\n• Sick Leave Used: 42 days\n\nWant to review individual balances or approve pending requests?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.TIMEKEEPING,
      sources: ["Time & Attendance System", "HR Records"],
    };
  }

  // Tax / withholding queries
  if (
    lowerMsg.includes("tax") ||
    lowerMsg.includes("withholding") ||
    lowerMsg.includes("w-2") ||
    lowerMsg.includes("1099") ||
    lowerMsg.includes("fica")
  ) {
    return {
      content:
        "**Tax & Withholding Summary**\n\n**Q1 2026 Totals:**\n• Federal Withholding: $142,500\n• State Withholding: $38,200\n• FICA (Social Security + Medicare): $58,900\n• Additional Medicare: $2,100\n• Total Tax Liability: $241,700\n\n**Employer Taxes:**\n• FICA Match: $58,900\n• FUTA: $3,760\n• SUTA: $8,200\n• Total Employer Tax: $70,860\n\n**Upcoming Filing Deadlines:**\n• Apr 15, 2026 - Q1 941 Filing\n• Apr 30, 2026 - FUTA Deposit\n• May 15, 2026 - State Quarterly Filing\n\n**Year-to-Date:**\n• Total Wages Paid: $1,145,600\n• Total Taxes Withheld: $241,700\n• Total Employer Taxes: $70,860\n\n**Compliance Status:**\n• All filings current\n• No outstanding penalties\n• W-4 updates processed: 3 this quarter\n\nWould you like a detailed breakdown by employee or department?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.TAXES,
      sources: ["Payroll Tax System", "IRS Records"],
    };
  }

  // Compensation queries
  if (
    lowerMsg.includes("salary") ||
    lowerMsg.includes("compensation") ||
    lowerMsg.includes("raise") ||
    lowerMsg.includes("bonus") ||
    lowerMsg.includes("wage")
  ) {
    return {
      content:
        "**Compensation Analysis**\n\n**Company Overview:**\n• Average Salary: $82,000\n• Median Salary: $78,500\n• Total Comp Expense: $385,200/month\n\n**Salary Band Distribution:**\n• $40K-$60K: 8 employees (17%)\n• $60K-$80K: 15 employees (32%)\n• $80K-$100K: 14 employees (30%)\n• $100K-$120K: 7 employees (15%)\n• $120K+: 3 employees (6%)\n\n**Recent Adjustments:**\n• Merit Increases (Q1): 5 employees\n• Average Increase: 4.2%\n• Promotions: 2\n• Market Adjustments: 1\n\n**By Department:**\n• Engineering: Avg $96,000\n• Operations: Avg $72,000\n• Sales: Avg $78,000 + commission\n• Admin: Avg $62,000\n\n**Upcoming:**\n• Annual Review Cycle: Jul 2026\n• Bonus Payout: Q2 performance bonuses pending\n\nWant to model compensation changes or see individual details?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.COMPENSATION,
      sources: ["HRIS", "Compensation Database"],
    };
  }

  // People / headcount queries
  if (
    lowerMsg.includes("employee") ||
    lowerMsg.includes("headcount") ||
    lowerMsg.includes("team") ||
    lowerMsg.includes("hire") ||
    lowerMsg.includes("contractor")
  ) {
    return {
      content:
        "**People & Headcount Report**\n\n**Current Workforce:**\n• Total Headcount: 47\n• Full-Time: 42 (89%)\n• Part-Time: 2 (4%)\n• Contractors: 3 (6%)\n\n**Department Breakdown:**\n• Engineering: 14\n• Operations: 10\n• Sales & Marketing: 9\n• Finance & Admin: 7\n• Support: 4\n• HR: 3\n\n**Recent Hires (March 2026):**\n• L. Anderson - Software Engineer (Mar 4)\n• C. Rivera - Sales Associate (Mar 18)\n\n**Open Positions:**\n• Senior DevOps Engineer\n• Marketing Manager\n• Customer Success Rep\n\n**Turnover:**\n• YTD Departures: 2\n• Annualized Rate: 8.5%\n• Industry Average: 12%\n\n**Demographics:**\n• Average Tenure: 2.8 years\n• Average Age: 34\n\nWould you like to see org chart details or hiring pipeline?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.PEOPLE,
      sources: ["HRIS", "Recruiting System"],
    };
  }

  // Compliance queries
  if (
    lowerMsg.includes("compliance") ||
    lowerMsg.includes("audit") ||
    lowerMsg.includes("regulation") ||
    lowerMsg.includes("labor law")
  ) {
    return {
      content:
        "**Compliance Dashboard**\n\n**Overall Compliance Score: 94%**\n\n**Upcoming Deadlines:**\n• Apr 15 - Q1 Payroll Tax Filing (941)\n• Apr 30 - OSHA 300A Posting Deadline\n• May 1 - EEO-1 Report Due\n• Jun 30 - Mid-Year ACA Compliance Check\n\n**Recent Audit Results:**\n• Last Internal Audit: Feb 2026\n• Status: Passed with minor findings\n• Findings Resolved: 3/4 (1 in progress)\n\n**I-9 Verification Status:**\n• Current Employees Verified: 47/47 (100%)\n• Reverifications Due (Next 90 Days): 2\n• Section 2 Pending: 0\n\n**Labor Law Compliance:**\n• Federal FLSA: Compliant\n• State Wage Laws: Compliant\n• Poster Requirements: Current\n• Overtime Policies: Updated Jan 2026\n\n**Training Compliance:**\n• Harassment Training: 45/47 complete (96%)\n• Safety Training: 42/47 complete (89%)\n\nWould you like to drill into any compliance area or see corrective action details?",
      confidence: CONFIDENCE.MEDIUM,
      category: RESPONSE_CATEGORIES.COMPLIANCE,
      sources: ["Compliance Management System", "Audit Records"],
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
        'Hello! I\'m your Payroll Intelligence assistant, ready to help you manage your workforce and compensation operations.\n\n**I can help you with:**\n• Review pay run details and schedules\n• Track overtime and time-off balances\n• Monitor benefits enrollment\n• Analyze compensation and tax data\n• Check compliance status\n\n**Try asking:**\n• "Show me this month\'s payroll summary"\n• "Who has overtime this week?"\n• "Benefits enrollment status"\n\nWhat would you like to explore?',
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Thank you
  if (lowerMsg.includes("thank") || lowerMsg.includes("thanks")) {
    return {
      content:
        "You're welcome! I'm here whenever you need payroll insights or workforce data.\n\nIs there anything else I can help you with?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Help
  if (lowerMsg.includes("help") || lowerMsg.includes("what can you do")) {
    return {
      content:
        '**Payroll Intelligence Capabilities**\n\nI\'m designed to help you manage payroll operations and workforce data efficiently.\n\n**Payroll & Pay Runs:**\n• "Show me this month\'s payroll summary"\n• "Next pay run details"\n• "Recent payroll history"\n\n**Time & Attendance:**\n• "Who has overtime this week?"\n• "Time-off balances"\n• "PTO requests pending"\n\n**Benefits:**\n• "Benefits enrollment status"\n• "401k participation rates"\n• "Open enrollment dates"\n\n**Compensation:**\n• "Salary distribution breakdown"\n• "Recent compensation changes"\n• "Department pay analysis"\n\n**Tax & Compliance:**\n• "Tax withholding breakdown"\n• "Upcoming filing deadlines"\n• "Compliance status check"\n\n**People & HR:**\n• "Current headcount"\n• "Recent hires"\n• "Turnover analysis"\n\nJust ask naturally - I understand payroll context!',
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Default response - payroll focused
  return {
    content: `I understand you're asking about "${userMessage}".\n\nLet me help you with that. Could you provide more context?\n\n**I can assist with:**\n• Payroll summaries and pay run details\n• Overtime tracking and time-off balances\n• Benefits enrollment and plan information\n• Compensation analysis and salary data\n• Tax withholding and compliance\n• People and headcount reporting\n\n**Example questions:**\n• "Show me this month's payroll summary"\n• "Who has overtime this week?"\n• "Benefits enrollment status"\n\nWhat specific information would be most helpful?`,
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
      <p>Payroll Intelligence is temporarily unavailable. Please try again.</p>
      <button onClick={onRetry}>
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

export default function PayrollChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Welcome to Payroll Intelligence. I'm your workforce and compensation assistant, here to help manage payroll operations.\n\n**I can help you:**\n• Review pay run details and schedules\n• Track overtime and time-off balances\n• Monitor benefits enrollment\n• Analyze compensation and tax data\n• Check compliance status\n\nWhat would you like to explore?",
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
          "Chat cleared. I'm ready to help with your payroll operations.\n\nWhat would you like to explore?",
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
          <Users size={20} />
          <span>Payroll Intelligence</span>
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
              placeholder="Ask about payroll, people, or benefits..."
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
