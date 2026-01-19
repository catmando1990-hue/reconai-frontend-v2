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
      {/*
        Auth pages render their own full-viewport background and centering.
        This layout must NOT constrain width, otherwise background images
        collapse into a narrow column (desktop regression).
      */}
      <div className="min-h-dvh w-full">{children}</div>
    </ClerkProviderWrapper>
  );
}
