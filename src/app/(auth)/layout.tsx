import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

// Prevent static generation - requires Clerk at runtime
export const dynamic = "force-dynamic";

/**
 * Auth layout - owns its background surface.
 * CANONICAL RULE: Layouts own backgrounds, not pages. Body must never be visible.
 *
 * Note: Auth pages (SignInClient, SignUpClient) also apply bg-background for
 * their centering containers. This is redundant but harmless - the layout
 * ensures coverage for SSO callback pages and any future auth routes.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProviderWrapper>
      <div className="min-h-dvh w-full bg-background text-foreground">
        {children}
      </div>
    </ClerkProviderWrapper>
  );
}
