import { describe, expect, it, vi } from 'vitest';
import type { Company } from '@/domain/entities/Company';
import type { CompanyRepository } from '@/domain/repositories/CompanyRepository';
import { makeChangeCompanyStatus } from './changeCompanyStatus';

const company: Company = {
  id: 'c1',
  name: 'شركة',
  phone: null,
  status: 'pending',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('changeCompanyStatus', () => {
  it('sends the new status for the company', async () => {
    const repo = { list: vi.fn(), changeStatus: vi.fn().mockResolvedValue(company) };
    await makeChangeCompanyStatus(repo as CompanyRepository)(company, 'approved');
    expect(repo.changeStatus).toHaveBeenCalledWith('c1', 'approved');
  });

  it('refuses a status the company already has', () => {
    const repo = { list: vi.fn(), changeStatus: vi.fn() };
    expect(() => makeChangeCompanyStatus(repo as CompanyRepository)(company, 'pending')).toThrow();
    expect(repo.changeStatus).not.toHaveBeenCalled();
  });
});
