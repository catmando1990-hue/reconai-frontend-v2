import { redirect } from "next/navigation";

/**
 * Intelligence module index - redirects to insights
 * The actual content lives at /intelligence/insights
 */
export default function IntelligenceIndexPage() {
  redirect("/intelligence/insights");
}
