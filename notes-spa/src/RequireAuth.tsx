import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const location = useLocation();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !redirectedRef.current) {
      redirectedRef.current = true; // zabezpieczenie przed podwójnym wywołaniem
      loginWithRedirect({
        appState: { returnTo: location.pathname + location.search },
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, location.pathname, location.search]);

  if (isLoading) {
    return <div className="card">Ładowanie autoryzacji…</div>;
  }
  if (!isAuthenticated) {
    return <div className="card">Przekierowywanie do logowania…</div>;
  }
  return <>{children}</>;
}
