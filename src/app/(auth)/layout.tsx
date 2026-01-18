import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

// Prevent static generation - requires Clerk at runtime
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProviderWrapper>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-6">{children}</div>
      </div>
    </ClerkProviderWrapper>
  );
}
