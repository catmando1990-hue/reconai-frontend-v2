import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

// Prevent static generation - requires Clerk at runtime
export const dynamic = "force-dynamic";

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProviderWrapper>{children}</ClerkProviderWrapper>;
}
