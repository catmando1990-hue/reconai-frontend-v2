import { redirect } from "next/navigation";

/**
 * Intelligence module index - redirects to overview
 * The actual content lives at /intelligence/overview
 */
export default function IntelligenceIndexPage() {
  redirect("/intelligence/overview");
}
