import { redirect } from "next/navigation";

/**
 * Core module index - redirects to overview
 * The actual content lives at /core/overview
 */
export default function CoreIndexPage() {
  redirect("/core/overview");
}
