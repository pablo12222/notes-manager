import { useAuth0 } from "@auth0/auth0-react";

export default function AuthButtons() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <div className="flex gap-2">
        <button className="btn" onClick={() => loginWithRedirect()}>
          Zaloguj
        </button>
        <button
          className="btn-secondary"
          onClick={() =>
            loginWithRedirect({
              authorizationParams: { screen_hint: "signup" }, 
            })
          }
        >
          Załóż konto
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn"
      onClick={() =>
        logout({ logoutParams: { returnTo: window.location.origin } })
      }
    >
      Wyloguj
    </button>
  );
}
