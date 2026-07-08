import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

interface ApiTokenResult {
  apiToken: string | undefined;
  apiUser: any;
  session: any;
  status: string;
  update: () => Promise<any>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook to manage API token across all pages
 * Handles token refresh and re-authentication automatically
 */
export function useApiToken(): ApiTokenResult {
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiToken = (session as any)?.apiToken as string | undefined;
  const apiUser = (session as any)?.apiUser;

  const refresh = useCallback(async () => {
    if (status !== 'authenticated') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Force session update to trigger token refresh
      await update();
    } catch (err: any) {
      setError(err.message || 'Failed to refresh token');
    } finally {
      setIsLoading(false);
    }
  }, [status, update]);

  useEffect(() => {
    // Auto sign out when session expires or becomes invalid
    if (status === 'authenticated' && !apiToken) {
      setError('Session expirée. Veuillez vous reconnecter avec Google.');
      signOut({ callbackUrl: '/connexion' });
    }
  }, [status, apiToken]);

  // Also check for 401 errors from API calls and sign out
  useEffect(() => {
    const handleUnauthorized = () => {
      if (status === 'authenticated') {
        signOut({ callbackUrl: '/connexion' });
      }
    };

    // Listen for 401 errors globally
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401 && status === 'authenticated') {
        handleUnauthorized();
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [status]);

  return {
    apiToken,
    apiUser,
    session,
    status,
    update,
    isLoading: status === 'loading' || isLoading,
    error,
    refresh,
  };
}
