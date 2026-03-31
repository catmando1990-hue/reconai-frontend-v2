"use client";

import { ChevronDown, FileText, Filter, Plus, Search } from "lucide-react";
import { useState } from "react";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/govcon/GovConContracts.css";

const mockContracts = [
  {
    id: 1,
    contractNumber: "FA-8721-23-C-0042",
    name: "Cyber Defense Platform",
    agency: "USAF / AFLCMC",
    type: "FFP",
    totalValue: 4200000,
    periodStart: "Oct 2023",
    periodEnd: "Sep 2025",
    status: "Active",
  },
  {
    id: 2,
    contractNumber: "W912DY-24-D-0015",
    name: "Base Infrastructure Support",
    agency: "USACE",
    type: "T&M",
    totalValue: 6800000,
    periodStart: "Jan 2024",
    periodEnd: "Dec 2026",
    status: "Active",
  },
  {
    id: 3,
    contractNumber: "N00024-23-C-1234",
    name: "Naval Systems Integration",
    agency: "NAVSEA",
    type: "CPFF",
    totalValue: 3200000,
    periodStart: "Jun 2023",
    periodEnd: "May 2025",
    status: "Active",
  },
  {
    id: 4,
    contractNumber: "GS-35F-0152Y",
    name: "IT Professional Services",
    agency: "GSA",
    type: "IDIQ",
    totalValue: 25000000,
    periodStart: "Apr 2022",
    periodEnd: "Mar 2027",
    status: "Active",
  },
  {
    id: 5,
    contractNumber: "HHSN-316-2024-0001",
    name: "Health Data Analytics",
    agency: "HHS / NIH",
    type: "CPAF",
    totalValue: 2100000,
    periodStart: "Mar 2024",
    periodEnd: "Feb 2026",
    status: "Active",
  },
  {
    id: 6,
    contractNumber: "FA-8721-22-C-0018",
    name: "Prior Cyber Support",
    agency: "USAF / AFLCMC",
    type: "FFP",
    totalValue: 1800000,
    periodStart: "Oct 2022",
    periodEnd: "Sep 2024",
    status: "Completed",
  },
];

const typeColors = {
  FFP: "gcc-type-ffp",
  "T&M": "gcc-type-tm",
  CPFF: "gcc-type-cpff",
  IDIQ: "gcc-type-idiq",
  CPAF: "gcc-type-cpaf",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function GovConContracts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredContracts = mockContracts.filter((contract) => {
    const matchesSearch =
      contract.contractNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.agency.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || contract.status === statusFilter;
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
                  <td className="gcc-contract-number">
                    {contract.contractNumber}
                  </td>
                  <td className="gcc-contract-name">{contract.name}</td>
                  <td>{contract.agency}</td>
                  <td>
                    <span
                      className={`gcc-type-badge ${typeColors[contract.type]}`}
                    >
                      {contract.type}
                    </span>
                  </td>
                  <td className="gcc-value">
                    {formatCurrency(contract.totalValue)}
                  </td>
                  <td>
                    {contract.periodStart} &ndash; {contract.periodEnd}
                  </td>
                  <td>
                    <span
                      className={`gcc-status-badge ${
                        contract.status === "Active"
                          ? "gcc-status-active"
                          : "gcc-status-completed"
                      }`}
                    >
                      {contract.status}
                    </span>
                  </td>
                  <td>
                    <button className="gcc-view-details-btn">
                      View Details
                    </button>
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
      </div>
    </div>
  );
}
