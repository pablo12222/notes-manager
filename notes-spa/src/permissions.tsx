import { type ReactNode, useEffect, useState } from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";

/** Dekodowanie payloadu JWT (UI-only) */
function parseJwt(token: string): any {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

/** Hook: czy token zawiera wymagane uprawnienie (permission) */
export function useHasPermission(required: string) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isAuthenticated) {
        alive && setAllowed(false);
        return;
      }
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
        });
        const payload = parseJwt(token);
        const perms: string[] = payload?.permissions || [];
        alive && setAllowed(perms.includes(required));
      } catch {
        alive && setAllowed(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, getAccessTokenSilently, required]);

  return allowed; // null = sprawdzanie, true/false = wynik
}

/** Wrapper sekcji/trasy — blokada gdy brak permission */
export function RequirePermission({
  perm,
  children,
  redirectTo = "/",
}: {
  perm: string;
  children: ReactNode;
  redirectTo?: string;
}) {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const allowed = useHasPermission(perm);

  if (!isAuthenticated) {
    loginWithRedirect();
    return null;
  }
  if (allowed === null) return <div>Sprawdzam uprawnienia…</div>;
  if (allowed === false) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}

/** Wrapper do tras wymagających logowania (bez dodatkowych perm) */
export const RequireAuth = (Component: React.ComponentType) =>
  withAuthenticationRequired(Component);
