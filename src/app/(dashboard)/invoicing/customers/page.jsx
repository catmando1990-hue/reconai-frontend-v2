"use client";

import { DollarSign, FileText, Mail, Phone, Search, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { invoicingApi } from '@/api';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/invoicing/InvoicingCustomers.css';

export default function InvoicingCustomers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await invoicingApi.listCustomers();
      const list = Array.isArray(raw) ? raw : [];
      setCustomers(
        list.map((c) => ({
          id: c.id,
          name: c.name || c.company_name || 'Unknown',
          contactName: c.contact_name || c.contact || '',
          email: c.email || '',
          phone: c.phone || '',
          outstanding: c.outstanding_balance || c.outstanding || 0,
          invoiceCount: c.invoice_count || c.invoices_count || 0,
          status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : 'Active',
        }))
      );
    } catch (err) {
      console.warn('[InvoicingCustomers] Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div className="ic-avatar">
                {customer.name.charAt(0)}
              </div>
              <div className="ic-card-title-group">
                <h3 className="ic-card-name">{customer.name}</h3>
                <span className={`ic-status-badge ${customer.status === 'Active' ? 'ic-status-active' : 'ic-status-inactive'}`}>
                  {customer.status}
                </span>
              </div>
            </div>

            <div className="ic-card-contact">
              <p className="ic-contact-label">Primary: {customer.contactName}</p>
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
                <span className={`ic-stat-value ${customer.outstanding > 0 ? 'ic-outstanding-highlight' : ''}`}>
                  Outstanding: ${customer.outstanding.toLocaleString()}
                </span>
              </div>
              <div className="ic-stat">
                <FileText size={14} className="ic-stat-icon" />
                <span className="ic-stat-value">{customer.invoiceCount} invoices</span>
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
