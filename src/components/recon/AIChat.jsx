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
  Wallet,
  PiggyBank,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import "./AIChat.css";

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

// Response categories for financial advisor
const RESPONSE_CATEGORIES = {
  SPENDING: { icon: CreditCard, label: "Spending Analysis" },
  SAVINGS: { icon: PiggyBank, label: "Savings Advice" },
  BUDGET: { icon: Wallet, label: "Budgeting" },
  INVESTING: { icon: TrendingUp, label: "Investment Info" },
  TAX: { icon: Shield, label: "Tax Information" },
  GENERAL: { icon: HelpCircle, label: "General Help" },
  CONVERSATION: { icon: MessageSquare, label: "Chat" },
};

// Suggested prompts for conversations
const suggestedPrompts = [
  "How can I save more money?",
  "What's on my mind today",
  "Tell me a fun fact",
  "Help me understand my spending",
  "What should I know about taxes?",
  "Just want to chat",
];

// Advisory disclaimer
const DISCLAIMER =
  "This is general financial guidance, not professional advice. Please consult a qualified financial advisor for decisions about your specific situation.";

// Simulated AI responses with confidence and categories
function generateResponse(userMessage) {
  const lowerMsg = userMessage.toLowerCase();

  // Spending & Budget questions
  if (
    lowerMsg.includes("spending") ||
    lowerMsg.includes("spend") ||
    lowerMsg.includes("expense")
  ) {
    return {
      content:
        "Based on common spending patterns, here are some insights:\n\n**Top areas to review:**\n• Subscriptions you may have forgotten\n• Dining out vs. cooking at home\n• Impulse purchases under $20\n\n**Quick wins:**\n1. Track every expense for 1 week\n2. Use the 24-hour rule for non-essentials\n3. Set up automatic transfers to savings\n\nWould you like me to explain any of these strategies in more detail?",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.SPENDING,
      sources: ["General financial best practices"],
    };
  }

  // Saving questions
  if (
    lowerMsg.includes("save") ||
    lowerMsg.includes("saving") ||
    lowerMsg.includes("savings")
  ) {
    return {
      content:
        "Great question about saving! Here's a framework that works for most people:\n\n**The 50/30/20 Rule:**\n• 50% for needs (rent, utilities, groceries)\n• 30% for wants (entertainment, dining)\n• 20% for savings and debt repayment\n\n**Practical tips:**\n1. Pay yourself first - automate savings\n2. Start with just $25/week if needed\n3. Keep savings in a separate account\n4. Review and increase when you get raises\n\nEven small amounts add up over time with consistency!",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.SAVINGS,
      sources: ["50/30/20 budgeting framework"],
    };
  }

  // Emergency fund questions
  if (
    lowerMsg.includes("emergency") ||
    lowerMsg.includes("emergency fund") ||
    lowerMsg.includes("rainy day")
  ) {
    return {
      content:
        "An emergency fund is one of the most important financial safety nets you can have.\n\n**Recommended target:** 3-6 months of essential expenses\n\n**How to build it:**\n1. Calculate your monthly essentials (rent, utilities, food, insurance)\n2. Multiply by 3 for a starter goal\n3. Set up automatic weekly transfers\n4. Keep it in a high-yield savings account\n\n**Example:** If essentials are $3,000/month, aim for $9,000-$18,000\n\nStart small - even $1,000 covers most unexpected expenses like car repairs or medical bills.",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.SAVINGS,
      sources: ["Emergency fund guidelines"],
    };
  }

  // Compound interest
  if (lowerMsg.includes("compound") || lowerMsg.includes("interest")) {
    return {
      content:
        "Compound interest is often called the 'eighth wonder of the world' - here's why:\n\n**Simple explanation:**\nYou earn interest on your interest, creating a snowball effect over time.\n\n**Example:**\n$1,000 invested at 7% annual return:\n• Year 1: $1,070\n• Year 10: $1,967\n• Year 30: $7,612\n\n**The magic ingredients:**\n1. **Time** - Start as early as possible\n2. **Consistency** - Regular contributions\n3. **Patience** - Let it grow undisturbed\n\nEven $100/month starting at age 25 can grow to over $250,000 by age 65!",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.INVESTING,
      sources: ["Compound interest calculations"],
    };
  }

  // Debt questions
  if (
    lowerMsg.includes("debt") ||
    lowerMsg.includes("pay off") ||
    lowerMsg.includes("loan") ||
    lowerMsg.includes("credit card")
  ) {
    return {
      content:
        "Paying off debt is a crucial step toward financial freedom. Here are two popular strategies:\n\n**Avalanche Method (saves most money):**\nPay minimums on all debts, put extra toward the highest interest rate first.\n\n**Snowball Method (builds momentum):**\nPay off smallest balances first for quick wins.\n\n**Action steps:**\n1. List all debts with balances and interest rates\n2. Choose your method\n3. Automate minimum payments\n4. Put any extra money toward your target debt\n\n**Pro tip:** Consider balance transfer offers for high-interest credit cards, but read the fine print!",
      confidence: CONFIDENCE.MEDIUM,
      category: RESPONSE_CATEGORIES.BUDGET,
      sources: ["Debt reduction strategies"],
    };
  }

  // Budget questions
  if (lowerMsg.includes("budget") || lowerMsg.includes("budgeting")) {
    return {
      content:
        "Budgeting doesn't have to be complicated! Here's how to get started:\n\n**Step 1: Know your numbers**\n• Track income after taxes\n• List fixed expenses (rent, utilities, insurance)\n• Estimate variable expenses (food, gas, entertainment)\n\n**Step 2: Choose a simple system**\n• **Envelope method** - cash for each category\n• **50/30/20 rule** - needs/wants/savings\n• **Zero-based** - every dollar has a job\n\n**Step 3: Review weekly**\nSpend 10 minutes checking your progress.\n\nThe best budget is one you'll actually stick to!",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.BUDGET,
      sources: ["Budgeting fundamentals"],
    };
  }

  // Investing questions
  if (
    lowerMsg.includes("invest") ||
    lowerMsg.includes("stock") ||
    lowerMsg.includes("401k") ||
    lowerMsg.includes("retirement")
  ) {
    return {
      content:
        "Investing can seem intimidating, but here are the basics:\n\n**Getting started:**\n1. First, build that emergency fund\n2. Pay off high-interest debt\n3. Contribute to employer 401(k) match (free money!)\n\n**Key principles:**\n• **Diversify** - Don't put all eggs in one basket\n• **Time in market** > Timing the market\n• **Low-cost index funds** - Great for beginners\n• **Stay consistent** - Regular contributions matter\n\n**Consider your timeline:**\nLonger timeline = can handle more risk\nShorter timeline = more conservative approach",
      confidence: CONFIDENCE.MEDIUM,
      category: RESPONSE_CATEGORIES.INVESTING,
      sources: ["Investment fundamentals"],
      requiresDisclaimer: true,
    };
  }

  // Tax deductions questions
  if (
    lowerMsg.includes("deduction") ||
    lowerMsg.includes("deduct") ||
    lowerMsg.includes("write off") ||
    lowerMsg.includes("tax break")
  ) {
    return {
      content:
        "There are many tax deductions available depending on your situation. Here are common ones:\n\n**For Everyone:**\n• Standard deduction ($13,850 single / $27,700 married for 2024)\n• Student loan interest (up to $2,500)\n• Educator expenses (up to $300 for teachers)\n\n**If You Itemize:**\n• State and local taxes (SALT) - up to $10,000\n• Mortgage interest\n• Charitable donations\n• Medical expenses over 7.5% of AGI\n\n**Self-Employed:**\n• Home office deduction\n• Business equipment and supplies\n• Health insurance premiums\n• Self-employment tax (50% deductible)\n\n**Pro tip:** Keep receipts and records throughout the year!",
      confidence: CONFIDENCE.MEDIUM,
      category: RESPONSE_CATEGORIES.TAX,
      sources: ["IRS tax guidelines 2024"],
      requiresDisclaimer: true,
    };
  }

  // Tax credits
  if (lowerMsg.includes("tax credit") || lowerMsg.includes("credit")) {
    return {
      content:
        "Tax credits are valuable because they directly reduce your tax bill dollar-for-dollar!\n\n**Common Tax Credits:**\n\n**For Families:**\n• Child Tax Credit - up to $2,000 per child\n• Child & Dependent Care Credit - up to $3,000-$6,000\n• Earned Income Tax Credit (EITC) - varies by income\n\n**Education:**\n• American Opportunity Credit - up to $2,500/year\n• Lifetime Learning Credit - up to $2,000/year\n\n**Energy & Home:**\n• Clean Vehicle Credit - up to $7,500\n• Energy Efficient Home Improvement Credit\n• Residential Clean Energy Credit - 30%\n\n**Retirement:**\n• Saver's Credit - up to $1,000 ($2,000 married)\n\n**Key difference:** Credits reduce your tax bill; deductions reduce taxable income.",
      confidence: CONFIDENCE.MEDIUM,
      category: RESPONSE_CATEGORIES.TAX,
      sources: ["IRS tax credit guidelines"],
      requiresDisclaimer: true,
    };
  }

  // General tax questions
  if (
    lowerMsg.includes("tax") ||
    lowerMsg.includes("irs") ||
    lowerMsg.includes("filing") ||
    lowerMsg.includes("refund")
  ) {
    return {
      content:
        "Tax basics everyone should know:\n\n**Key Deadlines:**\n• Tax Day: April 15 (or next business day)\n• Extension deadline: October 15\n• Q4 estimated taxes: January 15\n\n**Tax Brackets (2024):**\nYou only pay the higher rate on income *above* each threshold - it's progressive!\n\n**Ways to Reduce Your Tax Bill:**\n1. **Maximize retirement contributions** - 401(k), IRA\n2. **Use HSA if eligible** - triple tax advantage\n3. **Harvest tax losses** - offset capital gains\n4. **Time your income** - if possible, shift to lower-income years\n5. **Don't forget credits** - they're more valuable than deductions\n\n**Filing Tips:**\n• Gather all forms (W-2, 1099s) before starting\n• Compare standard vs. itemized deduction\n• File electronically for faster refunds",
      confidence: CONFIDENCE.MEDIUM,
      category: RESPONSE_CATEGORIES.TAX,
      sources: ["IRS tax fundamentals"],
      requiresDisclaimer: true,
    };
  }

  // W-4 and withholding
  if (
    lowerMsg.includes("w-4") ||
    lowerMsg.includes("w4") ||
    lowerMsg.includes("withholding") ||
    lowerMsg.includes("paycheck")
  ) {
    return {
      content:
        "Your W-4 determines how much tax is withheld from each paycheck.\n\n**Getting It Right:**\n\n**If you got a big refund:**\nYou're over-withholding. Consider adjusting to get more in each paycheck.\n\n**If you owed money:**\nYou're under-withholding. Increase withholding to avoid penalties.\n\n**When to Update Your W-4:**\n• New job\n• Marriage or divorce\n• Having a child\n• Buying a home\n• Significant income change\n• Second job or side gig\n\n**Pro tip:** Use the IRS Tax Withholding Estimator at irs.gov to calculate the right amount.\n\n**Goal:** Get your refund close to $0 - that means you kept more money throughout the year!",
      confidence: CONFIDENCE.HIGH,
      category: RESPONSE_CATEGORIES.TAX,
      sources: ["IRS W-4 guidelines"],
    };
  }

  // Self-employment taxes
  if (
    lowerMsg.includes("self employ") ||
    lowerMsg.includes("freelance") ||
    lowerMsg.includes("1099") ||
    lowerMsg.includes("side hustle") ||
    lowerMsg.includes("gig")
  ) {
    return {
      content:
        "Self-employment and side income have special tax considerations:\n\n**What You Need to Know:**\n\n**Self-Employment Tax:**\n• 15.3% on net earnings (Social Security + Medicare)\n• You can deduct half of this on your return\n\n**Quarterly Estimated Taxes:**\n• Due: April 15, June 15, Sept 15, Jan 15\n• Pay if you expect to owe $1,000+ in taxes\n• Use Form 1040-ES\n\n**Deductible Business Expenses:**\n• Home office (simplified: $5/sq ft, max 300 sq ft)\n• Equipment and supplies\n• Business travel and mileage (67¢/mile for 2024)\n• Professional services and software\n• Health insurance premiums\n\n**Record Keeping:**\n• Separate business bank account\n• Track all income and expenses\n• Keep receipts for 3+ years\n\n**Consider:** Working with a tax professional for complex situations.",
      confidence: CONFIDENCE.MEDIUM,
      category: RESPONSE_CATEGORIES.TAX,
      sources: ["IRS self-employment guidelines"],
      requiresDisclaimer: true,
    };
  }

  // Greeting
  if (
    lowerMsg.includes("hello") ||
    lowerMsg.includes("hi") ||
    lowerMsg.includes("hey") ||
    lowerMsg.match(/^hi$/)
  ) {
    return {
      content:
        "Hey there! Great to chat with you. I'm your ReconAI assistant - I can help with financial questions, or we can just have a conversation.\n\nWhat's on your mind today?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // Thank you
  if (lowerMsg.includes("thank") || lowerMsg.includes("thanks")) {
    return {
      content:
        "You're welcome! Happy to help anytime. Is there anything else you'd like to talk about?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // How are you / what's up
  if (
    lowerMsg.includes("how are you") ||
    lowerMsg.includes("how's it going") ||
    lowerMsg.includes("what's up") ||
    lowerMsg.includes("whats up")
  ) {
    return {
      content:
        "I'm doing great, thanks for asking! Always ready to help or just chat. How about you - how's your day going?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // Weather (general conversation)
  if (lowerMsg.includes("weather")) {
    return {
      content:
        "I wish I could check the weather for you! While I don't have access to live weather data, I can definitely help you plan financially for any weather-related expenses - like travel, seasonal activities, or emergency preparedness.\n\nIs there something specific I can help you with?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // Fun fact
  if (
    lowerMsg.includes("fun fact") ||
    lowerMsg.includes("interesting fact") ||
    lowerMsg.includes("tell me something")
  ) {
    const funFacts = [
      "Here's a fun one: The 50-dollar bill is the least used denomination in the US! Most ATMs don't even dispense them.",
      "Did you know? The average American spends about $1,500 a year on coffee. That's a lot of lattes!",
      "Fun fact: Compound interest was called the 'eighth wonder of the world' by Albert Einstein. At 7% annual return, your money doubles roughly every 10 years!",
      "Here's one: The first credit card was introduced in 1950 by Diners Club, and it was originally intended just for restaurant payments!",
      "Interesting tidbit: The US penny costs more to make than it's worth - about 2.4 cents per penny!",
    ];
    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    return {
      content:
        randomFact +
        "\n\nWant another fun fact, or is there something else I can help you with?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // Joke
  if (
    lowerMsg.includes("joke") ||
    lowerMsg.includes("funny") ||
    lowerMsg.includes("make me laugh")
  ) {
    const jokes = [
      "Why did the accountant break up with the calculator? Because they felt like they were just being used for their figures! 😄",
      "Why don't scientists trust atoms? Because they make up everything! Just like some expense reports... 😉",
      "I told my wife she was drawing her eyebrows too high. She looked surprised. Speaking of surprises - have you checked your bank balance lately? 😄",
      "Why did the banker switch careers? He lost interest! 📉😄",
      "What do you call a bear with no teeth? A gummy bear! Not finance-related, but everyone needs a laugh. 🐻",
    ];
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    return {
      content:
        randomJoke +
        "\n\nHope that brightened your day! What else can I help you with?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // Just chatting / bored
  if (
    lowerMsg.includes("bored") ||
    lowerMsg.includes("chat") ||
    lowerMsg.includes("talk") ||
    lowerMsg.includes("conversation")
  ) {
    return {
      content:
        "I'm always up for a chat! Here are some things we could talk about:\n\n• **Fun facts** - I've got some interesting ones\n• **Your goals** - financial or otherwise\n• **Questions** - anything you're curious about\n• **Just venting** - sometimes it helps to type it out\n\nOr feel free to just tell me what's on your mind. No topic is off limits!",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // Good morning/afternoon/evening/night
  if (
    lowerMsg.includes("good morning") ||
    lowerMsg.includes("good afternoon") ||
    lowerMsg.includes("good evening") ||
    lowerMsg.includes("good night")
  ) {
    const timeGreeting = lowerMsg.includes("morning")
      ? "morning"
      : lowerMsg.includes("afternoon")
        ? "afternoon"
        : lowerMsg.includes("evening")
          ? "evening"
          : "night";
    return {
      content: `Good ${timeGreeting} to you too! Hope you're having a great day. What can I help you with today?`,
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // Who are you / what can you do
  if (
    lowerMsg.includes("who are you") ||
    lowerMsg.includes("what are you") ||
    lowerMsg.includes("what can you do") ||
    lowerMsg.includes("your name")
  ) {
    return {
      content:
        "I'm your ReconAI Assistant! Think of me as a helpful companion that's always here when you need to chat.\n\n**What I'm great at:**\n• Financial questions (budgeting, saving, taxes)\n• General conversation and friendly chat\n• Answering questions and providing information\n• Being a sounding board for your thoughts\n\n**What I can't do:**\n• Access real-time data or the internet\n• Make decisions for you\n• Replace professional financial advisors\n\nBut I'm always learning and happy to help however I can!",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // Feeling words (happy, sad, stressed, etc.)
  if (
    lowerMsg.includes("stressed") ||
    lowerMsg.includes("anxious") ||
    lowerMsg.includes("worried") ||
    lowerMsg.includes("overwhelmed")
  ) {
    return {
      content:
        "I hear you - feeling stressed can be really tough. While I'm not a therapist, I'm here to listen.\n\n**Some things that might help:**\n• Take a few deep breaths\n• Step away from screens for a bit\n• Write down what's on your mind\n• Talk to someone you trust\n\nIf it's financial stress, I can definitely help break things down into manageable steps. Sometimes the numbers feel less scary when you have a plan.\n\nWhat's weighing on you?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  if (
    lowerMsg.includes("happy") ||
    lowerMsg.includes("excited") ||
    lowerMsg.includes("great day") ||
    lowerMsg.includes("good day")
  ) {
    return {
      content:
        "That's awesome! I love the positive energy! 🌟\n\nIs there anything exciting happening, or are you just feeling good? Either way, it's great to hear. What would you like to chat about?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  if (
    lowerMsg.includes("sad") ||
    lowerMsg.includes("down") ||
    lowerMsg.includes("bad day") ||
    lowerMsg.includes("rough day")
  ) {
    return {
      content:
        "I'm sorry to hear that. Bad days happen to everyone, and it's okay to feel down sometimes.\n\nIf you want to talk about it, I'm here to listen. Sometimes just getting thoughts out can help a little. No pressure though - we can chat about whatever you'd like, or I can share a fun fact or joke to lighten the mood.\n\nWhat sounds good to you?",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // Goodbye
  if (
    lowerMsg.includes("bye") ||
    lowerMsg.includes("goodbye") ||
    lowerMsg.includes("see you") ||
    lowerMsg.includes("gotta go")
  ) {
    return {
      content:
        "Take care! It was great chatting with you. Come back anytime - I'll be here! 👋",
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
      sources: [],
    };
  }

  // Default response - now more conversational
  return {
    content: `Hmm, let me think about "${userMessage}"...\n\nI'm not entirely sure how to help with that specific topic, but I'd love to try! Could you tell me a bit more about what you're looking for?\n\nOr if you'd like, we can talk about:\n• Financial planning and budgeting\n• Saving and investment basics\n• Just having a friendly chat\n\nWhat sounds good?`,
    confidence: CONFIDENCE.ADVISORY,
    category: RESPONSE_CATEGORIES.CONVERSATION,
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
                Investment decisions should be made with a licensed financial
                advisor.
              </span>
            </div>
          )}
          {isAssistant && message.sources && message.sources.length > 0 && (
            <div className="message-sources">
              <span className="sources-label">Based on:</span>
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
      <p>The assistant is temporarily unavailable. Please try again.</p>
      <button onClick={onRetry}>
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Hey there! I'm your ReconAI Assistant. I'm here to help with financial questions, answer your queries, or just have a friendly chat.\n\n**Some things I can help with:**\n• Budgeting and saving tips\n• Tax questions and financial planning\n• General questions and conversation\n• Fun facts and more!\n\nWhat would you like to talk about?",
      timestamp: new Date(),
      confidence: CONFIDENCE.ADVISORY,
      category: RESPONSE_CATEGORIES.CONVERSATION,
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

  // Simulate response with fail-closed error handling
  const simulateResponse = async (userMessage) => {
    setIsTyping(true);
    setHasError(false);

    try {
      // Simulate AI thinking delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1000),
      );

      // Simulate random error (5% chance) for fail-closed testing
      if (Math.random() < 0.05) {
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
      // Fail-closed: Show error state, don't expose partial responses
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

    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const handleRetryError = () => {
    setHasError(false);
    // Retry the last user message if available
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
          "Fresh start! I'm ready to chat about anything - finances, questions, or just casual conversation.\n\nWhat's on your mind?",
        timestamp: new Date(),
        confidence: CONFIDENCE.ADVISORY,
        category: RESPONSE_CATEGORIES.CONVERSATION,
        sources: [],
      },
    ]);
    setHasError(false);
  };

  return (
    <div className={`ai-chat ${isExpanded ? "expanded" : "collapsed"}`}>
      <div className="chat-header">
        <div className="chat-title">
          <Bot size={20} />
          <span>ReconAI Assistant</span>
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
          {/* Advisory Banner */}
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
              Ask me about
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
              placeholder="Type a message..."
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
              Last updated:{" "}
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
