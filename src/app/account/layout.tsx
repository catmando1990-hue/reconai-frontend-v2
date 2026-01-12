import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProviderWrapper>{children}</ClerkProviderWrapper>;
}
