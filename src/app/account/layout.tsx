import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

// Prevent static generation - requires Clerk at runtime
export const dynamic = "force-dynamic";

/**
 * Account layout - owns its background surface.
 * CANONICAL RULE: Layouts own backgrounds, not pages. Body must never be visible.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProviderWrapper>
      <div className="min-h-dvh bg-background text-foreground">{children}</div>
    </ClerkProviderWrapper>
  );
}
