import { useToast } from './useToast';

interface RunOptions {
  success?: string;
  error?: string;
  silent?: boolean;
}

function extractMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return (
    e.response?.data?.message ||
    e.response?.data?.error ||
    e.message ||
    fallback
  );
}

export function useApiToast() {
  const toast = useToast();

  async function runWithToast<T>(fn: () => Promise<T>, opts: RunOptions = {}): Promise<T | undefined> {
    try {
      const result = await fn();
      if (opts.success) toast.success(opts.success);
      return result;
    } catch (err) {
      if (!opts.silent) {
        toast.error(extractMessage(err, opts.error || 'Une erreur est survenue'));
      }
      return undefined;
    }
  }

  function toastError(err: unknown, fallback = 'Une erreur est survenue') {
    toast.error(extractMessage(err, fallback));
  }

  return { runWithToast, toastError, toast };
}
