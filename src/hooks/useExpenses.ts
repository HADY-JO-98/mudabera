import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../services/apiClient';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface ExpensePage {
  items: Expense[];
  total: number;
  page: number;
  pageSize: number;
}

const toExpenseList = (data: unknown): Expense[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as Expense[];
  return ((data as ExpensePage).items ?? []) as Expense[];
};

export const EXPENSES_KEY = ['expenses'] as const;

/** Fetch all expenses (up to 500) — used by Dashboard and Analytics */
export const useExpenses = () =>
  useQuery({
    queryKey: EXPENSES_KEY,
    queryFn: async () => {
      const res = await expenseApi.getAll(1, 500);
      if (!res.ok) throw new Error(res.error ?? 'Failed to fetch expenses');
      return toExpenseList(res.data);
    },
    staleTime: 1000 * 60 * 2, // 2 min
  });

/** Fetch paginated expenses — used by ExpenseTracker */
export const useExpensesPage = (page = 1, pageSize = 10) =>
  useQuery({
    queryKey: [...EXPENSES_KEY, page, pageSize],
    queryFn: async () => {
      const res = await expenseApi.getAll(page, pageSize);
      if (!res.ok) throw new Error(res.error ?? 'Failed to fetch expenses');
      return {
        items: toExpenseList(res.data),
        total: (res.data as ExpensePage)?.total ?? 0,
      };
    },
    staleTime: 1000 * 60,
  });

/** Create a new expense */
export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Expense, 'id'>) => expenseApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSES_KEY }),
  });
};

/** Update an expense */
export const useUpdateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Expense, 'id'>> }) =>
      expenseApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSES_KEY }),
  });
};

/** Delete an expense */
export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => expenseApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSES_KEY }),
  });
};
