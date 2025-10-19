import { useEffect, useMemo, useRef, useState } from "react";
import { useApi, type RoleDto, type UserSummaryDto } from "../useApi";

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

type AsyncState = "idle" | "loading" | "submitting";

function dedupeRoles(list: RoleDto[]) {
  const key = (r: RoleDto) => (r.id ? `id:${r.id}` : `name:${(r.name || "").toLowerCase()}`);
  return Array.from(new Map(list.map((r) => [key(r), r])).values());
}

/* ---------- UI ---------- */
function Badge({
  tone = "gray",
  children,
}: {
  tone?: "green" | "red" | "gray" | "blue";
  children: React.ReactNode;
}) {
  const cls =
    tone === "green"
      ? "badge badge--green"
      : tone === "red"
      ? "badge badge--red"
      : tone === "blue"
      ? "badge badge--blue"
      : "badge";
  return <span className={cls}>{children}</span>;
}

/* =======================================================
   Admin
======================================================= */
export default function Admin() {
  const api = useApi();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 350);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState<UserSummaryDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);

  const [state, setState] = useState<AsyncState>("idle");
  const [err, setErr] = useState<string | null>(null);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const roleByName = useMemo(() => {
    const m = new Map<string, RoleDto>();
    for (const r of roles) m.set(r.name, r);
    return m;
  }, [roles]);

  const loadedRolesOnce = useRef(false);
  useEffect(() => {
    if (loadedRolesOnce.current) return;
    loadedRolesOnce.current = true;
    (async () => {
      try {
        const list = await api.getRoles();
        setRoles(dedupeRoles(list));
      } catch (e: any) {
        setErr(e?.message ?? "Błąd ładowania ról");
      }
    })();
  }, []);

  // UŻYTKOWNICY
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setState("loading");
      setErr(null);
      try {
        const res = await api.getUsers(
          debouncedQuery || undefined,
          page,
          pageSize,
          ctrl.signal
        );
        setUsers(res.items);
        setTotal(res.total);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Błąd ładowania");
      } finally {
        setState("idle");
      }
    })();
    return () => ctrl.abort();
  }, [debouncedQuery, page, pageSize]);

  const refresh = async () => {
    const res = await api.getUsers(debouncedQuery || undefined, page, pageSize);
    setUsers(res.items);
    setTotal(res.total);
  };

  const setSingleRole = async (u: UserSummaryDto, targetRoleId: string | null) => {
    setState("submitting");
    setErr(null);
    try {
      let currentRoleIds = u.roles
        .map((name) => roleByName.get(name)?.id)
        .filter(Boolean) as string[];

      if (currentRoleIds.length !== u.roles.length) {
        try {
          const fromApi = await api.getUserRoles(u.id);
          currentRoleIds = fromApi.map((r) => r.id).filter(Boolean) as string[];
        } catch {
       }
      }

      if (targetRoleId && currentRoleIds.length === 1 && currentRoleIds[0] === targetRoleId) {
        setState("idle");
        return;
      }

      await Promise.all(currentRoleIds.map((rid) => api.removeRole(u.id, rid)));

      if (targetRoleId) {
        await api.assignRoles(u.id, [targetRoleId]);
      }

      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Błąd zapisu roli");
    } finally {
      setState("idle");
    }
  };

  const toggleBlock = async (u: UserSummaryDto) => {
    setState("submitting");
    try {
      await api.blockUser(u.id, !u.blocked);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Błąd blokowania");
    } finally {
      setState("idle");
    }
  };

  const resetPassword = async (u: UserSummaryDto) => {
    setState("submitting");
    try {
      const { ticketUrl } = await api.resetPassword(u.id, window.location.origin);
      window.open(ticketUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setErr(e?.message ?? "Błąd generowania linku");
    } finally {
      setState("idle");
    }
  };

  const scopeHint =
    err?.includes("403") || err?.toLowerCase().includes("forbidden")
      ? "Brak uprawnień. Sprawdź permissions (read:users / update:users / create:user_tickets / read:roles / create:role_members / delete:role_members) oraz RBAC + 'Add Permissions in the Access Token'."
      : null;

  return (
    <div className="admin">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Panel administracyjny</h1>
          <p className="muted m0">Zarządzanie użytkownikami i rolami (Auth0).</p>
        </div>
        <div className="admin-stats">
          <Badge tone="blue">{total} wyników</Badge>
          {state !== "idle" && <Badge tone="gray">Przetwarzam…</Badge>}
        </div>
      </div>

      <div className="admin-toolbar">
        <input
          className="input admin-search"
          placeholder="Szukaj (email / query v3)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          onKeyDown={(e) => e.key === "Enter" && setPage(0)}
        />
        <div className="toolbar-actions">
          <button
            className="btn-secondary"
            onClick={() => {
              setQuery("");
              setPage(0);
            }}
            disabled={state !== "idle"}
            title="Wyczyść filtr"
          >
            Wyczyść
          </button>
          <button
            className="btn-primary"
            onClick={() => setPage(0)}
            disabled={state !== "idle"}
          >
            {state === "loading" ? "Ładowanie…" : "Szukaj"}
          </button>
        </div>
      </div>

      {!!err && (
        <div className="panel text-red-500" role="alert">
          <div>
            <strong>Błąd:</strong> {err}
          </div>
          {scopeHint && <div className="muted mt-1">{scopeHint}</div>}
        </div>
      )}

      <div className="panel p0">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ minWidth: 230 }}>ID</th>
                <th style={{ minWidth: 200 }}>Email</th>
                <th>Status</th>
                <th>Rola</th>
                <th style={{ width: 440 }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {state === "loading" && users.length === 0
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="skeleton-row">
                      <td colSpan={5}>
                        <div className="skeleton h-6 w-56" />
                      </td>
                    </tr>
                  ))
                : users.map((u) => {
                    const currentRoleId = (u.roles[0] && roleByName.get(u.roles[0])?.id) || "";

                    return (
                      <tr key={u.id}>
                        <td className="mono">{u.id}</td>
                        <td>{u.email ?? "—"}</td>
                        <td>
                          {u.blocked ? (
                            <Badge tone="red">zablokowany</Badge>
                          ) : (
                            <Badge tone="green">aktywny</Badge>
                          )}
                        </td>

                        <td>
                          {u.roles.length === 0 ? (
                            <span className="muted">brak</span>
                          ) : (
                            <span className="chip">{u.roles[0]}</span>
                          )}
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              className="btn-secondary"
                              disabled={state !== "idle"}
                              onClick={() => resetPassword(u)}
                              title="Wygeneruj link resetu hasła"
                            >
                              Reset hasła
                            </button>

                            <button
                              className="btn-secondary"
                              disabled={state !== "idle"}
                              onClick={() => toggleBlock(u)}
                            >
                              {u.blocked ? "Odblokuj" : "Zablokuj"}
                            </button>

                            <label className="muted text-xs">rola:</label>
                            <select
                              className="select"
                              disabled={state !== "idle"}
                              value={currentRoleId}
                              onChange={(e) => {
                                const newId = e.currentTarget.value;
                                setSingleRole(u, newId || null);
                              }}
                            >
                              <option value="">(brak)</option>
                              {roles.map((r) => (
                                <option key={r.id ?? r.name} value={r.id ?? ""}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

              {users.length === 0 && state !== "loading" && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-title">Brak danych</div>
                      <div className="muted">Zmień filtr albo odśwież listę.</div>
                      <div className="mt-2">
                        <button className="btn-primary" onClick={() => setPage(0)}>
                          Odśwież
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <button
          className="btn-secondary"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || state === "loading"}
        >
          ← Poprzednia
        </button>
        <div className="muted">
          Strona {page + 1} z {pages}
        </div>
        <button
          className="btn-secondary"
          onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          disabled={page >= pages - 1 || state === "loading"}
        >
          Następna →
        </button>
      </div>
     </div>
  );
}
