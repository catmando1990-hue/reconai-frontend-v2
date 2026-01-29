"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Minimal data shape for consistency checking.
 * Only timestamps and existence flags - no sensitive balances.
 */

export type StatementsData = {
  loaded: boolean;
  count: number;
  periods: Array<{
    start: string;
    end: string;
  }>;
  fetchedAt: string | null;
};

export type AssetSnapshotData = {
  loaded: boolean;
  count: number;
  snapshots: Array<{
    generatedAt: string;
  }>;
  fetchedAt: string | null;
};

export type LiabilitiesData = {
  loaded: boolean;
  hasData: boolean;
  fetchedAt: string | null;
};

export type InvestmentsData = {
  loaded: boolean;
  holdingsLoaded: boolean;
  transactionsLoaded: boolean;
  holdingsFetchedAt: string | null;
  transactionsFetchedAt: string | null;
  refreshedAt: string | null;
};

export type FinancialEvidenceState = {
  statements: StatementsData;
  assetSnapshots: AssetSnapshotData;
  liabilities: LiabilitiesData;
  investments: InvestmentsData;
};

type FinancialEvidenceContextValue = {
  state: FinancialEvidenceState;
  updateStatements: (data: Partial<StatementsData>) => void;
  updateAssetSnapshots: (data: Partial<AssetSnapshotData>) => void;
  updateLiabilities: (data: Partial<LiabilitiesData>) => void;
  updateInvestments: (data: Partial<InvestmentsData>) => void;
};

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: FinancialEvidenceState = {
  statements: {
    loaded: false,
    count: 0,
    periods: [],
    fetchedAt: null,
  },
  assetSnapshots: {
    loaded: false,
    count: 0,
    snapshots: [],
    fetchedAt: null,
  },
  liabilities: {
    loaded: false,
    hasData: false,
    fetchedAt: null,
  },
  investments: {
    loaded: false,
    holdingsLoaded: false,
    transactionsLoaded: false,
    holdingsFetchedAt: null,
    transactionsFetchedAt: null,
    refreshedAt: null,
  },
};

// =============================================================================
// CONTEXT
// =============================================================================

const FinancialEvidenceContext =
  createContext<FinancialEvidenceContextValue | null>(null);

/**
 * FinancialEvidenceProvider - Collects loaded data from Phase 8 panels
 * for cross-report consistency checking.
 *
 * Phase 8D: Advisory consistency checks only.
 * - No backend calls
 * - No automation
 * - Panels report their loaded state for comparison
 */
export function FinancialEvidenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<FinancialEvidenceState>(initialState);

  const updateStatements = useCallback((data: Partial<StatementsData>) => {
    setState((prev) => ({
      ...prev,
      statements: { ...prev.statements, ...data },
    }));
  }, []);

  const updateAssetSnapshots = useCallback(
    (data: Partial<AssetSnapshotData>) => {
      setState((prev) => ({
        ...prev,
        assetSnapshots: { ...prev.assetSnapshots, ...data },
      }));
    },
    [],
  );

  const updateLiabilities = useCallback((data: Partial<LiabilitiesData>) => {
    setState((prev) => ({
      ...prev,
      liabilities: { ...prev.liabilities, ...data },
    }));
  }, []);

  const updateInvestments = useCallback((data: Partial<InvestmentsData>) => {
    setState((prev) => ({
      ...prev,
      investments: { ...prev.investments, ...data },
    }));
  }, []);

  return (
    <FinancialEvidenceContext.Provider
      value={{
        state,
        updateStatements,
        updateAssetSnapshots,
        updateLiabilities,
        updateInvestments,
      }}
    >
      {children}
    </FinancialEvidenceContext.Provider>
  );
}

/**
 * Hook to access financial evidence context.
 * Returns null if used outside provider (safe for optional use).
 */
export function useFinancialEvidence(): FinancialEvidenceContextValue | null {
  return useContext(FinancialEvidenceContext);
}
