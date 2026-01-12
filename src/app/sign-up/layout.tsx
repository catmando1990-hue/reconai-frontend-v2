import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProviderWrapper>{children}</ClerkProviderWrapper>;
}
