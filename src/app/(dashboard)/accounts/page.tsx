import { RouteShell } from "@/components/dashboard/RouteShell";
import { AccountsPanel } from "@/components/plaid/accounts-panel";

export default function AccountsPage() {
  return (
    <RouteShell
      title="Accounts"
      subtitle="Linked accounts, balances, and connection health."
    >
      <AccountsPanel />
    </RouteShell>
  );
}
