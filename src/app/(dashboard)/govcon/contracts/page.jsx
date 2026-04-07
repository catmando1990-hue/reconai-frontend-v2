"use client";

import { ChevronDown, FileText, Filter, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { govconApi } from '@/api';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/govcon/GovConContracts.css';

const typeColors = {
  FFP: 'gcc-type-ffp',
  'T&M': 'gcc-type-tm',
  CPFF: 'gcc-type-cpff',
  IDIQ: 'gcc-type-idiq',
  CPAF: 'gcc-type-cpaf',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function GovConContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await govconApi.listContracts();
      const list = res.data ?? res;
      setContracts(
        (Array.isArray(list) ? list : []).map((c) => ({
          id: c.id,
          contractNumber: c.contract_number ?? c.contractNumber ?? '',
          name: c.name ?? c.contract_name ?? '',
          agency: c.agency ?? '',
          type: c.type ?? c.contract_type ?? '',
          totalValue: c.total_value ?? c.totalValue ?? 0,
          periodStart: c.period_start ?? c.periodStart ?? '',
          periodEnd: c.period_end ?? c.periodEnd ?? '',
          status: c.status ?? 'Active',
        }))
      );
    } catch (err) {
      console.warn('GovConContracts: failed to fetch contracts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.agency.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="gcc-govcon-contracts">
      <PolicyBanner
        policy="legal"
        context="govcon-contracts"
        message="Contract data is for tracking purposes only. Verify all details against official contract documents."
        dismissible
      />

      <div className="gcc-header">
        <div className="gcc-header-left">
          <FileText size={24} className="gcc-header-icon" />
          <h1 className="gcc-title">Contracts</h1>
        </div>
        <button className="gcc-new-contract-btn">
          <Plus size={16} />
          New Contract
        </button>
      </div>

      <div className="gcc-search-bar">
        <div className="gcc-search-input-wrapper">
          <Search size={16} className="gcc-search-icon" />
          <input
            type="text"
            className="gcc-search-input"
            placeholder="Search contracts by number, name, or agency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="gcc-filter-group">
          <Filter size={16} className="gcc-filter-icon" />
          <select
            className="gcc-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
          <ChevronDown size={14} className="gcc-select-chevron" />
        </div>
      </div>

      <div className="gcc-table-card">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Loading contracts...</p>
        ) : (
          <div className="gcc-table-wrapper">
            <table className="gcc-table">
              <thead>
                <tr>
                  <th>Contract Number</th>
                  <th>Contract Name</th>
                  <th>Agency</th>
                  <th>Type</th>
                  <th>Total Value</th>
                  <th>Period of Performance</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="gcc-contract-number">{contract.contractNumber}</td>
                    <td className="gcc-contract-name">{contract.name}</td>
                    <td>{contract.agency}</td>
                    <td>
                      <span className={`gcc-type-badge ${typeColors[contract.type]}`}>
                        {contract.type}
                      </span>
                    </td>
                    <td className="gcc-value">{formatCurrency(contract.totalValue)}</td>
                    <td>{contract.periodStart} &ndash; {contract.periodEnd}</td>
                    <td>
                      <span
                        className={`gcc-status-badge ${
                          contract.status === 'Active'
                            ? 'gcc-status-active'
                            : 'gcc-status-completed'
                        }`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td>
                      <button className="gcc-view-details-btn">View Details</button>
                    </td>
                  </tr>
                ))}
                {filteredContracts.length === 0 && (
                  <tr>
                    <td colSpan="8" className="gcc-empty-state">
                      No contracts match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
