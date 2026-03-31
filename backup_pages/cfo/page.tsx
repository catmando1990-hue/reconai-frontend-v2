import { redirect } from "next/navigation";

/**
 * CFO module index - redirects to overview
 * The actual content lives at /cfo/overview
 */
export default function CfoIndexPage() {
  redirect("/cfo/overview");
}
