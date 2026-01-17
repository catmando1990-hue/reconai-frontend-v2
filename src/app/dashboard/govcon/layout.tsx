import { GovConEntitlementGuard } from "@/components/dashboard/GovConEntitlementGuard";

// Prevent static generation - requires UserProfileProvider at runtime
export const dynamic = "force-dynamic";

/**
 * GovCon Layout - Server Wrapper
 *
 * Wraps children in the client-side entitlement guard.
 * The guard checks GovCon entitlement before rendering.
 */
export default function GovConLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GovConEntitlementGuard>{children}</GovConEntitlementGuard>;
}
