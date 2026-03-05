import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

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
    login: () => {
      window.location.href = "/api/auth/login";
    },
    logout: () => logout.mutate(),
  };
}
