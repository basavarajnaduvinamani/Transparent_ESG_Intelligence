const API_BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? res.statusText, res.status);
  }

  return res.json() as Promise<T>;
}

export interface HealthResponse {
  ok: boolean;
  gemini: boolean;
  dataset: {
    sourceFile: string;
    companyCount: number;
    snapshotLabel: string;
  };
}

export async function checkHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/health');
}

export interface CompanySummary {
  id: number;
  name: string;
  symbol: string;
  industry: string;
}

export interface CompaniesResponse {
  manifest: HealthResponse['dataset'];
  companies: CompanySummary[];
  sample: string[];
}

export async function fetchCompanies(q?: string): Promise<CompaniesResponse> {
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch<CompaniesResponse>(`/api/companies${query}`);
}

export interface CompanyDropdownOption {
  id: number;
  value: string;
  label: string;
  industry: string;
  symbol: string;
  description: string;
}

export interface CompanyDropdownResponse {
  total: number;
  snapshot: string;
  companies: CompanyDropdownOption[];
}

export async function fetchCompanyDropdown(): Promise<CompanyDropdownResponse> {
  return apiFetch<CompanyDropdownResponse>('/api/companies/dropdown');
}
