"use client";

import { DollarSign, FileText, Mail, Phone, Search, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { vendorsApi } from '@/api';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/invoicing/InvoicingVendors.css';

export default function InvoicingVendors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await vendorsApi.listVendors();
      const list = Array.isArray(raw) ? raw : [];
      setVendors(
        list.map((v) => ({
          id: v.id,
          name: v.name || v.company_name || 'Unknown',
          contactName: v.contact_name || v.contact || '',
          email: v.email || '',
          phone: v.phone || '',
          outstanding: v.outstanding_balance || v.outstanding || 0,
          billCount: v.bill_count || v.bills_count || 0,
          status: v.status ? v.status.charAt(0).toUpperCase() + v.status.slice(1).toLowerCase() : 'Active',
        }))
      );
    } catch (err) {
      console.warn('[InvoicingVendors] Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div className="iv-avatar">
                {vendor.name.charAt(0)}
              </div>
              <div className="iv-card-title-group">
                <h3 className="iv-card-name">{vendor.name}</h3>
                <span className={`iv-status-badge ${vendor.status === 'Active' ? 'iv-status-active' : 'iv-status-inactive'}`}>
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
                <span className={`iv-stat-value ${vendor.outstanding > 0 ? 'iv-outstanding-highlight' : ''}`}>
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
