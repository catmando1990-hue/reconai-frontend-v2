/**
 * V2 Design System Components
 *
 * These components run parallel to existing dashboard components.
 * Modules opt-in by importing from this folder.
 *
 * Usage in module layout:
 * import { ShellV2 } from "@/components/dashboard-v2";
 */

// Layout components
export { SidebarV2 } from "./SidebarV2";
export { ShellV2 } from "./ShellV2";
export { RouteShellV2 } from "./RouteShellV2";

// Primitives
export {
  Card,
  StatCard,
  Tabs,
  Tab,
  DataTable,
  Button,
  Badge,
  EmptyState,
  PageHeader,
} from "./primitives";
