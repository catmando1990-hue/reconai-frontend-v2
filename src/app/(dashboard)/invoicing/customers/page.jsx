"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/invoicing/InvoicingCustomers.css";
import {
  DollarSign,
  FileText,
  Mail,
  Phone,
  Search,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

const mockCustomers = [
  {
    id: 1,
    name: "Acme Corp",
    contactName: "John Smith",
    email: "john@acme.com",
    phone: "(555) 123-4567",
    outstanding: 8500,
    invoiceCount: 12,
    status: "Active",
  },
  {
    id: 2,
    name: "Global Tech Solutions",
    contactName: "Sarah Chen",
    email: "sarah@globaltech.io",
    phone: "(555) 234-5678",
    outstanding: 12350,
    invoiceCount: 8,
    status: "Active",
  },
  {
    id: 3,
    name: "Summit LLC",
    contactName: "Mike Johnson",
    email: "mike@summitllc.com",
    phone: "(555) 345-6789",
    outstanding: 0,
    invoiceCount: 5,
    status: "Active",
  },
  {
    id: 4,
    name: "Vertex Inc",
    contactName: "Lisa Park",
    email: "lisa@vertexinc.com",
    phone: "(555) 456-7890",
    outstanding: 6800,
    invoiceCount: 3,
    status: "Active",
  },
  {
    id: 5,
    name: "Atlas Group",
    contactName: "David Kim",
    email: "david@atlasgroup.co",
    phone: "(555) 567-8901",
    outstanding: 15000,
    invoiceCount: 7,
    status: "Active",
  },
  {
    id: 6,
    name: "RedOak Partners",
    contactName: "Amanda Lee",
    email: "amanda@redoak.com",
    phone: "(555) 678-9012",
    outstanding: 0,
    invoiceCount: 4,
    status: "Inactive",
  },
];

export default function InvoicingCustomers() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="ic-page">
      <PolicyBanner
        policy="info"
        context="invoicing-customers"
        message="Customer data is maintained within the Invoicing module and is not shared with other modules."
        dismissible
      />

      <div className="ic-header">
        <h1 className="ic-title">Customers</h1>
        <div className="ic-header-actions">
          <div className="ic-search-wrapper">
            <Search size={16} className="ic-search-icon" />
            <input
              type="text"
              className="ic-search-input"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="ic-add-btn">
            <UserPlus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      <div className="ic-grid">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="ic-card">
            <div className="ic-card-header">
              <div className="ic-avatar">{customer.name.charAt(0)}</div>
              <div className="ic-card-title-group">
                <h3 className="ic-card-name">{customer.name}</h3>
                <span
                  className={`ic-status-badge ${customer.status === "Active" ? "ic-status-active" : "ic-status-inactive"}`}
                >
                  {customer.status}
                </span>
              </div>
            </div>

            <div className="ic-card-contact">
              <p className="ic-contact-label">
                Primary: {customer.contactName}
              </p>
              <div className="ic-contact-row">
                <Mail size={14} className="ic-contact-icon" />
                <span>{customer.email}</span>
              </div>
              <div className="ic-contact-row">
                <Phone size={14} className="ic-contact-icon" />
                <span>{customer.phone}</span>
              </div>
            </div>

            <div className="ic-card-footer">
              <div className="ic-stat">
                <DollarSign size={14} className="ic-stat-icon" />
                <span
                  className={`ic-stat-value ${customer.outstanding > 0 ? "ic-outstanding-highlight" : ""}`}
                >
                  Outstanding: ${customer.outstanding.toLocaleString()}
                </span>
              </div>
              <div className="ic-stat">
                <FileText size={14} className="ic-stat-icon" />
                <span className="ic-stat-value">
                  {customer.invoiceCount} invoices
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="ic-empty">
          <p>No customers match your search.</p>
        </div>
      )}
    </div>
  );
}
