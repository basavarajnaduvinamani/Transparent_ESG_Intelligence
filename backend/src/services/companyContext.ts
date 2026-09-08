import type { DataStore } from '../dataStore.js';
import type { CompanyRecord } from '../types.js';

export class CompanyRequiredError extends Error {
  readonly status = 400;

  constructor() {
    super('Select a company from the dropdown before asking questions.');
    this.name = 'CompanyRequiredError';
  }
}

export class InvalidCompanyError extends Error {
  readonly status = 400;

  constructor(name: string) {
    super(`"${name}" is not in the FTSE100 March 2025 workbook.`);
    this.name = 'InvalidCompanyError';
  }
}

export function requireCompany(
  store: DataStore,
  companyName?: string | null,
): CompanyRecord {
  const trimmed = companyName?.trim();
  if (!trimmed) {
    throw new CompanyRequiredError();
  }

  const company = store.findCompany(trimmed);
  if (!company || !store.hasPeerData(company.name)) {
    throw new InvalidCompanyError(trimmed);
  }

  return company;
}

export function shortCompanyLabel(name: string): string {
  return name.replace(/\s+plc$/i, '').replace(/\s+Group plc$/i, ' Group');
}
