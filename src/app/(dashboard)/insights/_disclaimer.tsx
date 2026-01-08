import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { AI_DISCLAIMER } from "@/lib/legal/disclaimers";

export function InsightsDisclaimer() {
  return <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>;
}
