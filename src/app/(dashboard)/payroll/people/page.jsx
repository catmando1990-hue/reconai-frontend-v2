"use client";

import { Briefcase, Mail, MapPin, Search, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/payroll/PayrollPeople.css';

const employees = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Engineering Manager',
    type: 'Full-Time',
    department: 'Engineering',
    location: 'San Francisco, CA',
    email: 's.chen@company.com',
    status: 'active',
    startDate: 'Jan 2024',
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Senior Developer',
    type: 'Full-Time',
    department: 'Engineering',
    location: 'Austin, TX',
    email: 'm.johnson@company.com',
    status: 'active',
    startDate: 'Mar 2024',
  },
  {
    id: 3,
    name: 'Priya Patel',
    role: 'Product Designer',
    type: 'Full-Time',
    department: 'Design',
    location: 'New York, NY',
    email: 'p.patel@company.com',
    status: 'active',
    startDate: 'Jun 2024',
  },
  {
    id: 4,
    name: 'James Wilson',
    role: 'QA Engineer',
    type: 'Part-Time',
    department: 'Engineering',
    location: 'Remote',
    email: 'j.wilson@company.com',
    status: 'active',
    startDate: 'Sep 2024',
  },
  {
    id: 5,
    name: 'Ana Rodriguez',
    role: 'Marketing Lead',
    type: 'Full-Time',
    department: 'Marketing',
    location: 'Miami, FL',
    email: 'a.rodriguez@company.com',
    status: 'active',
    startDate: 'Feb 2025',
  },
];

const contractors = [
  {
    id: 101,
    name: 'David Kim',
    role: 'Security Consultant',
    company: 'SecureOps LLC',
    type: '1099',
    status: 'active',
    startDate: 'Jan 2025',
  },
  {
    id: 102,
    name: 'Lisa Thompson',
    role: 'Tax Advisor',
    company: 'Thompson CPA',
    type: '1099',
    status: 'active',
    startDate: 'Nov 2024',
  },
  {
    id: 103,
    name: 'Robert Taylor',
    role: 'IT Infrastructure',
    company: 'Independent',
    type: '1099',
    status: 'active',
    startDate: 'Jul 2025',
  },
];

export default function PayrollPeople() {
  const [activeTab, setActiveTab] = useState('employees');
  const [search, setSearch] = useState('');

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContractors = contractors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="payroll-people">
      <PolicyBanner
        policy="general"
        context="people-advisory"
        message="Employee data shown is for reference. Consult HR for official records."
        dismissible
      />

      <header className="people-header">
        <div className="header-left">
          <div className="header-title">
            <Users size={22} />
            <h1>People</h1>
          </div>
          <p className="header-subtitle">Workforce directory and management</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="people-tabs">
        <button
          className={`people-tab ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <UserCheck size={16} /> Employees ({employees.length})
        </button>
        <button
          className={`people-tab ${activeTab === 'contractors' ? 'active' : ''}`}
          onClick={() => setActiveTab('contractors')}
        >
          <Briefcase size={16} /> Contractors ({contractors.length})
        </button>
      </div>

      {/* Search */}
      <div className="people-search">
        <Search size={16} />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Employee List */}
      {activeTab === 'employees' && (
        <div className="people-list">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="person-card">
              <div className="person-avatar">
                {emp.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="person-info">
                <h3>{emp.name}</h3>
                <p>{emp.role}</p>
                <div className="person-meta">
                  <span>
                    <MapPin size={12} /> {emp.location}
                  </span>
                  <span>
                    <Mail size={12} /> {emp.email}
                  </span>
                </div>
              </div>
              <div className="person-details">
                <span className="person-type">{emp.type}</span>
                <span className="person-dept">{emp.department}</span>
                <span className="person-date">Since {emp.startDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contractor List */}
      {activeTab === 'contractors' && (
        <div className="people-list">
          {filteredContractors.map((con) => (
            <div key={con.id} className="person-card">
              <div className="person-avatar contractor">
                {con.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div className="person-info">
                <h3>{con.name}</h3>
                <p>{con.role}</p>
                <div className="person-meta">
                  <span>
                    <Briefcase size={12} /> {con.company}
                  </span>
                </div>
              </div>
              <div className="person-details">
                <span className="person-type contractor">{con.type}</span>
                <span className="person-date">Since {con.startDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
