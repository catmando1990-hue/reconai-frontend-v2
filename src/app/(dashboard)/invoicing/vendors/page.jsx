"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/invoicing/InvoicingVendors.css";
import {
  DollarSign,
  FileText,
  Mail,
  Phone,
  Search,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

const mockVendors = [
  {
    id: 1,
    name: "Office Solutions Co",
    contactName: "Tom Wilson",
    email: "tom@officesolutions.com",
    phone: "(555) 111-2222",
    outstanding: 4200,
    billCount: 8,
    status: "Active",
  },
  {
    id: 2,
    name: "CloudHost Pro",
    contactName: "Emily Davis",
    email: "emily@cloudhost.pro",
    phone: "(555) 222-3333",
    outstanding: 2850,
    billCount: 12,
    status: "Active",
  },
  {
    id: 3,
    name: "Metro Supplies",
    contactName: "Robert Brown",
    email: "robert@metrosupplies.com",
    phone: "(555) 333-4444",
    outstanding: 0,
    billCount: 6,
    status: "Active",
  },
  {
    id: 4,
    name: "SecureIT Solutions",
    contactName: "Karen White",
    email: "karen@secureit.com",
    phone: "(555) 444-5555",
    outstanding: 11700,
    billCount: 4,
    status: "Active",
  },
  {
    id: 5,
    name: "GreenLeaf Services",
    contactName: "James Taylor",
    email: "james@greenleaf.co",
    phone: "(555) 555-6666",
    outstanding: 0,
    billCount: 3,
    status: "Inactive",
  },
];

export default function InvoicingVendors() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVendors = mockVendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="iv-page">
      <PolicyBanner
        policy="info"
        context="invoicing-vendors"
        message="Vendor data is maintained within the Invoicing module and is not shared with other modules."
        dismissible
      />

      <div className="iv-header">
        <h1 className="iv-title">Vendors</h1>
        <div className="iv-header-actions">
          <div className="iv-search-wrapper">
            <Search size={16} className="iv-search-icon" />
            <input
              type="text"
              className="iv-search-input"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="iv-add-btn">
            <UserPlus size={16} />
            Add Vendor
          </button>
        </div>
      </div>

      <div className="iv-grid">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="iv-card">
            <div className="iv-card-header">
              <div className="iv-avatar">{vendor.name.charAt(0)}</div>
              <div className="iv-card-title-group">
                <h3 className="iv-card-name">{vendor.name}</h3>
                <span
                  className={`iv-status-badge ${vendor.status === "Active" ? "iv-status-active" : "iv-status-inactive"}`}
                >
                  {vendor.status}
                </span>
              </div>
            </div>

            <div className="iv-card-contact">
              <p className="iv-contact-label">Contact: {vendor.contactName}</p>
              <div className="iv-contact-row">
                <Mail size={14} className="iv-contact-icon" />
                <span>{vendor.email}</span>
              </div>
              <div className="iv-contact-row">
                <Phone size={14} className="iv-contact-icon" />
                <span>{vendor.phone}</span>
              </div>
            </div>

            <div className="iv-card-footer">
              <div className="iv-stat">
                <DollarSign size={14} className="iv-stat-icon" />
                <span
                  className={`iv-stat-value ${vendor.outstanding > 0 ? "iv-outstanding-highlight" : ""}`}
                >
                  Bills Outstanding: ${vendor.outstanding.toLocaleString()}
                </span>
              </div>
              <div className="iv-stat">
                <FileText size={14} className="iv-stat-icon" />
                <span className="iv-stat-value">{vendor.billCount} bills</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="iv-empty">
          <p>No vendors match your search.</p>
        </div>
      )}
    </div>
  );
}
