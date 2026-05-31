import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '../services/apiClient';

export interface BudgetAllocationItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface BudgetPlan {
  id: number;
  month: number;
  year: number;
  allocations: BudgetAllocationItem[];
}

export const BUDGET_KEY = ['budget'] as const;

/** Fetch the current/latest budget plan */
export const useBudgetPlan = (month?: number, year?: number) =>
  useQuery({
    queryKey: [...BUDGET_KEY, month, year],
    queryFn: async () => {
      const res = await budgetApi.getPlan(month, year);
      if (!res.ok) return null;
      return res.data as BudgetPlan | null;
    },
    staleTime: 1000 * 60 * 5,
  });

/** Create or update a budget plan (backend uses createPlan for both) */
export const useCreateBudgetPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => budgetApi.createPlan(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGET_KEY }),
  });
};

/** Save allocations — wraps createPlan since the separate allocations endpoint
 *  is not available on the backend; the plan payload already includes allocations. */
export const useSaveBudgetAllocations = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ allocations }: { planId?: number; allocations: BudgetAllocationItem[] }) =>
      budgetApi.createPlan({ allocations }),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGET_KEY }),
  });
};
