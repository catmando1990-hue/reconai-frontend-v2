import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Minimize2,
  Maximize2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Shield,
  Info,
  CheckCircle,
  AlertCircle,
  XCircle,
  X,
  Clock,
  TrendingUp,
  FileBarChart,
  DollarSign,
  PieChart,
  BarChart3,
  Building2,
  Briefcase,
  Calculator,
  FileText,
  Download,
  Calendar,
  Target,
  Users,
} from "lucide-react";
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

// Response categories for CFO/Business intelligence
const RESPONSE_CATEGORIES = {
  REVENUE: { icon: DollarSign, label: "Revenue Analysis" },
  EXPENSES: { icon: Calculator, label: "Expense Analysis" },
  CASHFLOW: { icon: TrendingUp, label: "Cash Flow" },
  REPORTS: { icon: FileBarChart, label: "Reports" },
  FORECASTING: { icon: Target, label: "Forecasting" },
  COMPLIANCE: { icon: Shield, label: "Compliance" },
  STRATEGY: { icon: Briefcase, label: "Strategy" },
  OPERATIONS: { icon: Building2, label: "Operations" },
  GENERAL: { icon: MessageSquare, label: "General" },
};

// Suggested prompts for CFO
const suggestedPrompts = [
  "Pull Q1 2024 revenue report",
  "Show me cash flow trends",
  "What's our burn rate?",
  "Compare expenses YoY",
  "Forecast next quarter",
  "Board meeting summary",
];

// Advisory disclaimer for CFO
const DISCLAIMER =
  "Financial data shown is for informational purposes. Please verify critical figures with your accounting team or licensed CPA.";

// Parse date from natural language
function parseReportDate(message) {
  const lowerMsg = message.toLowerCase();

  // Match patterns like "May 1, 2024" or "May 2024" or "Q1 2024"
  const datePatterns = [
    /(?:from|for|of|since)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    /(?:from|for|of|since)\s+(\w+\s+\d{4})/i,
    /(?:from|for|of|since)\s+(q[1-4]\s+\d{4})/i,
    /(\w+\s+\d{1,2},?\s+\d{4})/i,
    /(q[1-4]\s+\d{4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = lowerMsg.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Simulated AI responses for CFO
function generateResponse(userMessage) {
  const lowerMsg = userMessage.toLowerCase();
  const extractedDate = parseReportDate(userMessage);

  // Pull/Generate Report commands
  if (
    lowerMsg.includes("pull") ||
    lowerMsg.includes("generate") ||
    lowerMsg.includes("show me") ||
    lowerMsg.includes("get me")
  ) {
    if (
      lowerMsg.includes("report") ||
      lowerMsg.includes("statement") ||
      lowerMsg.includes("summary")
    ) {
      const reportType = lowerMsg.includes("revenue")
        ? "Revenue"
        : lowerMsg.includes("expense")
          ? "Expense"
          : lowerMsg.includes("cash")
            ? "Cash Flow"
            : lowerMsg.includes("p&l") || lowerMsg.includes("profit")
              ? "P&L"
              : lowerMsg.includes("balance")
                ? "Balance Sheet"
                : lowerMsg.includes("board")
                  ? "Board Summary"
                  : "Financial";

      const dateStr = extractedDate || "current period";

      return {
        content: `**${reportType} Report - ${dateStr}**\n\nI'm preparing your ${reportType.toLowerCase()} report. Here's a preview:\n\n**Key Highlights:**\n• Total ${reportType === "Revenue" ? "Revenue" : "Amount"}: $847,500\n• Change vs Prior Period: +12.3%\n• Trend: Positive growth trajectory\n\n**Quick Actions:**\n• [Download PDF] [Export to Excel] [Share]\n\nWould you like me to:\n1. Break down by category\n2. Compare to previous periods\n3. Add forecasting data\n4. Schedule this report`,
        confidence: CONFIDENCE.HIGH,
        category: RESPONSE_CATEGORIES.REPORTS,
        sources: ["Financial Database", "Transaction Records"],
        actions: ["download", "export", "schedule"],
      };
    }
  }

  // Revenue questions
  if (
    lowerMsg.includes("revenue") ||
    lowerMsg.includes("sales") ||
    lowerMsg.includes("income")
  ) {
    return {
      content:
        "**Revenue Analysis**\n\n**Current Period (Q1 2026):**\n• Total Revenue: $847,500\n• vs Target: 94.2% ($900,000)\n• vs Last Quarter: +12.3%\n• vs Same Period Last Year: +18.7%\n\n**Revenue Breakdown:**\n• Product Sales: $612,000 (72%)\n• Services: $185,500 (22%)\n• Other: $50,000 (6%)\n\n**Top Performing:**\n1. Enterprise contracts (+24%)\n2. SaaS subscriptions (+18%)\n3. Professional services (+12%)\n\n**Action Items:**\n• 3 large deals in pipeline ($120K potential)\n• Renewal risk on 2 accounts\n\nWould you like a detailed breakdown or forecast?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.REVENUE,
      sources: ["Sales Database", "CRM Data"],
    };
  }

  // Expense questions
  if (
    lowerMsg.includes("expense") ||
    lowerMsg.includes("cost") ||
    lowerMsg.includes("spending")
  ) {
    return {
      content:
        "**Expense Analysis**\n\n**Current Period (Q1 2026):**\n• Total Expenses: $557,850\n• vs Budget: 93.0% ($600,000) - Under budget\n• vs Last Quarter: +5.8%\n\n**Breakdown by Category:**\n• Payroll & Benefits: $298,000 (53.4%)\n• Operations: $112,500 (20.2%)\n• Marketing: $68,350 (12.3%)\n• Software & Tools: $42,000 (7.5%)\n• Office & Admin: $37,000 (6.6%)\n\n**Notable Items:**\n• Marketing spend up 15% (new campaign)\n• Software costs optimized (-8%)\n• Travel under budget by $12K\n\n**Recommendations:**\n• Review SaaS subscriptions for consolidation\n• Q2 budget adjustment needed for hiring\n\nWant me to drill into any category?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.EXPENSES,
      sources: ["Expense Management System", "AP Records"],
    };
  }

  // Cash flow questions
  if (
    lowerMsg.includes("cash flow") ||
    lowerMsg.includes("cashflow") ||
    lowerMsg.includes("liquidity")
  ) {
    return {
      content:
        "**Cash Flow Statement**\n\n**Current Position:**\n• Cash on Hand: $2.4M\n• Cash Runway: 18.5 months\n• Monthly Burn Rate: $142,000\n\n**Q1 2026 Cash Flow:**\n• Operating Activities: +$385,000\n• Investing Activities: -$120,000\n• Financing Activities: -$50,000\n• **Net Cash Flow: +$215,000**\n\n**Cash Flow Trends:**\n• Collections improving (DSO: 32 days, down from 38)\n• Payables well-managed (DPO: 28 days)\n• Working capital healthy at $850K\n\n**Forecast:**\n• Q2 projected: +$180,000 (seasonal dip expected)\n• Year-end projection: $3.1M cash position\n\n**Alerts:**\n• Large payment due Apr 15 ($85K)\n• AR aging: 3 invoices >45 days ($42K)\n\nNeed details on any specific area?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.CASHFLOW,
      sources: ["Bank Statements", "AP/AR Systems"],
    };
  }

  // Burn rate
  if (lowerMsg.includes("burn") || lowerMsg.includes("runway")) {
    return {
      content:
        "**Burn Rate & Runway Analysis**\n\n**Current Metrics:**\n• Monthly Burn Rate: $142,000\n• Gross Burn: $557,850/quarter\n• Net Burn: $289,650/quarter (after revenue)\n• Cash Runway: 18.5 months\n\n**Trend (Last 6 Months):**\n• Oct: $138K → Nov: $140K → Dec: $152K\n• Jan: $135K → Feb: $139K → Mar: $145K\n\n**Burn Drivers:**\n• Headcount: 68% of burn\n• Infrastructure: 15%\n• Marketing: 12%\n• Other: 5%\n\n**Scenarios:**\n• Current pace: 18.5 months runway\n• +20% revenue: 24+ months runway\n• +5 hires: 14 months runway\n\n**Recommendation:**\nBurn is healthy relative to growth. Consider building 24-month runway buffer before next hiring phase.\n\nWant to model different scenarios?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.CASHFLOW,
      sources: ["Financial Projections", "HR Data"],
    };
  }

  // Forecasting
  if (
    lowerMsg.includes("forecast") ||
    lowerMsg.includes("predict") ||
    lowerMsg.includes("projection") ||
    lowerMsg.includes("next quarter") ||
    lowerMsg.includes("next year")
  ) {
    return {
      content:
        "**Financial Forecast**\n\n**Q2 2026 Projections:**\n• Revenue: $920,000 (+8.5% QoQ)\n• Expenses: $595,000 (+6.7% QoQ)\n• Net Income: $325,000\n• Margin: 35.3%\n\n**Full Year 2026:**\n• Revenue: $3.8M (vs $3.2M in 2025)\n• Growth Rate: 18.7% YoY\n• EBITDA: $1.15M\n• EBITDA Margin: 30.3%\n\n**Key Assumptions:**\n• 2 enterprise deals close in Q2\n• Headcount +3 (sales, engineering)\n• No major market disruptions\n• Churn stays under 3%\n\n**Risk Factors:**\n• Pipeline conversion rate (currently 22%)\n• Economic conditions\n• Competitor pricing pressure\n\n**Confidence Level:** Medium-High\nBased on current pipeline and historical trends.\n\nWant to adjust assumptions or see alternative scenarios?",
      confidence: CONFIDENCE.MEDIUM,
      category: RESPONSE_CATEGORIES.FORECASTING,
      sources: ["Historical Data", "Pipeline Analysis", "Market Research"],
      requiresDisclaimer: true,
    };
  }

  // Compare / YoY / trends
  if (
    lowerMsg.includes("compare") ||
    lowerMsg.includes("yoy") ||
    lowerMsg.includes("year over year") ||
    lowerMsg.includes("trend")
  ) {
    return {
      content:
        "**Year-over-Year Comparison**\n\n**Q1 2026 vs Q1 2025:**\n\n| Metric | Q1 2025 | Q1 2026 | Change |\n|--------|---------|---------|--------|\n| Revenue | $714K | $848K | +18.7% |\n| Expenses | $498K | $558K | +12.0% |\n| Net Income | $216K | $290K | +34.3% |\n| Margin | 30.3% | 34.2% | +3.9pp |\n\n**Positive Trends:**\n• Revenue growing faster than expenses\n• Margin expansion of 3.9 percentage points\n• Customer acquisition cost down 12%\n\n**Areas to Watch:**\n• Payroll costs up 18% (hiring)\n• Marketing ROI declining slightly\n\n**Multi-Year Trend:**\n• 2023: $2.1M revenue\n• 2024: $2.8M revenue (+33%)\n• 2025: $3.2M revenue (+14%)\n• 2026E: $3.8M revenue (+19%)\n\nWant to compare specific categories or time periods?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.STRATEGY,
      sources: ["Historical Financial Data"],
    };
  }

  // Board meeting / investor
  if (
    lowerMsg.includes("board") ||
    lowerMsg.includes("investor") ||
    lowerMsg.includes("presentation")
  ) {
    return {
      content:
        "**Board Meeting Summary - Q1 2026**\n\n**Executive Highlights:**\n\n1. **Financial Performance**\n   • Revenue: $847.5K (94% of target)\n   • EBITDA: $289.6K (34.2% margin)\n   • Cash: $2.4M (18.5 months runway)\n\n2. **Key Wins**\n   • Closed 2 enterprise accounts ($180K ARR)\n   • Reduced CAC by 12%\n   • NPS increased to 72 (+8 pts)\n\n3. **Challenges**\n   • Q2 pipeline slightly soft (-8% vs plan)\n   • 2 key hires still open\n   • Competitor launched similar product\n\n4. **Strategic Priorities**\n   • Enterprise market expansion\n   • Product feature parity\n   • Team scaling\n\n**Board Actions Needed:**\n• Approve Q2 hiring plan\n• Review expansion budget\n• Discuss Series B timeline\n\n**Prepared Materials:**\n• [Financial Deck] [Metrics Dashboard] [Pipeline Review]\n\nWant me to generate the full presentation?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.STRATEGY,
      sources: ["Financial Systems", "CRM", "HR Data"],
      actions: ["generate_deck", "export"],
    };
  }

  // Compliance / audit
  if (
    lowerMsg.includes("compliance") ||
    lowerMsg.includes("audit") ||
    lowerMsg.includes("tax")
  ) {
    return {
      content:
        "**Compliance & Audit Status**\n\n**Upcoming Deadlines:**\n• Q1 Tax Payment: Mar 31 ($85,000)\n• Federal Tax Filing: Apr 15\n• State Tax Filing: Apr 15\n• Q1 Financial Close: Apr 5\n\n**Audit Readiness:**\n• Documentation: 94% complete\n• Reconciliations: Current\n• Internal controls: Passed last review\n\n**Regulatory Status:**\n• SOC 2 Type II: Compliant (renewal Aug 2026)\n• GDPR: Compliant\n• State registrations: Current\n\n**Action Items:**\n• Complete Q1 close by Apr 5\n• Schedule auditor prep meeting\n• Review depreciation schedules\n\n**Documents Ready:**\n• [Tax Worksheets] [Audit Binder] [Compliance Checklist]\n\nNeed help with any specific compliance area?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.COMPLIANCE,
      sources: ["Compliance Management System", "Tax Records"],
    };
  }

  // Metrics / KPIs
  if (
    lowerMsg.includes("metric") ||
    lowerMsg.includes("kpi") ||
    lowerMsg.includes("performance")
  ) {
    return {
      content:
        "**Key Performance Indicators**\n\n**Financial KPIs:**\n• Revenue: $847.5K (94% of target)\n• Gross Margin: 68.2%\n• Operating Margin: 34.2%\n• EBITDA: $289.6K\n\n**Growth Metrics:**\n• ARR: $3.39M (+22% YoY)\n• MRR: $282.5K\n• Net Revenue Retention: 112%\n• Customer Count: 847 (+18%)\n\n**Efficiency Metrics:**\n• CAC: $1,250 (-12% YoY)\n• LTV: $18,500\n• LTV:CAC Ratio: 14.8x\n• Payback Period: 8 months\n\n**Health Indicators:**\n• Churn Rate: 2.4% monthly\n• NPS: 72\n• Cash Runway: 18.5 months\n\n**vs Benchmarks:**\n• Margin: Above industry avg (30%)\n• Growth: In line with peers\n• Efficiency: Top quartile\n\nWant to drill into any specific metric?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.STRATEGY,
      sources: ["Business Intelligence", "Industry Benchmarks"],
    };
  }

  // Headcount / team / hiring
  if (
    lowerMsg.includes("headcount") ||
    lowerMsg.includes("team") ||
    lowerMsg.includes("hiring") ||
    lowerMsg.includes("employee")
  ) {
    return {
      content:
        "**Headcount & Team Analysis**\n\n**Current State:**\n• Total Headcount: 42 employees\n• Full-time: 38 | Contractors: 4\n• Revenue per Employee: $89,700/quarter\n\n**By Department:**\n• Engineering: 16 (38%)\n• Sales & Marketing: 12 (29%)\n• Operations: 8 (19%)\n• G&A: 6 (14%)\n\n**Hiring Plan Q2:**\n• 2 Engineers (backend, DevOps)\n• 1 Sales (enterprise AE)\n• 1 Marketing (demand gen)\n• Impact: +$85K/month burn\n\n**Cost Analysis:**\n• Avg salary: $95,000\n• Fully loaded cost: $125,000/employee\n• Payroll % of revenue: 35%\n\n**Turnover:**\n• YTD: 4.2% (2 departures)\n• Industry avg: 12%\n\nWant to model hiring scenarios or see department details?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.OPERATIONS,
      sources: ["HRIS", "Payroll System"],
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
        'Hello! I\'m your CFO Intelligence assistant, ready to help you navigate your business finances.\n\n**I can help you with:**\n• Pull financial reports and statements\n• Analyze revenue, expenses, and cash flow\n• Generate forecasts and projections\n• Prepare board and investor materials\n• Track KPIs and business metrics\n• Monitor compliance and deadlines\n\n**Try asking:**\n• "Pull a revenue report from Q1 2024"\n• "What\'s our current burn rate?"\n• "Compare expenses year over year"\n\nWhat would you like to explore?',
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Thank you
  if (lowerMsg.includes("thank") || lowerMsg.includes("thanks")) {
    return {
      content:
        "You're welcome! I'm here whenever you need financial insights or reports.\n\nIs there anything else I can help you analyze or prepare?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Help
  if (lowerMsg.includes("help") || lowerMsg.includes("what can you do")) {
    return {
      content:
        '**CFO Intelligence Capabilities**\n\nI\'m designed to help business owners from startups to enterprises with financial intelligence.\n\n**Reports & Analysis:**\n• "Pull Q1 revenue report"\n• "Show me expense breakdown"\n• "Generate cash flow statement"\n\n**Forecasting:**\n• "Forecast next quarter revenue"\n• "Model hiring scenarios"\n• "Project year-end cash position"\n\n**Comparisons:**\n• "Compare Q1 to last year"\n• "Show expense trends"\n• "YoY growth analysis"\n\n**Executive Support:**\n• "Prepare board summary"\n• "Key metrics dashboard"\n• "Investor update highlights"\n\n**Compliance:**\n• "Upcoming tax deadlines"\n• "Audit preparation status"\n• "Compliance checklist"\n\nJust ask naturally - I understand business context!',
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.GENERAL,
      sources: [],
    };
  }

  // Default response - business focused
  return {
    content: `I understand you're asking about "${userMessage}".\n\nLet me help you with that. Could you provide more context?\n\n**I can assist with:**\n• Financial reports and analysis\n• Cash flow and burn rate\n• Revenue and expense trends\n• Forecasting and projections\n• Board/investor materials\n• KPIs and business metrics\n\n**Example commands:**\n• "Pull revenue report from [date]"\n• "What's our burn rate?"\n• "Compare this quarter to last year"\n\nWhat specific information would be most helpful?`,
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
      <p>CFO Intelligence is temporarily unavailable. Please try again.</p>
      <button onClick={onRetry}>
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

export default function CFOChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        'Welcome to CFO Intelligence. I\'m your executive financial assistant, designed for business leaders who need quick access to financial insights.\n\n**I can help you:**\n• Pull reports: "Get me the Q1 revenue report"\n• Analyze trends: "Compare expenses year over year"\n• Forecast: "Project next quarter cash flow"\n• Prepare materials: "Board meeting summary"\n\nWhat would you like to explore?',
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
          "Chat cleared. I'm ready to help with your financial analysis.\n\nWhat would you like to explore?",
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
          <Briefcase size={20} />
          <span>CFO Intelligence</span>
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
              placeholder="Ask about financials or pull a report..."
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
