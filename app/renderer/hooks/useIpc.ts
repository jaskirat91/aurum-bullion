import { useState, useCallback } from 'react';

export type IpcStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseIpcState<T> {
  data: T | null;
  status: IpcStatus;
  error: string | null;
  execute: (...args: unknown[]) => Promise<void>;
  reset: () => void;
}

/**
 * Generic hook for calling Electron IPC handlers.
 *
 * @param fn   - An async function that calls window.electronAPI.*(...)
 * @param onSuccess - Optional callback when the call succeeds
 *
 * Usage:
 * ```tsx
 * const { data, status, error, execute } = useIpc(
 *   (dto) => window.electronAPI.receiveRawMaterial(dto),
 *   () => toast('Saved!'),
 * );
 * ```
 */
export function useIpc<T = void>(
  fn: (...args: unknown[]) => Promise<{ success: boolean; data?: T; error?: string }>,
  onSuccess?: (data: T | undefined) => void,
): UseIpcState<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<IpcStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]) => {
      setStatus('loading');
      setError(null);
      try {
        const result = await fn(...args);
        if (result.success) {
          setData(result.data ?? null);
          setStatus('success');
          onSuccess?.(result.data);
        } else {
          setError(result.error ?? 'Unknown error');
          setStatus('error');
        }
      } catch (err) {
        setError(String(err));
        setStatus('error');
      }
    },
    [fn, onSuccess],
  );

  const reset = useCallback(() => {
    setData(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { data, status, error, execute, reset };
}

/**
 * Simplified boolean loading helper.
 */
export function isLoading(status: IpcStatus): boolean {
  return status === 'loading';
}
