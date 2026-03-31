import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { AI_DISCLAIMER, REGULATORY_DISCLAIMER } from "@/lib/legal/disclaimers";

export function CfoDisclaimer() {
  return (
    <div className="space-y-2">
      <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>
      <DisclaimerNotice>{REGULATORY_DISCLAIMER}</DisclaimerNotice>
    </div>
  );
}
