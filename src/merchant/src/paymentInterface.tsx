import React, { useState, useRef, useEffect } from "react";
import {
  CreditCard,
  Calendar,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  TrendingUp,
  User,
  Settings,
  Trash2,
  Plus,
  Minus,
  Info,
  ExternalLink,
  Layers,
  Activity,
  Wallet,
  DollarSign,
  AlertCircle,
  Sparkles,
  RotateCcw,
  ChevronRight,
  Sparkle,
  Fingerprint,
  Smartphone,
  BookOpen,
  LayoutDashboard
} from "lucide-react";

// Types
interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: string;
  color: string;
}

interface Merchant {
  id: string;
  name: string;
  logoColor: string;
  defaultItems: CartItem[];
}

interface LoanPlan {
  id: string;
  merchantName: string;
  itemName: string;
  totalAmt: number;
  remainingAmt: number;
  planType: "payIn4" | "payIn3" | "sliceIt";
  nextPaymentAmt: number;
  nextPaymentDate: string;
  paymentsPaid: number;
  paymentsTotal: number;
  purchaseDate: string;
}

interface Transaction {
  id: string;
  loanId: string;
  itemName: string;
  merchantName: string;
  amount: number;
  date: string;
  type: string;
}

// Pre-seeded data
const MERCHANTS: Merchant[] = [
  {
    id: "urban-threads",
    name: "Urban Threads Co.",
    logoColor: "bg-indigo-600",
    defaultItems: [
      { id: "backpack", name: "Commuter Leather Backpack", price: 240.00, qty: 1, category: "Gear", color: "Obsidian Black" },
      { id: "beanie", name: "Merino Wool Beanie", price: 35.00, qty: 1, category: "Apparel", color: "Slate Gray" }
    ]
  },
  {
    id: "techverse",
    name: "TechVerse Store",
    logoColor: "bg-blue-600",
    defaultItems: [
      { id: "earbuds", name: "AeroBuds Pro Noise-Cancelling", price: 180.00, qty: 1, category: "Electronics", color: "Titanium Silver" },
      { id: "charger", name: "MagSafe 3-in-1 Foldable Station", price: 89.00, qty: 1, category: "Accessories", color: "Polar White" }
    ]
  },
  {
    id: "serene-escapes",
    name: "Serene Escapes",
    logoColor: "bg-emerald-600",
    defaultItems: [
      { id: "pass", name: "All-Access Wellness Retreat Pass", price: 450.00, qty: 1, category: "Travel", color: "Eco Forest" },
      { id: "hammock", name: "Double Travel Camping Hammock", price: 65.00, qty: 1, category: "Outdoor", color: "Ocean Teal" }
    ]
  }
];

const INITIAL_LOANS: LoanPlan[] = [
  {
    id: "loan-1",
    merchantName: "Urban Threads Co.",
    itemName: "Commuter Leather Backpack & Beanie",
    totalAmt: 297.00,
    remainingAmt: 222.75,
    planType: "payIn4",
    nextPaymentAmt: 74.25,
    nextPaymentDate: "2026-07-09",
    paymentsPaid: 1,
    paymentsTotal: 4,
    purchaseDate: "2026-06-25"
  },
  {
    id: "loan-2",
    merchantName: "TechVerse Store",
    itemName: "MagSafe 3-in-1 Foldable Station",
    totalAmt: 89.00,
    remainingAmt: 29.66,
    planType: "payIn3",
    nextPaymentAmt: 29.66,
    nextPaymentDate: "2026-07-25",
    paymentsPaid: 2,
    paymentsTotal: 3,
    purchaseDate: "2026-05-25"
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    loanId: "loan-1",
    itemName: "Commuter Leather Backpack",
    merchantName: "Urban Threads Co.",
    amount: 74.25,
    date: "2026-06-25",
    type: "Zenpay Setup Downpayment"
  },
  {
    id: "tx-2",
    loanId: "loan-2",
    itemName: "MagSafe Travel Charger",
    merchantName: "TechVerse Store",
    amount: 29.67,
    date: "2026-05-25",
    type: "Zenpay Installment 1"
  },
  {
    id: "tx-3",
    loanId: "loan-2",
    itemName: "MagSafe Travel Charger",
    merchantName: "TechVerse Store",
    amount: 29.67,
    date: "2026-06-25",
    type: "Zenpay Installment 2"
  }
];

export default function App() {
  // State: Interface mode
  const [activeTab, setActiveTab] = useState<"checkout" | "portal">("checkout");

  // State: Merchant & Cart Configuration
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant>(MERCHANTS[0]);
  const [cartItems, setCartItems] = useState<CartItem[]>(MERCHANTS[0].defaultItems);
  
  // State: Developer Sandbox Controllers
  const [creditDecision, setCreditDecision] = useState<"approve" | "manual" | "decline">("approve");
  const [paymentGatewayStatus, setPaymentGatewayStatus] = useState<"success" | "fail">("success");
  const [taxRate, setTaxRate] = useState<number>(0.08); // 8% tax rate

  // State: Checkout selection
  const [paymentOption, setPaymentOption] = useState<"bnpl" | "upfront">("bnpl");
  const [selectedBnplPlan, setSelectedBnplPlan] = useState<"payIn4" | "payIn3" | "sliceIt">("payIn4");

  // State: BNPL Credit Application Form
  const [bnplStep, setBnplStep] = useState<"selection" | "applyForm" | "verifying" | "approved" | "declined">("selection");
  const [applicantName, setApplicantName] = useState("Zahra Salie");
  const [applicantPhone, setApplicantPhone] = useState("+1 (555) 321-4923");
  const [applicantSSN, setApplicantSSN] = useState("");
  const [applicantDOB, setApplicantDOB] = useState("2004-09-12");
  const [isSigned, setIsSigned] = useState(false);
  const [signatureTyped, setSignatureTyped] = useState("");
  const [activeDrawTab, setActiveDrawTab] = useState<"type" | "draw">("type");

  // State: Upfront Payment details
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // State: Loading / Processing simulation
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // State: Completed receipt details
  const [completedReceipt, setCompletedReceipt] = useState<{
    orderId: string;
    date: string;
    merchantName: string;
    total: number;
    paymentType: "bnpl" | "upfront";
    bnplPlanType?: string;
    downpayment?: number;
    installments?: number;
  } | null>(null);

  // State: ZenPay Customer Portal (Auth / Data)
  const [loans, setLoans] = useState<LoanPlan[]>(INITIAL_LOANS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [portalFeedback, setPortalFeedback] = useState<string | null>(null);
  const [selectedPortalLoan, setSelectedPortalLoan] = useState<LoanPlan | null>(null);

  // Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Synchronize cart items when merchant changes
  useEffect(() => {
    setCartItems(selectedMerchant.defaultItems);
    // Reset steps
    setBnplStep("selection");
    setOrderCompleted(false);
    setErrorMessage("");
  }, [selectedMerchant]);

  // Cart operations
  const updateQty = (id: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      });
    });
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const tax = subtotal * taxRate;
  const totalDue = subtotal + tax; // Free shipping

  // Signature Drawing Methods
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const pos = getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#4f46e5"; // Indigo-600
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setIsSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
  };

  // Auto-format card inputs
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const formatted = value.match(/.{1,4}/g)?.join(" ") || "";
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 2) {
      setCardExpiry(value);
    } else {
      setCardExpiry(`${value.substring(0, 2)}/${value.substring(2, 4)}`);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setCardCvv(value.substring(0, 4));
  };

  // Card Brand Detection
  const getCardBrand = () => {
    const cleaned = cardNumber.replace(/\s/g, "");
    if (cleaned.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(cleaned)) return "MasterCard";
    if (/^3[47]/.test(cleaned)) return "American Express";
    if (cleaned.startsWith("6")) return "Discover";
    return "Unknown";
  };

  // Trigger BNPL check simulation
  const handleApplyBNPL = () => {
    if (!applicantName || !applicantPhone || (!applicantSSN && activeDrawTab === 'type')) {
      setErrorMessage("Please fill in all requested fields to perform the ZenPay check.");
      return;
    }
    setErrorMessage("");
    setBnplStep("verifying");

    const steps = [
      "Establishing connection to ZenPay Secure Network...",
      "Conducting soft bureau query (No credit impact)...",
      "Evaluating risk profile against ZenPay scorecards...",
      "Generating customized amortization code..."
    ];

    let currentStep = 0;
    setProcessingMessage(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setProcessingMessage(steps[currentStep]);
      } else {
        clearInterval(interval);
        // Determine credit decision
        if (creditDecision === "approve") {
          setBnplStep("approved");
        } else if (creditDecision === "manual") {
          // Soft approve, requires verification details
          setBnplStep("approved");
        } else {
          setBnplStep("declined");
        }
      }
    }, 1000);
  };

  // Handle Order Placement / Plan Execution
  const handleExecutePayment = () => {
    if (paymentOption === "bnpl") {
      if (bnplStep !== "approved") {
        setBnplStep("applyForm");
        return;
      }
      if (!isSigned && activeDrawTab === "draw") {
        setErrorMessage("Please sign the ZenPay electronic installment agreement.");
        return;
      }
      if (activeDrawTab === "type" && !signatureTyped) {
        setErrorMessage("Please type your electronic signature to agree.");
        return;
      }
    } else {
      // Upfront validations
      if (!cardName || cardNumber.length < 15 || !cardExpiry || cardCvv.length < 3) {
        setErrorMessage("Please fill in valid credit card details.");
        return;
      }
    }

    setErrorMessage("");
    setIsProcessing(true);
    setProcessingMessage("Initiating transaction protocols...");

    setTimeout(() => {
      setProcessingMessage("Authorizing funds transfer with secure banking nodes...");
      setTimeout(() => {
        if (paymentGatewayStatus === "fail") {
          setIsProcessing(false);
          setErrorMessage("Transaction Declined by card issuer. Please check your balance or choose a different payment method.");
          return;
        }

        setProcessingMessage("Creating secure payment plans and registering merchant records...");
        setTimeout(() => {
          const randId = "RMX-" + Math.floor(100000 + Math.random() * 900000);
          const dateStr = new Date().toISOString().split('T')[0];

          if (paymentOption === "bnpl") {
            // Calculate plan values
            let downpayment = 0;
            let totalInst = 4;
            if (selectedBnplPlan === "payIn4") {
              downpayment = totalDue / 4;
              totalInst = 4;
            } else if (selectedBnplPlan === "payIn3") {
              downpayment = totalDue / 3;
              totalInst = 3;
            } else {
              downpayment = (totalDue * 1.05) / 6;
              totalInst = 6;
            }

            // Create new loan entry
            const newLoan: LoanPlan = {
              id: `loan-${Date.now()}`,
              merchantName: selectedMerchant.name,
              itemName: cartItems.map(i => `${i.qty}x ${i.name}`).join(", "),
              totalAmt: selectedBnplPlan === "sliceIt" ? totalDue * 1.05 : totalDue,
              remainingAmt: (selectedBnplPlan === "sliceIt" ? totalDue * 1.05 : totalDue) - downpayment,
              planType: selectedBnplPlan,
              nextPaymentAmt: downpayment,
              nextPaymentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              paymentsPaid: 1,
              paymentsTotal: totalInst,
              purchaseDate: dateStr
            };

            const newTx: Transaction = {
              id: `tx-${Date.now()}`,
              loanId: newLoan.id,
              itemName: cartItems[0]?.name || "Store Purchase",
              merchantName: selectedMerchant.name,
              amount: downpayment,
              date: dateStr,
              type: "Zenpay Setup Downpayment"
            };

            setLoans(prev => [newLoan, ...prev]);
            setTransactions(prev => [newTx, ...prev]);

            setCompletedReceipt({
              orderId: randId,
              date: dateStr,
              merchantName: selectedMerchant.name,
              total: totalDue,
              paymentType: "bnpl",
              bnplPlanType: selectedBnplPlan,
              downpayment: downpayment,
              installments: totalInst
            });
          } else {
            // Standard upfront
            const newTx: Transaction = {
              id: `tx-${Date.now()}`,
              loanId: "direct",
              itemName: cartItems.map(i => `${i.qty}x ${i.name}`).join(", "),
              merchantName: selectedMerchant.name,
              amount: totalDue,
              date: dateStr,
              type: `Upfront Card Payment (*${cardNumber.slice(-4)})`
            };
            setTransactions(prev => [newTx, ...prev]);

            setCompletedReceipt({
              orderId: randId,
              date: dateStr,
              merchantName: selectedMerchant.name,
              total: totalDue,
              paymentType: "upfront"
            });
          }

          setIsProcessing(false);
          setOrderCompleted(true);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  // Perform single payment on Customer Portal
  const handlePortalInstallmentPayment = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    if (loan.remainingAmt <= 0) {
      setPortalFeedback("This ZenPay plan is already fully satisfied!");
      return;
    }

    const payAmt = Math.min(loan.nextPaymentAmt, loan.remainingAmt);
    const dateStr = new Date().toISOString().split('T')[0];

    setLoans(prev => prev.map(l => {
      if (l.id === loanId) {
        const nextPaid = l.paymentsPaid + 1;
        const remaining = Math.max(0, l.remainingAmt - payAmt);
        return {
          ...l,
          remainingAmt: remaining,
          paymentsPaid: nextPaid,
          nextPaymentDate: remaining > 0 ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "Fully Paid"
        };
      }
      return l;
    }));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      loanId: loan.id,
      itemName: loan.itemName,
      merchantName: loan.merchantName,
      amount: payAmt,
      date: dateStr,
      type: `Installment Payment #${loan.paymentsPaid + 1}`
    };

    setTransactions(prev => [newTx, ...prev]);
    setPortalFeedback(`Successfully received payment of R${payAmt.toFixed(2)} for ${loan.merchantName}!`);

    // Update selected portal loan details modal if open
    setSelectedPortalLoan(prev => {
      if (!prev) return null;
      const nextPaid = prev.paymentsPaid + 1;
      const remaining = Math.max(0, prev.remainingAmt - payAmt);
      return {
        ...prev,
        remainingAmt: remaining,
        paymentsPaid: nextPaid,
        nextPaymentDate: remaining > 0 ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "Fully Paid"
      };
    });

    setTimeout(() => {
      setPortalFeedback(null);
    }, 4000);
  };

  // Calculate summary stats for the customer portal
  const totalOutstanding = loans.reduce((acc, l) => acc + l.remainingAmt, 0);
  const activeLoansCount = loans.filter(l => l.remainingAmt > 0).length;
  const completedLoansCount = loans.filter(l => l.remainingAmt <= 0).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans antialiased text-slate-900 selection:bg-indigo-100">
      {/* Floating Confetti Layer */}
      {orderCompleted && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 45 }).map((_, i) => {
            const left = Math.random() * 100;
            const size = Math.random() * 10 + 6;
            const delay = Math.random() * 2;
            const duration = Math.random() * 3 + 2;
            const colors = ["#4f46e5", "#10b981", "#3b82f6", "#f59e0b", "#ec4899"];
            const color = colors[Math.floor(Math.random() * colors.length)];
            return (
              <div
                key={i}
                className="absolute rounded-full opacity-75 animate-bounce"
                style={{
                  left: `${left}%`,
                  top: `-20px`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                  animation: `fall ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            );
          })}
          <style>{`
            @keyframes fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Primary Developer Sandbox Bar (Discreet, Professional, Expandable) */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 md:px-8 flex flex-wrap gap-4 items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-white uppercase font-bold tracking-wider text-[10px]">ZenPay Sandbox Node: Active</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Decision Engine:</span>
            <select
              value={creditDecision}
              onChange={(e) => setCreditDecision(e.target.value as any)}
              aria-label="Decision Engine selector"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="approve">Auto-Approve Plan</option>
              <option value="manual">Soft pull validation</option>
              <option value="decline">Decline Customer Credit</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Card Processor:</span>
            <select
              value={paymentGatewayStatus}
              onChange={(e) => setPaymentGatewayStatus(e.target.value as any)}
              aria-label="Card Processor selector"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="success">Always Authorize (Success)</option>
              <option value="fail">Simulate Card Decline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Container representing 1024x768 layout center */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-10">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden min-h-[680px]">
          
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 px-6 md:px-10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rotate-45"></div>
                </div>
                <span className="font-bold text-xl tracking-tight uppercase">ZenPay</span>
              </div>
              
              {/* Top Navigation for Sandbox Modes */}
              <nav className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  id="checkout-tab-btn"
                  onClick={() => setActiveTab("checkout")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === "checkout"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Merchant Checkout
                </button>
                <button
                  id="portal-tab-btn"
                  onClick={() => setActiveTab("portal")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === "portal"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  ZenPay Customer Hub
                  {loans.length > 0 && (
                    <span className="ml-1 bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full">
                      {loans.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Mobile Navigation Toggle Icon */}
              <div className="flex md:hidden bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab("checkout")}
                  aria-label="Switch to checkout tab"
                  className={`p-1.5 rounded-md ${activeTab === "checkout" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("portal")}
                  aria-label="Switch to customer hub tab"
                  className={`p-1.5 rounded-md ${activeTab === "portal" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                >
                  <User className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Secure Gateway</span>
              </div>
            </div>
          </header>

          {/* Body Panels */}
          {activeTab === "checkout" ? (
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              
              {/* Left Panel: Merchant Order summary */}
              <section className="w-full lg:w-[380px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-6 md:p-8 flex flex-col justify-between shrink-0 overflow-y-auto">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Merchant Partner</span>
                      <h2 className="text-xl font-bold mt-1 text-slate-800">{selectedMerchant.name}</h2>
                    </div>
                    {/* Sandbox Switch Merchant */}
                    <div className="relative">
                      <select
                        aria-label="Select merchant"
                        title="Select merchant"
                        value={selectedMerchant.id}
                        onChange={(e) => {
                          const merch = MERCHANTS.find(m => m.id === e.target.value);
                          if (merch) setSelectedMerchant(merch);
                        }}
                        className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 font-semibold cursor-pointer"
                      >
                        {MERCHANTS.map(m => (
                          <option key={m.id} value={m.id}>{m.name.split(" ")[0]} Store</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cart List */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                      <span>Shopping Cart ({cartItems.length} items)</span>
                      <button
                        onClick={() => {
                          setCartItems(selectedMerchant.defaultItems);
                          setOrderCompleted(false);
                        }}
                        className="text-[10px] text-indigo-600 hover:underline lowercase normal-case"
                      >
                        Reset Cart
                      </button>
                    </div>

                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Your cart is empty. Add items from developer options.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 group relative">
                            {/* Product SVG Graphic */}
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded flex-shrink-0 flex items-center justify-center font-bold text-xs uppercase">
                              {item.category.slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs text-slate-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">Color: {item.color}</p>
                              <p className="text-xs font-bold text-indigo-600 mt-1">R{item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col justify-between items-end">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                                <button onClick={() => updateQty(item.id, -1)} className="text-slate-400 hover:text-slate-600" title="Decrease quantity"><Minus className="w-2.5 h-2.5" /></button>
                                <span className="text-[10px] font-bold w-3 text-center">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="text-slate-400 hover:text-slate-600" title="Increase quantity"><Plus className="w-2.5 h-2.5" /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Sandbox Item Shortcut */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Sandbox: Add custom item</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const randomName = [
                            "Organic Cotton Tee", "Tech Nomad Jacket", "Minimalist Metal Pen",
                            "Titanium Travel Flask", "Genuine Leather Keychain", "Classic Canvas Tote"
                          ][Math.floor(Math.random() * 6)];
                          const randomPrice = [25, 45, 80, 110, 15, 60][Math.floor(Math.random() * 6)];
                          const newItem: CartItem = {
                            id: `custom-${Date.now()}`,
                            name: randomName,
                            price: randomPrice,
                            qty: 1,
                            category: "Custom",
                            color: "Limited Edition"
                          };
                          setCartItems(prev => [...prev, newItem]);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 py-1.5 rounded text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Extra Cargo Item (+R)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="space-y-2 py-4 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-medium text-slate-800">R{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Shipping</span>
                      <span className="text-emerald-600 font-bold tracking-wide uppercase text-[10px]">FREE</span>
                    </div>
                    <div className="flex justify-between text-slate-500 items-center">
                      <span className="flex items-center gap-1">
                        Taxes ({(taxRate * 100).toFixed(0)}%)
                        <button
                          onClick={() => setTaxRate(prev => prev === 0.08 ? 0 : 0.08)}
                          className="text-[10px] text-indigo-600 hover:underline"
                        >
                          Toggle Tax
                        </button>
                      </span>
                      <span className="font-medium text-slate-800">R{tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Total Due</span>
                      <span className="text-2xl font-black tracking-tight text-indigo-600">R{totalDue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Right Panel: Checkout / ZenPay Secure Gateway */}
              <section className="flex-1 p-6 md:p-10 lg:p-12 bg-slate-50 flex flex-col justify-between overflow-y-auto">
                
                {/* 1. Loading state */}
                {isProcessing ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12">
                    <div className="relative w-16 h-16 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                      <div className="absolute inset-2.5 rounded-full border-4 border-slate-100 border-b-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 mb-2">ZenPay Checkout Engine</h3>
                    <p className="text-sm text-slate-500 text-center max-w-sm animate-pulse font-medium">{processingMessage}</p>
                  </div>
                ) : orderCompleted && completedReceipt ? (
                  /* 2. Success state */
                  <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full py-4">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900">Payment Secured</h2>
                      <p className="text-sm text-slate-500 mt-1 font-medium">ZenPay authorization generated and approved successfully.</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
                      <div className="flex justify-between items-center text-xs text-slate-400 pb-3 border-b border-slate-100 font-bold uppercase tracking-wider">
                        <span>Invoice: {completedReceipt.orderId}</span>
                        <span>{completedReceipt.date}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 font-medium">Merchant Account</span>
                          <span className="font-bold text-slate-800">{completedReceipt.merchantName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 font-medium">Payment Protocol</span>
                          <span className="font-bold text-slate-800 uppercase text-xs tracking-wider">
                            {completedReceipt.paymentType === "bnpl" ? "ZenPay Installment Plan" : "Standard Upfront Card"}
                          </span>
                        </div>
                        
                        {completedReceipt.paymentType === "bnpl" && (
                          <>
                            <div className="flex justify-between text-sm bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                              <span className="text-indigo-700 font-bold">First Charge Charged Today</span>
                              <span className="font-black text-indigo-600">R{completedReceipt.downpayment?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium">Plan Type</span>
                              <span className="font-bold text-slate-800">
                                {completedReceipt.bnplPlanType === "payIn4" ? "Pay in 4 (Bi-weekly)" : 
                                 completedReceipt.bnplPlanType === "payIn3" ? "Pay in 3 (Monthly)" : "Slice It (6 Months)"}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500 font-medium">ZenPay Installments</span>
                              <span className="font-bold text-slate-800">{completedReceipt.installments} equal payments</span>
                            </div>
                          </>
                        )}

                        <div className="flex justify-between text-base pt-3 border-t border-dashed border-slate-200">
                          <span className="font-bold text-slate-800">Transaction Value</span>
                          <span className="font-extrabold text-indigo-600">R{completedReceipt.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <button
                        onClick={() => {
                          setOrderCompleted(false);
                          setCartItems(selectedMerchant.defaultItems);
                          setBnplStep("selection");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> New Sandbox Order
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("portal");
                          // Select the newly added loan
                          if (loans.length > 0) {
                            setSelectedPortalLoan(loans[0]);
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-100 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" /> View ZenPay Account
                      </button>
                    </div>

                    <p className="text-[10px] text-center text-slate-400 mt-6 font-semibold uppercase tracking-widest flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Secure ZenPay Settlement Token Registered
                    </p>
                  </div>
                ) : (
                  /* 3. Standard Checkout Form Flow */
                  <div className="max-w-xl w-full mx-auto flex flex-col justify-between h-full">
                    <div>
                      {/* Step Title */}
                      <div className="mb-6">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">ZenPay Secure Gateways</h1>
                        <p className="text-slate-500 text-xs font-semibold mt-1">Select your optimized payment architecture</p>
                      </div>

                      {/* Error Alert Box */}
                      {errorMessage && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-lg flex items-start gap-2 text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Transaction Blocked:</span> {errorMessage}
                          </div>
                        </div>
                      )}

                      {/* Tab Selection: BNPL vs Upfront */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Option 1: BNPL Radio */}
                        <div className="relative">
                          <input
                            type="radio"
                            name="payment"
                            id="bnpl"
                            className="peer hidden"
                            checked={paymentOption === "bnpl"}
                            onChange={() => {
                              setPaymentOption("bnpl");
                              setErrorMessage("");
                            }}
                          />
                          <label
                            htmlFor="bnpl"
                            className="block p-4 bg-white border-2 border-slate-200 rounded-xl cursor-pointer transition-all peer-checked:border-indigo-600 peer-checked:ring-4 peer-checked:ring-indigo-50 shadow-sm hover:border-indigo-200 h-full"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded uppercase tracking-wider">
                                0% APR BNPL
                              </span>
                              <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center peer-checked:border-indigo-600">
                                {paymentOption === "bnpl" && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                              </div>
                            </div>
                            <h3 className="font-black text-sm text-slate-800">ZenPay PayLater</h3>
                            <p className="text-slate-400 text-[11px] font-medium mt-1 leading-normal">
                              Amortize purchase with split zero-interest installments.
                            </p>
                          </label>
                        </div>

                        {/* Option 2: Pay Upfront Radio */}
                        <div className="relative">
                          <input
                            type="radio"
                            name="payment"
                            id="upfront"
                            className="peer hidden"
                            checked={paymentOption === "upfront"}
                            onChange={() => {
                              setPaymentOption("upfront");
                              setErrorMessage("");
                            }}
                          />
                          <label
                            htmlFor="upfront"
                            className="block p-4 bg-white border-2 border-slate-200 rounded-xl cursor-pointer transition-all peer-checked:border-indigo-600 peer-checked:ring-4 peer-checked:ring-indigo-50 shadow-sm hover:border-indigo-200 h-full"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 bg-slate-800 text-white text-[9px] font-bold rounded uppercase tracking-wider">
                                Direct Pay
                              </span>
                              <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
                                {paymentOption === "upfront" && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                              </div>
                            </div>
                            <h3 className="font-black text-sm text-slate-800">Direct Settlement</h3>
                            <p className="text-slate-400 text-[11px] font-medium mt-1 leading-normal">
                              Immediate authorization utilizing card networks securely.
                            </p>
                          </label>
                        </div>
                      </div>

                      {/* Content Form Block depending on tab */}
                      {paymentOption === "bnpl" ? (
                        /* --- BNPL PROCESS --- */
                        <div className="space-y-4">
                          
                          {bnplStep === "selection" && (
                            <div className="space-y-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Choose ZenPay Term Schedule</span>
                              
                              <div className="grid gap-3">
                                {/* Plan 1: Pay in 4 */}
                                <div
                                  onClick={() => setSelectedBnplPlan("payIn4")}
                                  className={`p-3.5 bg-white border-2 rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                                    selectedBnplPlan === "payIn4"
                                      ? "border-indigo-600 bg-indigo-50/10 ring-2 ring-indigo-50"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-sm text-slate-800">ZenPay Pay in 4</span>
                                      <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded">Interest-Free</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Four installments every 2 weeks.</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-black text-slate-800 text-base">R{(totalDue / 4).toFixed(2)}</span>
                                    <span className="text-[10px] block text-slate-400 font-bold">/ Installment</span>
                                  </div>
                                </div>

                                {/* Plan 2: Pay in 3 */}
                                <div
                                  onClick={() => setSelectedBnplPlan("payIn3")}
                                  className={`p-3.5 bg-white border-2 rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                                    selectedBnplPlan === "payIn3"
                                      ? "border-indigo-600 bg-indigo-50/10 ring-2 ring-indigo-50"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-sm text-slate-800">ZenPay Pay in 3</span>
                                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded">Zero Fees</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Three installments paid monthly.</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-black text-slate-800 text-base">R{(totalDue / 3).toFixed(2)}</span>
                                    <span className="text-[10px] block text-slate-400 font-bold">/ Installment</span>
                                  </div>
                                </div>

                                {/* Plan 3: Slice It (Interest bearing / customized terms) */}
                                <div
                                  onClick={() => setSelectedBnplPlan("sliceIt")}
                                  className={`p-3.5 bg-white border-2 rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                                    selectedBnplPlan === "sliceIt"
                                      ? "border-indigo-600 bg-indigo-50/10 ring-2 ring-indigo-50"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-sm text-slate-800">ZenPay Slice It</span>
                                      <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">5% Surcharge</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Six monthly interest terms with soft underwriting.</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-black text-indigo-600 text-base">R{((totalDue * 1.05) / 6).toFixed(2)}</span>
                                    <span className="text-[10px] block text-slate-400 font-bold">/ Installment</span>
                                  </div>
                                </div>
                              </div>

                              {/* Amortization Timeline Visualization */}
                              <div className="bg-white border border-slate-200 rounded-xl p-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">ZenPay Deductions Schedule</span>
                                
                                <div className="flex items-stretch justify-between relative pl-4 border-l-2 border-indigo-100 py-1 space-y-4 flex-col">
                                  {selectedBnplPlan === "payIn4" ? (
                                    <>
                                      <div className="flex justify-between items-center relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                                        <div>
                                          <p className="text-xs font-bold text-slate-800">First Installment (Today)</p>
                                          <p className="text-[10px] text-slate-400">Due immediately upon check-out approval.</p>
                                        </div>
                                        <span className="font-extrabold text-sm text-indigo-600">R{(totalDue / 4).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-indigo-200"></div>
                                        <div>
                                          <p className="text-xs font-semibold text-slate-700">Second Installment (In 2 Weeks)</p>
                                          <p className="text-[10px] text-slate-400">Automated processing via bank link.</p>
                                        </div>
                                        <span className="font-bold text-sm text-slate-600">R{(totalDue / 4).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-indigo-200"></div>
                                        <div>
                                          <p className="text-xs font-semibold text-slate-700">Third Installment (In 4 Weeks)</p>
                                          <p className="text-[10px] text-slate-400">Automated electronic statement settlement.</p>
                                        </div>
                                        <span className="font-bold text-sm text-slate-600">R{(totalDue / 4).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-indigo-200"></div>
                                        <div>
                                          <p className="text-xs font-semibold text-slate-700">Fourth Installment (In 6 Weeks)</p>
                                          <p className="text-[10px] text-slate-400">Final transaction balance payoff.</p>
                                        </div>
                                        <span className="font-bold text-sm text-slate-600">R{(totalDue / 4).toFixed(2)}</span>
                                      </div>
                                    </>
                                  ) : selectedBnplPlan === "payIn3" ? (
                                    <>
                                      <div className="flex justify-between items-center relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                                        <div>
                                          <p className="text-xs font-bold text-slate-800">Downpayment (Today)</p>
                                          <p className="text-[10px] text-slate-400">Deducted immediately on merchant completion.</p>
                                        </div>
                                        <span className="font-extrabold text-sm text-indigo-600">R{(totalDue / 3).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-indigo-200"></div>
                                        <div>
                                          <p className="text-xs font-semibold text-slate-700">Month 1 Settlement</p>
                                          <p className="text-[10px] text-slate-400">Next payment scheduled in exactly 30 days.</p>
                                        </div>
                                        <span className="font-bold text-sm text-slate-600">R{(totalDue / 3).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-indigo-200"></div>
                                        <div>
                                          <p className="text-xs font-semibold text-slate-700">Month 2 Payoff</p>
                                          <p className="text-[10px] text-slate-400">Final installment. 0% finance rate complete.</p>
                                        </div>
                                        <span className="font-bold text-sm text-slate-600">R{(totalDue / 3).toFixed(2)}</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex justify-between items-center relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                                        <div>
                                          <p className="text-xs font-bold text-slate-800">Downpayment Today (1 of 6)</p>
                                          <p className="text-[10px] text-slate-400">Initial checkout billing.</p>
                                        </div>
                                        <span className="font-extrabold text-sm text-indigo-600">R{((totalDue * 1.05) / 6).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-indigo-200"></div>
                                        <div>
                                          <p className="text-xs font-semibold text-slate-700">Monthly Billing Cycles (2-6)</p>
                                          <p className="text-[10px] text-slate-400">5 equal monthly debits following purchase.</p>
                                        </div>
                                        <span className="font-bold text-sm text-slate-600">R{((totalDue * 1.05) / 6).toFixed(2)} / mo</span>
                                      </div>
                                      <div className="text-xs bg-slate-50 p-2 rounded text-slate-500 italic mt-2 border border-slate-100 flex items-center gap-1">
                                        <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Note: This interest-bearing plan includes a custom 5% merchant service surcharge.
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Action Button to trigger application */}
                              <button
                                onClick={() => setBnplStep("applyForm")}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-black transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                              >
                                Pre-Qualify & Apply in 1 Click
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {bnplStep === "applyForm" && (
                            <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                              <div>
                                <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                                  <Fingerprint className="w-4 h-4 text-indigo-600" /> Verify Identity for ZenPay Credit
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-1">This soft inquiry has zero impact on your national credit rating.</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                                  <input
                                    type="text"
                                    value={applicantName}
                                    onChange={(e) => setApplicantName(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-slate-50"
                                    placeholder="Jane Doe"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label htmlFor="applicant-phone" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Phone</label>
                                  <input
                                    id="applicant-phone"
                                    aria-label="Mobile Phone"
                                    type="text"
                                    value={applicantPhone}
                                    onChange={(e) => setApplicantPhone(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-slate-50"
                                    placeholder="+1 (555) 000-0000"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label htmlFor="applicant-ssn" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">National ID / SSN (Last 4)</label>
                                  <input
                                    id="applicant-ssn"
                                    aria-label="National ID or SSN last 4 digits"
                                    type="password"
                                    value={applicantSSN}
                                    onChange={(e) => setApplicantSSN(e.target.value.replace(/\D/g, "").substring(0, 4))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-slate-50"
                                    placeholder="••••"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label htmlFor="applicant-dob" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                                  <input
                                    id="applicant-dob"
                                    aria-label="Date of Birth"
                                    type="date"
                                    value={applicantDOB}
                                    onChange={(e) => setApplicantDOB(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-slate-50 text-slate-700"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                                <button
                                  onClick={() => setBnplStep("selection")}
                                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg text-[11px] uppercase tracking-wider transition-all"
                                >
                                  Go Back
                                </button>
                                <button
                                  onClick={handleApplyBNPL}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-[11px] uppercase tracking-wider shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
                                >
                                  <ShieldCheck className="w-4 h-4" /> Check Approval Status
                                </button>
                              </div>
                            </div>
                          )}

                          {bnplStep === "declined" && (
                            <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
                              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <AlertCircle className="w-6 h-6" />
                              </div>
                              <h3 className="font-black text-lg text-slate-900">Credit Score Unsuited</h3>
                              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                ZenPay’s soft scoring node could not authorize a split-payment plan for this order value automatically.
                              </p>
                              <div className="bg-slate-50 p-3 rounded-lg text-slate-400 text-[10px] italic border border-slate-100">
                                Sandbox Hint: Set the "Decision Engine" selection in the top developer bar to "Auto-Approve Plan" to ensure successful approval simulation!
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setBnplStep("applyForm")}
                                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-colors"
                                >
                                  Try Again
                                </button>
                                <button
                                  onClick={() => setPaymentOption("upfront")}
                                  className="flex-1 bg-slate-950 hover:bg-black text-white font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-colors"
                                >
                                  Pay Upfront Instead
                                </button>
                              </div>
                            </div>
                          )}

                          {bnplStep === "approved" && (
                            <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm animate-fade-in">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5 text-emerald-600">
                                    <CheckCircle2 className="w-4.5 h-4.5" />
                                    <span className="font-extrabold text-xs uppercase tracking-wider">ZenPay Soft Pre-Approval Granted</span>
                                  </div>
                                  <h3 className="font-black text-lg mt-1 text-slate-800">Authorized Credit limit: R15,000.00</h3>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">APR Rate</span>
                                  <span className="text-base font-extrabold text-indigo-600">0.0% APR</span>
                                </div>
                              </div>

                              {/* Interactive Electronic Promissory Signature Pad */}
                              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                <div className="flex justify-between items-center px-4 py-2 bg-slate-100 border-b border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Promissory Note Agreement
                                  </span>
                                  <div className="flex bg-white rounded border border-slate-200 p-0.5 text-[9px] font-bold uppercase tracking-wider">
                                    <button
                                      onClick={() => {
                                        setActiveDrawTab("type");
                                        setIsSigned(false);
                                      }}
                                      className={`px-2 py-0.5 rounded ${activeDrawTab === "type" ? "bg-indigo-600 text-white" : "text-slate-500"}`}
                                    >
                                      Type Signature
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDrawTab("draw");
                                        setIsSigned(false);
                                      }}
                                      className={`px-2 py-0.5 rounded ${activeDrawTab === "draw" ? "bg-indigo-600 text-white" : "text-slate-500"}`}
                                    >
                                      Draw Signature
                                    </button>
                                  </div>
                                </div>

                                <div className="p-4 space-y-3">
                                  <p className="text-[10.5px] text-slate-400 leading-normal">
                                    By signing below, you electronically authorize ZenPay to securely debit the schedule above from your linked banking coordinates on the specified dates.
                                  </p>

                                  {activeDrawTab === "type" ? (
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        placeholder="Type applicant full name to sign"
                                        value={signatureTyped}
                                        onChange={(e) => {
                                          setSignatureTyped(e.target.value);
                                          setIsSigned(e.target.value.trim().length > 2);
                                        }}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-xs text-slate-800 placeholder-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                      {signatureTyped && (
                                        <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50 flex flex-col items-center">
                                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Cursive Signature Preview:</span>
                                          <span className="text-xl text-indigo-700 font-bold italic tracking-wide font-serif py-1 px-4 border-b border-indigo-200 select-none">
                                            {signatureTyped}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="relative border border-dashed border-slate-300 rounded-lg bg-white overflow-hidden">
                                        <canvas
                                          ref={canvasRef}
                                          onMouseDown={startDrawing}
                                          onMouseMove={draw}
                                          onMouseUp={stopDrawing}
                                          onMouseLeave={stopDrawing}
                                          width={340}
                                          height={90}
                                          className="w-full h-[90px] cursor-crosshair touch-none block"
                                        />
                                        {!isSigned && (
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
                                            Sign here using cursor or touch
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex justify-end">
                                        <button
                                          onClick={clearCanvas}
                                          className="text-[10px] text-indigo-600 hover:underline font-bold uppercase tracking-wider"
                                        >
                                          Clear Canvas
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Execute Purchase Button */}
                              <button
                                onClick={handleExecutePayment}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-black transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                              >
                                Confirm ZenPay Installment Plan
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                        </div>
                      ) : (
                        /* --- DIRECT UPFRONT CARD PAYMENT --- */
                        <div className="space-y-6">
                          
                          {/* Credit Card Visualization */}
                          <div className="relative w-full max-w-sm mx-auto h-[180px] bg-indigo-950 rounded-2xl shadow-xl overflow-hidden p-6 text-white flex flex-col justify-between border border-indigo-900">
                            {/* Chip & Network Symbol */}
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="w-10 h-7 bg-amber-400 rounded-md border border-amber-300 opacity-80 flex items-center justify-center overflow-hidden">
                                  {/* Chip contacts mockup */}
                                  <div className="w-8 h-5 border border-amber-500 rounded opacity-60 grid grid-cols-3">
                                    <span></span><span></span><span></span>
                                  </div>
                                </div>
                                <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest block">REMMZ Secures</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-sm italic tracking-widest block text-indigo-200">ZenPay Upfront</span>
                                <span className="text-[10px] font-black tracking-wide bg-indigo-800 px-2 py-0.5 rounded text-white mt-1 inline-block uppercase">
                                  {getCardBrand()}
                                </span>
                              </div>
                            </div>

                            {/* Card Number */}
                            <div className="text-base md:text-lg font-mono tracking-widest text-center my-2 text-indigo-100">
                              {cardNumber || "••••  ••••  ••••  ••••"}
                            </div>

                            {/* Holder & Expiry */}
                            <div className="flex justify-between items-end text-xs">
                              <div>
                                <span className="text-[8px] text-indigo-400 uppercase tracking-wider block font-bold">Cardholder</span>
                                <span className="font-bold tracking-wide truncate max-w-[180px] block uppercase">
                                  {cardName || "Your Full Name"}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] text-indigo-400 uppercase tracking-wider block font-bold">Expires</span>
                                <span className="font-mono font-bold">{cardExpiry || "MM/YY"}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] text-indigo-400 uppercase tracking-wider block font-bold">CVV</span>
                                <span className="font-mono font-bold">{cardCvv || "•••"}</span>
                              </div>
                            </div>

                            {/* Abstract Graphic BG Grid */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-tr from-indigo-500 to-transparent flex items-center justify-center">
                              <Sparkles className="w-48 h-48 animate-pulse" />
                            </div>
                          </div>

                          {/* Direct Card Inputs form */}
                          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Enter Payment Card Coordinates</span>
                            
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cardholder Name</label>
                                <input
                                  type="text"
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value)}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-slate-50"
                                  placeholder="Zahra Salie"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Card Number</label>
                                <input
                                  type="text"
                                  value={cardNumber}
                                  onChange={handleCardNumberChange}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-slate-50 font-mono tracking-widest"
                                  placeholder="4000 1234 5678 9010"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiration Date</label>
                                  <input
                                    type="text"
                                    value={cardExpiry}
                                    onChange={handleExpiryChange}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-slate-50 font-mono"
                                    placeholder="MM/YY"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secure CVV Code</label>
                                  <input
                                    type="password"
                                    value={cardCvv}
                                    onChange={handleCvvChange}
                                    onFocus={() => setIsCardFlipped(true)}
                                    onBlur={() => setIsCardFlipped(false)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 bg-slate-50 font-mono"
                                    placeholder="•••"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Execute Purchase Button */}
                          <button
                            onClick={handleExecutePayment}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-black transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md shadow-slate-200"
                          >
                            Authorize Pay-Upfront: R{totalDue.toFixed(2)}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed font-medium">
                      By proceeding, you agree to ZenPay's Payment terms of services, soft-credit score checks, and merchant disclosure statements. Subject to underwriting approval.
                    </p>
                  </div>
                )}
              </section>
            </main>
          ) : (
            /* --- ZenPay CUSTOMER PORTAL INTERFACE --- */
            <main className="flex-1 p-6 md:p-8 lg:p-10 bg-slate-50 overflow-y-auto">
              
              {/* Portal Intro Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <User className="w-6 h-6 text-indigo-600" /> My ZenPay Credit Account
                  </h1>
                  <p className="text-slate-500 text-xs font-semibold mt-1">Manage active micro-loans, view payoff progress, and satisfy payments early</p>
                </div>
                
                {/* Visual quick stats bar */}
                <div className="flex items-center gap-4 bg-white border border-slate-200 p-2 rounded-xl shadow-sm self-start">
                  <div className="flex items-center gap-2 border-r border-slate-100 pr-4 pl-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Active Loans</span>
                      <span className="font-extrabold text-sm text-slate-800">{activeLoansCount} Accounts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pr-2 pl-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Credit Limit</span>
                      <span className="font-extrabold text-sm text-slate-800">R15,000.00 Limit</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Success alert for Portal action */}
              {portalFeedback && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{portalFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Summary Cards & Recent payments history */}
                <div className="space-y-6">
                  {/* Ledger Balance Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
                    <div className="absolute right-0 top-0 opacity-10 font-bold text-9xl tracking-tighter transform translate-x-10 translate-y-10">
                      R
                    </div>
                    <span className="text-[10px] font-bold text-indigo-300 block uppercase tracking-wider">ZenPay Total Debt Ledger</span>
                    <h2 className="text-3xl font-black tracking-tight mt-1 text-white">
                      R{totalOutstanding.toFixed(2)}
                    </h2>
                    <p className="text-[11px] text-indigo-200 mt-2 font-medium">Outstanding split liabilities</p>

                    <div className="mt-6 pt-4 border-t border-indigo-900 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-indigo-400 text-[9px] uppercase tracking-wider font-bold">Next Installment due</span>
                        <span className="font-bold block mt-0.5">July 9, 2026</span>
                      </div>
                      <div className="text-right">
                        <span className="text-indigo-400 text-[9px] uppercase tracking-wider font-bold">Available Credit</span>
                        <span className="font-bold block mt-0.5">R{(15000 - totalOutstanding).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Transaction History */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Transaction History Ledger</span>
                    
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {transactions.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100 last:border-b-0">
                          <div>
                            <p className="font-bold text-slate-800">{tx.merchantName}</p>
                            <p className="text-[10px] text-slate-400">{tx.type} • {tx.date}</p>
                          </div>
                          <span className="font-extrabold text-indigo-600">-R{tx.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Active Loans List and Details */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {selectedPortalLoan ? (
                    /* Detailed view of selected active loan */
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                        <div>
                          <button
                            onClick={() => setSelectedPortalLoan(null)}
                            className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 mb-2"
                          >
                            ← Back to Accounts
                          </button>
                          <h3 className="text-lg font-black text-slate-900">{selectedPortalLoan.merchantName}</h3>
                          <p className="text-xs text-slate-500 mt-1">{selectedPortalLoan.itemName}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                          selectedPortalLoan.remainingAmt > 0 ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {selectedPortalLoan.remainingAmt > 0 ? "Outstanding Debt" : "Fully Satisfied"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Borrowed</span>
                          <span className="font-extrabold text-sm text-slate-800">R{selectedPortalLoan.totalAmt.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Debt</span>
                          <span className="font-extrabold text-sm text-indigo-600">R{selectedPortalLoan.remainingAmt.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Plan Type</span>
                          <span className="font-bold text-sm text-slate-800 uppercase text-xs">
                            {selectedPortalLoan.planType === "payIn4" ? "Pay in 4" : 
                             selectedPortalLoan.planType === "payIn3" ? "Pay in 3" : "Slice It"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Next Installment due</span>
                          <span className="font-bold text-sm text-slate-800">{selectedPortalLoan.nextPaymentDate}</span>
                        </div>
                      </div>

                      {/* Visual Progress bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          <span>Payoff Progress</span>
                          <span className="text-indigo-600">
                            {selectedPortalLoan.paymentsPaid} of {selectedPortalLoan.paymentsTotal} Paid
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                          <div
                            className="bg-indigo-600 h-full transition-all duration-500"
                            style={{ width: `${(selectedPortalLoan.paymentsPaid / selectedPortalLoan.paymentsTotal) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Details of deductions schedule */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mb-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ZenPay Deduction Statement</span>
                        
                        <div className="space-y-2">
                          {Array.from({ length: selectedPortalLoan.paymentsTotal }).map((_, i) => {
                            const isPaid = i < selectedPortalLoan.paymentsPaid;
                            return (
                              <div key={i} className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[9px] font-bold ${
                                    isPaid ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-400"
                                  }`}>
                                    {isPaid ? "✓" : i + 1}
                                  </div>
                                  <span className={isPaid ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>
                                    Installment payment #{i + 1}
                                  </span>
                                </div>
                                <span className={`font-bold ${isPaid ? "text-slate-400 line-through" : "text-slate-800"}`}>
                                  R{(selectedPortalLoan.totalAmt / selectedPortalLoan.paymentsTotal).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Portal pay installment button */}
                      {selectedPortalLoan.remainingAmt > 0 && (
                        <button
                          onClick={() => handlePortalInstallmentPayment(selectedPortalLoan.id)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Wallet className="w-4 h-4" /> Satisfy next payment early (R{selectedPortalLoan.nextPaymentAmt.toFixed(2)})
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Default List of Active loans */
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-black text-sm text-slate-800">Active ZenPay Loan Accounts</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Select an active line item to view deduction histories or pay ahead of schedule.</p>
                      </div>

                      <div className="space-y-3">
                        {loans.map(loan => {
                          const percent = (loan.paymentsPaid / loan.paymentsTotal) * 100;
                          return (
                            <div
                              key={loan.id}
                              className="border border-slate-100 bg-slate-50 hover:bg-indigo-50/10 hover:border-indigo-200 transition-all cursor-pointer p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                              onClick={() => setSelectedPortalLoan(loan)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-extrabold text-sm text-slate-800">{loan.merchantName}</span>
                                  <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded uppercase">
                                    {loan.planType === "payIn4" ? "Pay in 4" : "Pay in 3"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 truncate max-w-sm">{loan.itemName}</p>
                                
                                <div className="flex items-center gap-3 mt-3 w-full max-w-xs">
                                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full" style={{ width: `${percent}%` }}></div>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500">{loan.paymentsPaid}/{loan.paymentsTotal} Paid</span>
                                </div>
                              </div>

                              <div className="flex items-end justify-between md:flex-col md:text-right gap-2 shrink-0">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Remaining Debt</span>
                                  <span className="font-black text-indigo-600 text-sm">
                                    {loan.remainingAmt > 0 ? `R${loan.remainingAmt.toFixed(2)}` : "Fully Satisfied ✓"}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5 hover:underline group">
                                  Manage Plan <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Complete Credit Underwriting Note */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800">ZenPay Financial Underwriting Standards</h4>
                      <p className="text-[10.5px] text-slate-400 leading-normal mt-1">
                        ZenPay micro-installment lending coordinates with fully compliant PCI DSS security measures and registers payoff credit lines dynamically to promote transparent consumer finance.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </main>
          )}

          {/* Footer */}
          <footer className="h-12 bg-white border-t border-slate-200 px-6 md:px-10 flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-widest shrink-0 uppercase">
            <div className="flex gap-4 md:gap-6">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> PCI DSS COMPLIANT</span>
              <span className="hidden sm:inline">256-BIT ENCRYPTED CONNECTION</span>
            </div>
            <div className="flex gap-4">
              <span className="text-indigo-600">© ZENPAY FINTECH 2026</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
