import type { JSX, ReactNode } from 'react';
import { Card } from '@/presentation/components/ui/Card';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { ErrorState } from '@/presentation/components/ui/ErrorState';
import { Spinner } from '@/presentation/components/ui/Spinner';

interface ListStateProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyTitle: string;
  onRetry: () => void;
  children: ReactNode;
}

/** The shared loading, error and empty states of the admin lists. */
export function ListState({
  loading,
  error,
  isEmpty,
  emptyTitle,
  onRetry,
  children,
}: ListStateProps): JSX.Element {
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty) {
    return (
      <Card>
        <EmptyState title={emptyTitle} />
      </Card>
    );
  }
  return <>{children}</>;
}
