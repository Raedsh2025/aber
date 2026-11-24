import type { Branch } from '@/domain/entities/Branch';

export const dateTimeFormatter = new Intl.DateTimeFormat('ar-SY-u-nu-latn', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const branchName = (branches: Branch[], id: string): string =>
  branches.find((b) => b.id === id)?.name ?? '...';
