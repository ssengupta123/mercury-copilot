import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useCallback, useRef } from "react";

interface AuthUser {
  name: string;
  email: string;
}

interface AuthState {
  authenticated: boolean;
  user?: AuthUser;
  ssoEnabled: boolean;
}

export function useAuth() {
  const { data, isLoading } = useQuery<AuthState>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const login = useCallback(() => {
    const isInIframe = window.self !== window.top;

    if (isInIframe) {
      const popup = window.open("/api/auth/login?popup=true", "mercury-sso", "width=500,height=700,popup=yes");

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        if (popup?.closed) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        }
      }, 500);
    } else {
      window.location.href = "/api/auth/login";
    }
  }, []);

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/";
    },
  });

  return {
    user: data?.user,
    isAuthenticated: data?.authenticated ?? false,
    ssoEnabled: data?.ssoEnabled ?? false,
    isLoading,
    login,
    logout: () => logout.mutate(),
  };
}
