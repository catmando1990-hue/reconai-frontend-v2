import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

// Prevent static generation - requires Clerk at runtime
export const dynamic = "force-dynamic";

/**
 * Auth layout - owns the app canvas for auth routes.
 * CANONICAL RULE: Layouts own backgrounds, not pages.
 *
 * Uses bg-app-canvas (charcoal in dark mode) so auth forms (surfaces)
 * appear to float on a lighter backdrop.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProviderWrapper>
      <div className="min-h-dvh w-full bg-app-canvas text-foreground">
        {children}
      </div>
    </ClerkProviderWrapper>
  );
}
