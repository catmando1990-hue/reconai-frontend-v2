import { AlertTriangle, Info, Shield, X } from "lucide-react";
import { useState } from "react";
import "./PolicyBanner.css";

const POLICY_CONFIG = {
  accounting: {
    icon: AlertTriangle,
    variant: "warning",
    defaultMessage:
      "Financial reports are informational only. Please consult a licensed accountant for professional advice.",
  },
  legal: {
    icon: Shield,
    variant: "info",
    defaultMessage:
      "This information is for reference only and does not constitute legal advice.",
  },
  tax: {
    icon: AlertTriangle,
    variant: "warning",
    defaultMessage:
      "Tax calculations are estimates. Consult a tax professional for accurate filings.",
  },
  general: {
    icon: Info,
    variant: "neutral",
    defaultMessage: "This information is provided for general guidance only.",
  },
};

export default function PolicyBanner({
  policy = "general",
  context,
  message,
  dismissible = false,
  onDismiss,
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const config = POLICY_CONFIG[policy] || POLICY_CONFIG.general;
  const Icon = config.icon;
  const displayMessage = message || config.defaultMessage;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`policy-banner ${config.variant}`}
      data-policy={policy}
      data-context={context}
      role="alert"
    >
      <div className="policy-icon">
        <Icon size={18} />
      </div>
      <p className="policy-message">{displayMessage}</p>
      {dismissible && (
        <button
          className="policy-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
