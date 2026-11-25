import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAsyncAction } from './useAsyncAction';

/** Runs a create action, shows a success toast and then calls onDone (for example to reload a list). */
export function useSubmit<A extends unknown[], R>(
  action: (...args: A) => Promise<R>,
  successMessage: string,
  onDone: () => void,
) {
  const wrapped = useCallback(
    async (...args: A): Promise<R> => {
      const result = await action(...args);
      toast.success(successMessage);
      onDone();
      return result;
    },
    [action, successMessage, onDone],
  );
  return useAsyncAction(wrapped);
}
