import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import AppBackground from "./AppBackground";
import { useHasPermission } from "../permissions";

export default function Shell() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

  const canSeeAdmin = useHasPermission("read:admin-secret");

  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add("dark"); localStorage.setItem("theme", "dark"); }
    else { root.classList.remove("dark"); localStorage.setItem("theme", "light"); }
  }, [dark]);

  return (
    <div className="app-root">
      <AppBackground />
      <header className="app-header">
        <div className="container header-inner">
          <a href="/" className="brand">Notes Manager</a>
          <nav className="nav">
            <NavLink to="/" className="nav-link">Start</NavLink>
            <NavLink to="/notes" className="nav-link">Notatki</NavLink>
            <NavLink to="/board" className="nav-link">Tablica</NavLink>
            <NavLink to="/profile" className="nav-link">Profil</NavLink>

            {canSeeAdmin === true && (
              <NavLink to="/admin" className="nav-link">Admin</NavLink>
            )}

            <button
              onClick={() => setDark(v => !v)}
              className="btn-ghost"
              title="Przełącz motyw"
            >
              {dark ? "☀️" : "🌙"}
            </button>

            {isAuthenticated ? (
              <button
                className="btn-primary"
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
              >
                Wyloguj
              </button>
            ) : (
              <button className="btn-primary" onClick={() => loginWithRedirect()}>
                Zaloguj
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="container main-content">
        <Outlet />
      </main>
    </div>
  );
}
