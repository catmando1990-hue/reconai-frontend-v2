import { redirect } from "next/navigation";

/**
 * Clerk is currently redirecting here after sign-in/sign-up.
 * Keep this route as a stable landing and redirect to the dashboard.
 */
export default function ConnectBankPage() {
  redirect("/dashboard");
}
