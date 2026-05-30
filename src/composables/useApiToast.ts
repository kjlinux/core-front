import { useToast } from './useToast';
import { i18n } from '@/plugins/i18n';
import { extractApiErrorMessage } from '@/utils/api-error';

interface RunOptions {
  success?: string;
  error?: string;
  silent?: boolean;
}

function extractMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  // Délègue au helper partagé (gère le flattening des 422 et la garde Blob).
  return extractApiErrorMessage(err, fallback);
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
        toast.error(extractMessage(err, opts.error || i18n.global.t('common.genericError')));
      }
      return undefined;
    }
  }

  function toastError(err: unknown, fallback = i18n.global.t('common.genericError')) {
    toast.error(extractMessage(err, fallback));
  }

  return { runWithToast, toastError, toast };
}
