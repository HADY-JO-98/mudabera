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

/** Trigger a budget plan recalculation — backend reads all data from DB, no body needed */
export const useCreateBudgetPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => budgetApi.createPlan(),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGET_KEY }),
  });
};

/** Triggers a backend recalculation — backend owns all data, no body is sent.
 *  The allocations param is accepted for call-site compatibility but is not forwarded. */
export const useSaveBudgetAllocations = () => {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: (_?: { planId?: number; allocations?: BudgetAllocationItem[] }) =>
      budgetApi.createPlan(),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGET_KEY }),
  });
};
