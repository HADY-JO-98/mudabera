export type Language = 'en' | 'ar';
export type MaritalStatus = 'single' | 'married' | 'not_specified';
export type LivingCostLevel = 'High' | 'Medium' | 'Low';
export type IncomeStability = 'Full-time' | 'Freelance' | 'Seasonal' | 'Mixed';
export type SavingPreference = 'Low' | 'Medium' | 'High' | 'not_specified';
export type RiskTolerance = 'Low' | 'Medium' | 'High' | 'not_specified';

export interface Debt {
  id: string;
  description: string;
  monthlyAmount: number;
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
}

export interface AnnualExpense {
  id: string;
  description: string;
  totalAmount: number;
  priority: 'Low' | 'Medium' | 'High';
  expectedMonth?: string;
}

export interface UserAccount {
  name: string;
  email: string;
  avatar: string;
}

export interface UserProfile {
  account: UserAccount;
  monthlySalary: number;
  age?: number;
  familyMembers: number;
  maritalStatus: MaritalStatus;
  livingCostLevel: LivingCostLevel;
  incomeStability: IncomeStability;
  fixedExpenses: {
    rent: number;
    electricity: number;
    water: number;
    gas: number;
    transportation: number;
    internet: number;
    mobile: number;
  };
  debts: Debt[];
  annualExpenses: AnnualExpense[];
  optionalExpenses: {
    streaming: number;
    education: number;
    medical: number;
  };
  preferences: {
    savingPriority: SavingPreference;
    riskTolerance: RiskTolerance;
    emergencyFundPercentage: number;
    monthlyPriorities: string[];
  };
}

export interface BudgetAllocation {
  category: string;
  amount: number;
  percentage: number;
  advice?: string;
}

export interface PricePrediction {
  item: string;
  currentPrice: number;
  predictedPrice: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  advice: string;
}

export type ShoppingCategory = 'fruits' | 'vegetables' | 'meats' | 'fish' | 'dairy' | 'grains' | 'beverages' | 'snacks' | 'cleaning' | 'other';

export interface ShoppingItem {
  name: string;
  quantity: string;
  estimatedCost: number;
  isPriority: boolean;
  category?: ShoppingCategory;
}

export interface InvestmentOption {
  type: string;
  title: string;
  expectedReturn: string;
  riskLevel: string;
  description: string;
  safetyReason: string;
}