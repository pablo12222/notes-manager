import { useEffect, useMemo, useState } from "react";
import { useApi } from "../useApi";

type Note = {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  content?: string;
  createdAt?: string;
};

const STATUS_ALIAS: Record<string, Note["status"]> = {
  todo: "todo",
  "to-do": "todo",
  "to_do": "todo",
  "do zrobienia": "todo",
  doing: "doing",
  "in-progress": "doing",
  "w trakcie": "doing",
  done: "done",
  zrobione: "done",
};

function toNote(raw: any): Note {
  const id = String(raw?.id ?? cryptoRandom());
  const title = String(raw?.title ?? "").trim() || "Bez tytułu";
  const rawStatus = String(raw?.status ?? "").toLowerCase();
  const mapped = STATUS_ALIAS[rawStatus as keyof typeof STATUS_ALIAS];
  const status: Note["status"] = mapped ?? "todo";
  const content = typeof raw?.content === "string" ? raw.content : "";
  const createdAt =
    typeof raw?.createdAt === "string" ? raw.createdAt : new Date().toISOString();
  return { id, title, status, content, createdAt };
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2);
}

const STATUS_LABEL: Record<Note["status"], string> = {
  todo: "Do zrobienia",
  doing: "W trakcie",
  done: "Zrobione",
};

export default function Notes() {
  const api = useApi();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Note["status"]>("");

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Note["status"]>("todo");
  const [content, setContent] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState<Note["status"]>("todo");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getNotes();
        const normalized = (Array.isArray(data) ? data : []).map(toNote);
        setNotes(normalized);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return notes.filter((n) => {
      const okStatus = !statusFilter || n.status === statusFilter;
      const okQ =
        !term ||
        n.title.toLowerCase().includes(term) ||
        (n.content ?? "").toLowerCase().includes(term);
      return okStatus && okQ;
    });
  }, [notes, q, statusFilter]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = { title: title.trim(), status, content: content.trim() };
    const createdFromApi = await api.addNote({
      title: payload.title,
      content: payload.content,
      status: payload.status,
    });
    const newNote = toNote(createdFromApi ?? { ...payload, id: cryptoRandom() });
    setNotes((prev) => [newNote, ...prev]);

    setTitle("");
    setContent("");
    setStatus("todo");
  };

  const removeNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const ok = window.confirm(`Czy na pewno chcesz usunąć notatkę "${note.title}"?`);
    if (!ok) return;

    const prev = notes;
    setNotes((p) => p.filter((n) => n.id !== id));
    try {
      await api.deleteNote(id);
    } catch {

      setNotes(prev);
      alert("Nie udało się usunąć notatki. Spróbuj ponownie.");
    }
  };

  const toggleStatus = async (n: Note) => {
    const next: Note["status"] =
      n.status === "todo" ? "doing" : n.status === "doing" ? "done" : "todo";
    await saveEditInternal({ ...n, status: next });
  };

  const startEdit = (n: Note) => {
    setEditId(n.id);
    setEditTitle(n.title);
    setEditStatus(n.status);
    setEditContent(n.content ?? "");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditContent("");
    setEditStatus("todo");
  };

  const saveEdit = async () => {
    if (!editId) return;
    const base = notes.find((x) => x.id === editId);
    if (!base) return;

    const updated: Note = {
      ...base,
      title: editTitle.trim() || "Bez tytułu",
      status: editStatus,
      content: editContent,
    };
    await saveEditInternal(updated);
    cancelEdit();
  };

  const saveEditInternal = async (updated: Note) => {
    const prev = notes;
    setNotes((p) => p.map((x) => (x.id === updated.id ? updated : x)));

    try {
      await api.updateNote(updated.id, {
        title: updated.title,
        content: updated.content ?? "",
        status: updated.status,
      });
    } catch {
      setNotes(prev); 
      alert("Błąd podczas zapisu zmian.");
    }
  };

  const onEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    }
  };

  return (
    <div className="notes">
      <header className="toolbar">
        <div className="toolbar-left">
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj w tytule/treści…"
          />
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="">Wszystkie statusy</option>
            <option value="todo">Do zrobienia</option>
            <option value="doing">W trakcie</option>
            <option value="done">Zrobione</option>
          </select>
        </div>
      </header>

      <section className="panel">
        <h2>Dodaj notatkę</h2>
        <form className="note-form" onSubmit={addNote}>
          <div className="row">
            <input
              className="input"
              placeholder="Tytuł np. Plan sprintu"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as Note["status"])}
            >
              <option value="todo">Do zrobienia</option>
              <option value="doing">W trakcie</option>
              <option value="done">Zrobione</option>
            </select>
          </div>

          <textarea
            className="textarea"
            rows={4}
            placeholder="Krótki opis…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="actions">
            <button className="btn-primary" aria-label="Dodaj notatkę">
              Dodaj
            </button>
          </div>
        </form>
      </section>

      <section className="list">
        <h3>Twoje notatki</h3>
        {loading ? (
          <div className="muted">Ładowanie…</div>
        ) : filtered.length === 0 ? (
          <div className="muted">Brak wyników.</div>
        ) : (
          <ul className="note-list">
            {filtered.map((n) => {
              const isEditing = editId === n.id;
              return (
                <li className="note-item" key={n.id}>
                  {!isEditing ? (
                    <>
                      <div className="note-item-head">
                        <div className="note-title">{n.title}</div>
                        <span className={`badge ${n.status}`}>{STATUS_LABEL[n.status]}</span>
                      </div>
                      {n.content && <p className="note-body">{n.content}</p>}

                      <div className="note-foot">
                        <button className="btn-ghost" onClick={() => toggleStatus(n)}>
                          Zmień status
                        </button>
                        <button className="btn-ghost" onClick={() => startEdit(n)}>
                          Edytuj
                        </button>
                        <button className="btn-danger" onClick={() => removeNote(n.id)}>
                          Usuń
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="edit-row">
                        <input
                          className="input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={onEditKeyDown}
                          placeholder="Tytuł"
                        />
                        <select
                          className="select"
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as Note["status"])}
                        >
                          <option value="todo">Do zrobienia</option>
                          <option value="doing">W trakcie</option>
                          <option value="done">Zrobione</option>
                        </select>
                      </div>
                      <textarea
                        className="textarea"
                        rows={4}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={onEditKeyDown}
                        placeholder="Opis…"
                      />
                      <div className="edit-actions">
                        <button className="btn-primary" onClick={saveEdit}>
                          Zapisz
                        </button>
                        <button className="btn-secondary" onClick={cancelEdit} type="button">
                          Anuluj
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
