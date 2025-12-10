
export enum Status {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  WAITING = 'WAITING'
}

export interface Order {
  id: string;
  orderNumber: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: Status;
  icon?: string;
  requester?: string; // e.g., 1st Company
}

export type ExpenseType = 'PURCHASE' | 'VOUCHER';
export type Currency = 'YER' | 'SAR';
export type VoucherSubCategory = 'EXPENSE' | 'LOAN'; // New type

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Expense {
  id: string;
  type: ExpenseType; // New field to distinguish Purchase vs Voucher
  currency: Currency; // Added Currency
  amount: number;
  
  // Legacy single item fields (kept for backward compatibility)
  itemName?: string; 
  quantity?: number; 
  unitPrice?: number; 
  
  // New multiple items support
  items?: InvoiceItem[];

  category: string; 
  beneficiary: string;
  date: string;
  notes?: string;
  documentNumber?: string; // Voucher or Invoice Number
  receiptImage?: string; // Base64 string of the uploaded receipt
  employeeName?: string; // New field: Employee Name
  department?: string;   // New field: Department
  
  // New field for Voucher Type (Expense vs Loan)
  voucherSubCategory?: VoucherSubCategory; 
}

export interface FundTransaction {
  id: string;
  currency: Currency; // Added Currency
  amount: number;
  source: string;
  date: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: 'critical' | 'low' | 'good';
  lastUpdated: string;
  category: string;
  location?: string;
}

export interface AppSettings {
  ministryName: string;
  brigadeName: string;
  unitName: string;
  logo?: string; // Base64 image
  footerRightTitle: string; // e.g. "المستلم"
  footerCenterTitle: string; // e.g. "أمين الصندوق"
  footerLeftTitle: string; // e.g. "قائد اللواء"
  currencySymbolYER?: string;
  currencySymbolSAR?: string;
  defaultReportPeriod?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
}

export type ViewState = 'DASHBOARD' | 'PROCUREMENT' | 'INVENTORY' | 'FINANCE' | 'ADD_EXPENSE' | 'ADD_FUND' | 'SETTINGS';
