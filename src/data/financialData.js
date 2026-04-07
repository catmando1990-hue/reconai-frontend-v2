// Shared financial data for the CORE module
// This simulates data that would come from Plaid/bank connections

// Account data by institution
export const accountData = [
  {
    institution_id: 'ins_chase',
    institution_name: 'Chase',
    item_id: 'item_001',
    accounts: [
      { id: 'acc_001', name: 'Business Checking', type: 'depository', subtype: 'checking', current: 45230.50, available: 44850.00, mask: '4521', currency: 'USD' },
      { id: 'acc_002', name: 'Business Savings', type: 'depository', subtype: 'savings', current: 28750.00, available: 28750.00, mask: '8834', currency: 'USD', interestEarned: 342.50 },
    ],
  },
  {
    institution_id: 'ins_bofa',
    institution_name: 'Bank of America',
    item_id: 'item_002',
    accounts: [
      { id: 'acc_003', name: 'Advantage Checking', type: 'depository', subtype: 'checking', current: 12540.25, available: 12000.00, mask: '9912', currency: 'USD' },
      { id: 'acc_010', name: 'Investment Account', type: 'investment', subtype: 'brokerage', current: 87500.00, available: 87500.00, mask: '6678', currency: 'USD', dividends: 2340.00, capitalGains: 4520.00 },
    ],
  },
  {
    institution_id: 'ins_amex',
    institution_name: 'American Express',
    item_id: 'item_003',
    accounts: [
      { id: 'acc_004', name: 'Business Platinum Card', type: 'credit', subtype: 'credit card', current: -2340.00, available: 22660.00, mask: '1004', currency: 'USD' },
      { id: 'acc_005', name: 'Business Gold Card', type: 'credit', subtype: 'credit card', current: -875.50, available: 14124.50, mask: '2008', currency: 'USD' },
    ],
  },
  {
    institution_id: 'ins_wells',
    institution_name: 'Wells Fargo',
    item_id: 'item_004',
    accounts: [
      { id: 'acc_006', name: 'Platinum Business Checking', type: 'depository', subtype: 'checking', current: 67890.00, available: 67890.00, mask: '3345', currency: 'USD' },
      { id: 'acc_007', name: 'Business Market Rate Savings', type: 'depository', subtype: 'savings', current: 125000.00, available: 125000.00, mask: '7721', currency: 'USD', interestEarned: 1875.25 },
      { id: 'acc_008', name: 'Business Line of Credit', type: 'credit', subtype: 'line of credit', current: -15000.00, available: 35000.00, mask: '5567', currency: 'USD' },
    ],
  },
  {
    institution_id: 'ins_fidelity',
    institution_name: 'Fidelity Investments',
    item_id: 'item_005',
    accounts: [
      { id: 'acc_009', name: 'Rollover IRA', type: 'investment', subtype: 'ira', current: 156000.00, available: 156000.00, mask: '4432', currency: 'USD', contributions: 6500.00 },
    ],
  },
];

// Tax-categorized transaction data for a full year
export const transactionData = {
  // Income transactions
  income: {
    wages: [
      { id: 'inc_001', date: '2024-01-15', source: 'Acme Corp', description: 'Payroll Direct Deposit', amount: 4500.00, frequency: 'bi-weekly' },
      { id: 'inc_002', date: '2024-01-31', source: 'Acme Corp', description: 'Payroll Direct Deposit', amount: 4500.00, frequency: 'bi-weekly' },
      // ... (simulated full year = 26 pay periods)
    ],
    freelance: [
      { id: 'inc_010', date: '2024-02-15', source: 'Tech Startup Inc', description: 'Consulting Invoice #1042', amount: 3500.00 },
      { id: 'inc_011', date: '2024-04-20', source: 'Marketing Agency LLC', description: 'Design Services', amount: 2750.00 },
      { id: 'inc_012', date: '2024-06-10', source: 'Tech Startup Inc', description: 'Consulting Invoice #1089', amount: 4200.00 },
      { id: 'inc_013', date: '2024-08-22', source: 'Local Business', description: 'Website Development', amount: 5500.00 },
      { id: 'inc_014', date: '2024-10-05', source: 'Tech Startup Inc', description: 'Consulting Invoice #1156', amount: 3800.00 },
      { id: 'inc_015', date: '2024-12-12', source: 'Marketing Agency LLC', description: 'Year-end Project', amount: 6000.00 },
    ],
    interest: [
      { id: 'inc_020', date: '2024-03-31', source: 'Chase Bank', description: 'Q1 Interest', amount: 85.50, accountId: 'acc_002' },
      { id: 'inc_021', date: '2024-06-30', source: 'Chase Bank', description: 'Q2 Interest', amount: 92.25, accountId: 'acc_002' },
      { id: 'inc_022', date: '2024-09-30', source: 'Chase Bank', description: 'Q3 Interest', amount: 88.50, accountId: 'acc_002' },
      { id: 'inc_023', date: '2024-12-31', source: 'Chase Bank', description: 'Q4 Interest', amount: 76.25, accountId: 'acc_002' },
      { id: 'inc_024', date: '2024-03-31', source: 'Wells Fargo', description: 'Q1 Interest', amount: 456.25, accountId: 'acc_007' },
      { id: 'inc_025', date: '2024-06-30', source: 'Wells Fargo', description: 'Q2 Interest', amount: 478.50, accountId: 'acc_007' },
      { id: 'inc_026', date: '2024-09-30', source: 'Wells Fargo', description: 'Q3 Interest', amount: 465.75, accountId: 'acc_007' },
      { id: 'inc_027', date: '2024-12-31', source: 'Wells Fargo', description: 'Q4 Interest', amount: 474.75, accountId: 'acc_007' },
    ],
    dividends: [
      { id: 'inc_030', date: '2024-03-15', source: 'Bank of America Investments', description: 'Q1 Dividends', amount: 585.00, accountId: 'acc_010', qualified: true },
      { id: 'inc_031', date: '2024-06-15', source: 'Bank of America Investments', description: 'Q2 Dividends', amount: 612.00, accountId: 'acc_010', qualified: true },
      { id: 'inc_032', date: '2024-09-15', source: 'Bank of America Investments', description: 'Q3 Dividends', amount: 578.00, accountId: 'acc_010', qualified: true },
      { id: 'inc_033', date: '2024-12-15', source: 'Bank of America Investments', description: 'Q4 Dividends', amount: 565.00, accountId: 'acc_010', qualified: true },
    ],
  },

  // Deductible expenses
  deductions: {
    charitable: [
      { id: 'ded_001', date: '2024-02-14', recipient: 'American Red Cross', amount: 250.00, cashOrProperty: 'cash' },
      { id: 'ded_002', date: '2024-04-22', recipient: 'Local Food Bank', amount: 150.00, cashOrProperty: 'cash' },
      { id: 'ded_003', date: '2024-06-15', recipient: 'Habitat for Humanity', amount: 500.00, cashOrProperty: 'cash' },
      { id: 'ded_004', date: '2024-09-10', recipient: 'United Way', amount: 300.00, cashOrProperty: 'cash' },
      { id: 'ded_005', date: '2024-11-25', recipient: 'Goodwill Industries', amount: 800.00, cashOrProperty: 'property' },
      { id: 'ded_006', date: '2024-12-20', recipient: 'St. Jude Children\'s Hospital', amount: 1000.00, cashOrProperty: 'cash' },
    ],
    medical: [
      { id: 'ded_010', date: '2024-01-15', provider: 'CVS Pharmacy', description: 'Prescription', amount: 45.00 },
      { id: 'ded_011', date: '2024-02-20', provider: 'Dr. Smith Office', description: 'Co-pay', amount: 30.00 },
      { id: 'ded_012', date: '2024-03-10', provider: 'Vision Center', description: 'Eye Exam', amount: 150.00 },
      { id: 'ded_013', date: '2024-04-05', provider: 'Dental Associates', description: 'Cleaning', amount: 200.00 },
      { id: 'ded_014', date: '2024-06-18', provider: 'Quest Diagnostics', description: 'Lab Work', amount: 85.00 },
      { id: 'ded_015', date: '2024-08-22', provider: 'Physical Therapy', description: 'PT Session', amount: 120.00 },
      { id: 'ded_016', date: '2024-10-30', provider: 'CVS Pharmacy', description: 'Prescriptions', amount: 78.00 },
      { id: 'ded_017', date: '2024-12-05', provider: 'Urgent Care', description: 'Visit', amount: 175.00 },
    ],
    mortgage: {
      lender: 'Wells Fargo Home Mortgage',
      propertyAddress: '123 Main Street, Anytown, USA',
      totalInterest: 12450.00,
      totalPropertyTax: 4800.00,
      totalPMI: 1200.00,
    },
    studentLoans: {
      servicer: 'Navient',
      totalInterest: 1850.00,
    },
  },

  // Business expenses (for Schedule C)
  business: {
    advertising: [
      { id: 'bus_001', date: '2024-01-10', vendor: 'Google Ads', amount: 250.00 },
      { id: 'bus_002', date: '2024-02-15', vendor: 'Facebook Ads', amount: 180.00 },
      { id: 'bus_003', date: '2024-04-20', vendor: 'LinkedIn Premium', amount: 59.99 },
      { id: 'bus_004', date: '2024-06-01', vendor: 'Business Cards', amount: 75.00 },
      { id: 'bus_005', date: '2024-09-15', vendor: 'Google Ads', amount: 300.00 },
      { id: 'bus_006', date: '2024-11-20', vendor: 'Facebook Ads', amount: 220.00 },
    ],
    officeSupplies: [
      { id: 'bus_010', date: '2024-01-05', vendor: 'Staples', amount: 125.00 },
      { id: 'bus_011', date: '2024-03-12', vendor: 'Amazon', amount: 89.50 },
      { id: 'bus_012', date: '2024-05-22', vendor: 'Office Depot', amount: 156.00 },
      { id: 'bus_013', date: '2024-08-08', vendor: 'Staples', amount: 78.25 },
      { id: 'bus_014', date: '2024-10-15', vendor: 'Amazon', amount: 134.00 },
    ],
    software: [
      { id: 'bus_020', date: '2024-01-01', vendor: 'Adobe Creative Cloud', amount: 599.88, annual: true },
      { id: 'bus_021', date: '2024-01-01', vendor: 'Microsoft 365', amount: 99.99, annual: true },
      { id: 'bus_022', date: '2024-01-01', vendor: 'QuickBooks', amount: 299.00, annual: true },
      { id: 'bus_023', date: '2024-06-15', vendor: 'Zoom Pro', amount: 149.90, annual: true },
    ],
    travel: [
      { id: 'bus_030', date: '2024-03-15', vendor: 'Delta Airlines', description: 'Client Meeting - NYC', amount: 425.00 },
      { id: 'bus_031', date: '2024-03-15', vendor: 'Marriott', description: 'Hotel - NYC', amount: 378.00 },
      { id: 'bus_032', date: '2024-07-20', vendor: 'United Airlines', description: 'Conference - Chicago', amount: 312.00 },
      { id: 'bus_033', date: '2024-07-20', vendor: 'Hilton', description: 'Hotel - Chicago', amount: 456.00 },
      { id: 'bus_034', date: '2024-10-10', vendor: 'Southwest', description: 'Client Visit - Denver', amount: 289.00 },
    ],
    meals: [
      { id: 'bus_040', date: '2024-02-10', vendor: 'Restaurant', description: 'Client Lunch', amount: 85.00 },
      { id: 'bus_041', date: '2024-04-18', vendor: 'Restaurant', description: 'Business Dinner', amount: 142.00 },
      { id: 'bus_042', date: '2024-06-25', vendor: 'Restaurant', description: 'Team Meeting', amount: 95.00 },
      { id: 'bus_043', date: '2024-09-12', vendor: 'Restaurant', description: 'Client Meeting', amount: 78.00 },
      { id: 'bus_044', date: '2024-11-30', vendor: 'Restaurant', description: 'Year-end Client', amount: 165.00 },
    ],
    homeOffice: {
      totalSquareFeet: 2000,
      officeSquareFeet: 250,
      annualRent: 0, // owned
      annualMortgageInterest: 8500.00,
      annualUtilities: 3600.00,
      annualInsurance: 1800.00,
      annualRepairs: 450.00,
    },
    mileage: [
      { id: 'mil_001', date: '2024-01-15', purpose: 'Client Meeting', miles: 45 },
      { id: 'mil_002', date: '2024-02-20', purpose: 'Supplies Pickup', miles: 12 },
      { id: 'mil_003', date: '2024-03-10', purpose: 'Networking Event', miles: 28 },
      { id: 'mil_004', date: '2024-04-05', purpose: 'Client Site Visit', miles: 67 },
      { id: 'mil_005', date: '2024-05-18', purpose: 'Conference', miles: 85 },
      { id: 'mil_006', date: '2024-06-22', purpose: 'Client Meeting', miles: 34 },
      { id: 'mil_007', date: '2024-07-30', purpose: 'Business Errand', miles: 18 },
      { id: 'mil_008', date: '2024-08-15', purpose: 'Client Presentation', miles: 52 },
      { id: 'mil_009', date: '2024-09-25', purpose: 'Networking Event', miles: 41 },
      { id: 'mil_010', date: '2024-10-08', purpose: 'Client Site Visit', miles: 73 },
      { id: 'mil_011', date: '2024-11-12', purpose: 'Supplies Pickup', miles: 15 },
      { id: 'mil_012', date: '2024-12-05', purpose: 'Year-end Meeting', miles: 38 },
    ],
  },

  // Estimated tax payments made
  estimatedPayments: [
    { id: 'est_001', date: '2024-04-15', amount: 3500.00, quarter: 'Q1' },
    { id: 'est_002', date: '2024-06-15', amount: 3500.00, quarter: 'Q2' },
    { id: 'est_003', date: '2024-09-15', amount: 3500.00, quarter: 'Q3' },
    { id: 'est_004', date: '2024-01-15', amount: 3500.00, quarter: 'Q4' },
  ],
};

// Helper functions to calculate tax document values
export function calculateTaxSummary(year = '2024') {
  const data = transactionData;

  // Income totals
  const wagesTotal = 4500 * 26; // bi-weekly for year
  const freelanceTotal = data.income.freelance.reduce((sum, t) => sum + t.amount, 0);
  const interestTotal = data.income.interest.reduce((sum, t) => sum + t.amount, 0);
  const dividendsTotal = data.income.dividends.reduce((sum, t) => sum + t.amount, 0);

  // Deduction totals
  const charitableTotal = data.deductions.charitable.reduce((sum, t) => sum + t.amount, 0);
  const medicalTotal = data.deductions.medical.reduce((sum, t) => sum + t.amount, 0);
  const mortgageInterest = data.deductions.mortgage.totalInterest;
  const studentLoanInterest = data.deductions.studentLoans.totalInterest;

  // Business expense totals
  const advertisingTotal = data.business.advertising.reduce((sum, t) => sum + t.amount, 0);
  const suppliesTotal = data.business.officeSupplies.reduce((sum, t) => sum + t.amount, 0);
  const softwareTotal = data.business.software.reduce((sum, t) => sum + t.amount, 0);
  const travelTotal = data.business.travel.reduce((sum, t) => sum + t.amount, 0);
  const mealsTotal = data.business.meals.reduce((sum, t) => sum + t.amount, 0) * 0.5; // 50% deductible
  const mileageTotal = data.business.mileage.reduce((sum, t) => sum + t.miles, 0) * 0.67; // 2024 rate

  // Home office calculation
  const homeOffice = data.business.homeOffice;
  const homeOfficePercent = homeOffice.officeSquareFeet / homeOffice.totalSquareFeet;
  const homeOfficeDeduction = (
    homeOffice.annualMortgageInterest +
    homeOffice.annualUtilities +
    homeOffice.annualInsurance +
    homeOffice.annualRepairs
  ) * homeOfficePercent;

  const totalBusinessExpenses = advertisingTotal + suppliesTotal + softwareTotal +
    travelTotal + mealsTotal + mileageTotal + homeOfficeDeduction;

  // Estimated payments
  const estimatedPaymentsTotal = data.estimatedPayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    income: {
      wages: wagesTotal,
      freelance: freelanceTotal,
      interest: interestTotal,
      dividends: dividendsTotal,
      totalIncome: wagesTotal + freelanceTotal + interestTotal + dividendsTotal,
    },
    deductions: {
      charitable: charitableTotal,
      medical: medicalTotal,
      mortgageInterest,
      studentLoanInterest,
      totalItemized: charitableTotal + medicalTotal + mortgageInterest + studentLoanInterest,
    },
    business: {
      grossIncome: freelanceTotal,
      advertising: advertisingTotal,
      supplies: suppliesTotal,
      software: softwareTotal,
      travel: travelTotal,
      meals: mealsTotal,
      mileage: mileageTotal,
      homeOffice: homeOfficeDeduction,
      totalExpenses: totalBusinessExpenses,
      netProfit: freelanceTotal - totalBusinessExpenses,
    },
    estimatedPayments: estimatedPaymentsTotal,
    year,
  };
}

// Get all accounts flattened
export function getAllAccounts() {
  return accountData.flatMap(inst =>
    inst.accounts.map(acc => ({
      ...acc,
      institution: inst.institution_name,
      institutionId: inst.institution_id,
    }))
  );
}

// Get accounts by type
export function getAccountsByType(type) {
  return getAllAccounts().filter(acc => acc.type === type);
}

// Check if user has connected accounts
export function hasConnectedAccounts() {
  return accountData.length > 0;
}

// Get institution count
export function getInstitutionCount() {
  return accountData.length;
}

// Get total account balances
export function getTotalBalances() {
  const accounts = getAllAccounts();
  const assets = accounts.filter(a => a.current > 0).reduce((sum, a) => sum + a.current, 0);
  const liabilities = accounts.filter(a => a.current < 0).reduce((sum, a) => sum + Math.abs(a.current), 0);
  return { assets, liabilities, netWorth: assets - liabilities };
}
