import { redirect } from "next/navigation";

/**
 * Payroll module index - redirects to overview
 * The actual content lives at /payroll/overview
 */
export default function PayrollIndexPage() {
  redirect("/payroll/overview");
}
