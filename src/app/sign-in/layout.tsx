import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProviderWrapper>{children}</ClerkProviderWrapper>;
}
