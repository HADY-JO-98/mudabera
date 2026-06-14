// Base URL for the .NET backend API
// Supports VITE_API_URL or VITE_API_BASE_URL with auto-fallbacks for local vs production
let rawBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://modaber.runasp.net' : '');

if (rawBaseUrl.endsWith('/')) {
  rawBaseUrl = rawBaseUrl.slice(0, -1);
}

if (rawBaseUrl.endsWith('/api')) {
  rawBaseUrl = rawBaseUrl.slice(0, -4);
}

const API_BASE_URL = rawBaseUrl;

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  ok: boolean;
}

// ─── Auth token management ─────────────────────────────────────────────────────
let authToken: string | null = localStorage.getItem('modaber_auth_token');
let refreshToken: string | null = localStorage.getItem('modaber_refresh_token');
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export const setAuthToken = (token: string | null, refresh?: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('modaber_auth_token', token);
  } else {
    localStorage.removeItem('modaber_auth_token');
  }
  if (refresh !== undefined) {
    refreshToken = refresh;
    if (refresh) {
      localStorage.setItem('modaber_refresh_token', refresh);
    } else {
      localStorage.removeItem('modaber_refresh_token');
    }
  }
};

export const getAuthHeaders = (): Record<string, string> => {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
};

// Drain any queued requests after a token refresh attempt
const drainRefreshQueue = (newToken: string | null) => {
  refreshQueue.forEach(cb => cb(newToken));
  refreshQueue = [];
};

// Attempt a silent token refresh; returns new access token or null
const attemptRefresh = async (): Promise<string | null> => {
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/Auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const newAccess: string | null = data?.token ?? data?.accessToken ?? null;
    const newRefresh: string | null = data?.refreshToken ?? refreshToken;
    if (newAccess) setAuthToken(newAccess, newRefresh);
    return newAccess;
  } catch {
    return null;
  }
};

// ─── Core request function ─────────────────────────────────────────────────────
async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15 s timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    clearTimeout(timeout);

    // 204 No Content — success with no body
    if (response.status === 204) {
      return { data: null as T, error: null, ok: true };
    }

    // 401 Unauthorized — try a silent token refresh once
    if (response.status === 401 && retry && refreshToken) {
      if (isRefreshing) {
        // Another refresh is in-flight; wait for it
        const newToken = await new Promise<string | null>(resolve =>
          refreshQueue.push(resolve)
        );
        if (!newToken) return { data: null, error: 'Session expired', ok: false };
        // Retry with the new token
        const retryHeaders = { ...(options.headers as Record<string, string>), Authorization: `Bearer ${newToken}` };
        return request<T>(endpoint, { ...options, headers: retryHeaders }, false);
      }

      isRefreshing = true;
      const newToken = await attemptRefresh();
      isRefreshing = false;
      drainRefreshQueue(newToken);

      if (newToken) {
        const retryHeaders = { ...(options.headers as Record<string, string>), Authorization: `Bearer ${newToken}` };
        return request<T>(endpoint, { ...options, headers: retryHeaders }, false);
      }
      // Refresh failed — clear tokens so the app shows the login screen
      setAuthToken(null, null);
      return { data: null, error: 'Session expired. Please log in again.', ok: false };
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint} returned status ${response.status}:`, data);
      return {
        data: null,
        error: data?.message || data?.title || `Error ${response.status}`,
        ok: false,
      };
    }

    return { data, error: null, ok: true };
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { data: null, error: 'Request timed out. Please try again.', ok: false };
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Network error — تأكد إن السيرفر شغال',
      ok: false,
    };
  }
}

// ─── Base client ───────────────────────────────────────────────────────────────
export const apiClient = {
  get<T = unknown>(endpoint: string, headers?: Record<string, string>) {
    return request<T>(endpoint, { method: 'GET', headers });
  },
  post<T = unknown>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  },
  put<T = unknown>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  },
  delete<T = unknown>(endpoint: string, headers?: Record<string, string>) {
    return request<T>(endpoint, { method: 'DELETE', headers });
  },
};

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  register(data: { name: string; email: string; password: string }) {
    return apiClient.post('/api/Auth/register', data);
  },
  verifyEmail(data: { email: string; otp: string }) {
    return apiClient.post('/api/Auth/verify-email', data);
  },
  login(data: { email: string; password: string }) {
    return apiClient.post('/api/Auth/login', data);
  },
  // Google / Apple OAuth — pass the provider token from the SDK
  loginWithGoogle(data: { idToken: string }) {
    return apiClient.post('/api/Auth/google', data);
  },
  loginWithApple(data: { idToken: string; firstName?: string; lastName?: string }) {
    return apiClient.post('/api/Auth/apple', data);
  },
  validateToken() {
    return apiClient.get('/api/Auth/validate-token', getAuthHeaders());
  },
  refreshToken() {
    // Backend RefreshRequestDto expects { token: string }
    return apiClient.post('/api/Auth/refresh-token', { token: refreshToken });
  },
  forgotPassword(data: { email: string }) {
    return apiClient.post('/api/Auth/forgot-password', data);
  },
  verifyResetOtp(data: { email: string; otp: string }) {
    return apiClient.post('/api/Auth/verify-reset-otp', data);
  },
  resetPassword(data: { email: string; token: string; newPassword: string }) {
    return apiClient.post('/api/Auth/reset-password', data);
  },
};

// ─── Alert API ─────────────────────────────────────────────────────────────────
export const alertApi = {
  getAll(lang?: string) {
    const query = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return apiClient.get(`/api/Alert${query}`, getAuthHeaders());
  },
  markRead(id: number) {
    return apiClient.put(`/api/Alert/${id}/mark-read`, undefined, getAuthHeaders());
  },
  delete(id: number) {
    return apiClient.delete(`/api/Alert/${id}`, getAuthHeaders());
  },
};

// ─── Budget API ────────────────────────────────────────────────────────────────
export const budgetApi = {
  createPlan() {
    // Per API contract: backend retrieves all data from DB itself — no body needed
    return apiClient.post('/api/Budget/plan', undefined, getAuthHeaders());
  },
  getPlan(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/api/Budget/plan${query}`, getAuthHeaders());
  },
  getOptimizationScore() {
    return apiClient.get('/api/Budget/optimization-score', getAuthHeaders());
  },
  reallocate(allocations: { category: string; amount: number; percentage: number }[]) {
    return apiClient.put('/api/Budget/reallocate', allocations, getAuthHeaders());
  },
};

// ─── Expense API ───────────────────────────────────────────────────────────────
export const expenseApi = {
  create(data: unknown) {
    return apiClient.post('/api/Expense', data, getAuthHeaders());
  },
  getAll(page = 1, pageSize = 10) {
    return apiClient.get(`/api/Expense?page=${page}&pageSize=${pageSize}`, getAuthHeaders());
  },
  update(id: number, data: unknown) {
    return apiClient.put(`/api/Expense/${id}`, data, getAuthHeaders());
  },
  delete(id: number) {
    return apiClient.delete(`/api/Expense/${id}`, getAuthHeaders());
  },
  getSummary() {
    return apiClient.get('/api/Expense/summary', getAuthHeaders());
  },
  getByDateRange(start: string, end: string) {
    return apiClient.get(
      `/api/Expense/date-range?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      getAuthHeaders(),
    );
  },
};

// ─── Insights API ──────────────────────────────────────────────────────────────
// NOTE: All Insights endpoints are POST on the backend (not GET)
export const insightsApi = {
  getStatus() {
    return apiClient.post('/api/Insights/status', undefined, getAuthHeaders());
  },
  getBasic() {
    return apiClient.post('/api/Insights/basic', undefined, getAuthHeaders());
  },
  evaluateAchievements() {
    return apiClient.post('/api/Insights/achievements/evaluate', undefined, getAuthHeaders());
  },
};

// ─── Investment API ────────────────────────────────────────────────────────────
export const investmentsApi = {
  getSuggestions(surplus?: number) {
    const query = surplus !== undefined ? `?surplus=${surplus}` : '';
    return apiClient.get(`/api/Investment/suggestions${query}`, getAuthHeaders());
  },
};

// ─── Prediction API ────────────────────────────────────────────────────────────
// Backend exposes:
//   GET /api/Prediction/latest          — most recent prediction set
//   GET /api/Prediction/{date}          — predictions for a specific date (YYYY-MM-DD)
export const predictionApi = {
  /** Fetch the latest price predictions with pagination support */
  getLatest(page = 1, perPage = 50, lang?: string) {
    const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
    if (lang) params.append('lang', lang);
    return apiClient.get(`/api/Prediction/latest?${params.toString()}`, getAuthHeaders());
  },
  /** Fetch predictions for a specific date, e.g. "2025-08-01" */
  getByDate(date: string, lang?: string) {
    const query = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return apiClient.get(`/api/Prediction/${encodeURIComponent(date)}${query}`, getAuthHeaders());
  },
};

// ─── SavedItems API ────────────────────────────────────────────────────────────
export const savedItemsApi = {
  getAll() {
    return apiClient.get('/api/SavedItems', getAuthHeaders());
  },
  add(data: unknown) {
    return apiClient.post('/api/SavedItems', data, getAuthHeaders());
  },
  remove(id: number) {
    return apiClient.delete(`/api/SavedItems/${id}`, getAuthHeaders());
  },
};

// ─── Shopping API ──────────────────────────────────────────────────────────────
export const shoppingApi = {
  getSmartList() {
    return apiClient.get('/api/Shopping/smart-list', getAuthHeaders());
  },
  generate() {
    return apiClient.post('/api/Shopping/smart-list/generate', {}, getAuthHeaders());
  },
  modify(data: unknown) {
    return apiClient.post('/api/Shopping/smart-list/modify', data, getAuthHeaders());
  },
  logPurchases(data: unknown) {
    return apiClient.post('/api/Shopping/smart-list/log-purchases', data, getAuthHeaders());
  },
};

// ─── User / Profile API ────────────────────────────────────────────────────────
export const profileApi = {
  get() {
    return apiClient.get('/api/User/profile', getAuthHeaders());
  },
  update(data: unknown) {
    return apiClient.put('/api/User/profile', data, getAuthHeaders());
  },
  delete() {
    return apiClient.delete('/api/User/profile', getAuthHeaders());
  },
};

// ─── Onboarding API ────────────────────────────────────────────────────────────
export const dataApi = {
  onboard(data: {
    monthlySalary: number;
    age: number;
    familyMembers: number;
    maritalStatus: string;
    livingCostLevel: string;
    incomeStability: string;
    fixedExpenses: {
      rent: number;
      electricity: number;
      water: number;
      gas: number;
      transportation: number;
      internet: number;
      mobile: number;
    };
    debts: {
      description: string;
      monthlyAmount: number;
      priority: string;
      dueDate: string;
    }[];
    annualExpenses: {
      description: string;
      totalAmount: number;
      priority: string;
      expectedMonth: string;
    }[];
    optionalExpenses: {
      streaming: number;
      education: number;
      medical: number;
    };
    preferences: {
      savingPriority: string;
      riskTolerance: string;
      emergencyFundPercentage: number;
      monthlyPriorities: string[];
    };
  }) {
    return apiClient.post('/api/User/onboarding', data, getAuthHeaders());
  },
};

// ─── Dashboard API ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary() {
    return apiClient.get('/api/User/dashboard', getAuthHeaders());
  },
};