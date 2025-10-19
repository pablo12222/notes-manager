import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "../useApi";

export type MeResponse = {
  id?: string;
  name?: string;
  email?: string;
  picture?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiShape = {
  getMe: () => Promise<MeResponse>;
  updateMe?: (payload: Partial<Pick<MeResponse, "name">>) => Promise<MeResponse>;
};

function formatDate(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleString();
}

function CopyBtn({
  value,
  title = "Kopiuj",
  className = "",
}: {
  value?: string;
  title?: string;
  className?: string;
}) {
  const [ok, setOk] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      className={`copy-btn ${className}`}
      aria-label={title}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {
          /* ignore */
        }
      }}
    >
      {ok ? "Skopiowano" : "Kopiuj"}
    </button>
  );
}

export default function Profile() {
  const { user, isAuthenticated } = useAuth0();
  const api = useApi() as unknown as ApiShape;

  const [me, setMe] = useState<MeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // tryb edycji
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const avatar = useMemo(() => {
    return me?.picture || user?.picture || "https://www.gravatar.com/avatar/?d=mp&s=240";
  }, [me, user]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMe();
        setMe(data);
        setDisplayName(data?.name ?? user?.name ?? "");
      } catch (e: any) {
        setErr(e?.message ?? "Błąd podczas ładowania profilu");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    try {
      const updated: MeResponse = { ...me, name: displayName };
      setMe(updated);
      setEditing(false);
      if (api.updateMe) {
        const saved = await api.updateMe({ name: displayName });
        setMe((prev) => ({ ...prev, ...saved }));
      }
    } catch (e: any) {
      setErr(e?.message ?? "Błąd zapisu");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="panel">
        <h2>Profil</h2>
        <p className="muted">Zaloguj się, aby zobaczyć swój profil.</p>
      </div>
    );
  }

  const email = me?.email || user?.email || "—";
  const verified = (user as any)?.email_verified === true;

  return (
    <div className="profile">
      <section className="profile-card">
        <div className="profile-avatar">
          {loading ? <div className="avatar skeleton" /> : <img className="avatar" src={avatar} alt="avatar" />}
        </div>

        <div className="profile-main">
          <h1 className="profile-name">
            {loading ? <span className="skeleton w-40 h-6" /> : me?.name || user?.name || "Użytkownik"}
          </h1>

          <div className="profile-row">
            {loading ? (
              <span className="skeleton w-56 h-4" />
            ) : (
              <>
                <span className="profile-email">{email}</span>
                <CopyBtn value={email} title="Kopiuj e-mail" />
              </>
            )}
          </div>

          <div className="profile-chips">
            {me?.role && <span className="chip chip-role">{me.role}</span>}
            <span className={`chip ${verified ? "chip-ok" : "chip-warn"}`}>{verified ? "E-mail zweryfikowany" : "Niezweryfikowany"}</span>
            {user?.sub && (
              <span className="chip chip-id">
                <span className="mono">{user.sub}</span>
                <CopyBtn value={user.sub} title="Kopiuj sub" />
              </span>
            )}
          </div>

          <div className="profile-actions">
            {!editing && api.updateMe && (
              <button className="btn-primary" onClick={() => setEditing(true)}>
                Edytuj dane
              </button>
            )}
            {editing && (
              <div className="edit-actions">
                <button className="btn-primary" onClick={save}>
                  Zapisz
                </button>
                <button className="btn-secondary" onClick={() => setEditing(false)}>
                  Anuluj
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      {editing && (
        <section className="panel edit-panel">
          <h3>Edytuj dane</h3>
          <form className="profile-form" onSubmit={save}>
            <div className="row">
              <label className="label">
                <span>Wyświetlana nazwa</span>
                <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </label>

              <label className="label">
                <span>
                  Email <small className="muted">— zarządzane przez Auth0</small>
                </span>
                <input className="input" value={email} disabled />
              </label>
            </div>
            <div className="actions">
              <button className="btn-primary">Zapisz</button>
            </div>
          </form>
        </section>
      )}

      <section className="profile-grid">
        <div className="panel">
          <h3>Dane z Auth0</h3>
          <dl className="kv">
            <div>
              <dt>Nazwa</dt>
              <dd>
                <code>{user?.name || "—"}</code>
              </dd>
            </div>
            <div>
              <dt>Nick</dt>
              <dd>
                <code>{user?.nickname || "—"}</code>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd className="dd-flex">
                <code>{user?.email || "—"}</code>
                <CopyBtn value={user?.email || undefined} />
              </dd>
            </div>
            <div>
              <dt>Sub</dt>
              <dd className="dd-flex">
                <code className="mono">{user?.sub || "—"}</code>
                <CopyBtn value={user?.sub || undefined} />
              </dd>
            </div>
            <div>
              <dt>Zweryfikowany</dt>
              <dd>
                <code>{String((user as any)?.email_verified ?? "—")}</code>
              </dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <h3>
            Dane z API (<code>getMe</code>)
          </h3>
          {loading ? (
            <div className="kv">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="kv-row">
                  <span className="skeleton w-24 h-4" />
                  <span className="skeleton w-48 h-4" />
                </div>
              ))}
            </div>
          ) : err ? (
            <div className="text-red-500">{err}</div>
          ) : me ? (
            <dl className="kv">
              <div>
                <dt>ID</dt>
                <dd className="dd-flex">
                  <code className="mono">{me.id || "—"}</code>
                  <CopyBtn value={me.id} />
                </dd>
              </div>
              <div>
                <dt>Wyświetlana nazwa</dt>
                <dd>
                  <code>{me.name || "—"}</code>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd className="dd-flex">
                  <code>{me.email || "—"}</code>
                  <CopyBtn value={me.email} />
                </dd>
              </div>
              <div>
                <dt>Rola</dt>
                <dd>
                  <code>{me.role || "—"}</code>
                </dd>
              </div>
              <div>
                <dt>Utworzono</dt>
                <dd>
                  <code>{formatDate(me.createdAt)}</code>
                </dd>
              </div>
              <div>
                <dt>Aktualizacja</dt>
                <dd>
                  <code>{formatDate(me.updatedAt)}</code>
                </dd>
              </div>
            </dl>
          ) : (
            <div className="muted">Brak danych profilu.</div>
          )}
        </div>
      </section>
    </div>
  );
}
