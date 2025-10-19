import { useEffect, useMemo, useRef, useState } from "react";
import type { BoardCard as ApiBoardCard, BoardColumn as ColumnType } from "../useApi";
import { useApi } from "../useApi";

function fromApiColumn(v: number | string): ColumnType {
  const n = typeof v === "string" ? Number(v) : v;
  if (n === 1) return "Doing";
  if (n === 2) return "Done";
  return "Backlog";
}
function toClientCard(raw: ApiBoardCard): ApiBoardCard {
  return {
    ...raw,
    column: fromApiColumn((raw as any).column),
    color: raw.color || "#FDF3A7",
    text: raw.text ?? "",
  };
}

type Pos = { x: number; y: number };
type PosState = Record<string, Pos>;

const POS_KEY = "board_canvas_positions_v1";
const COLS: ColumnType[] = ["Backlog", "Doing", "Done"];
const COL_LABEL: Record<ColumnType, string> = { Backlog: "Backlog", Doing: "Doing", Done: "Done" };
const COLORS = ["#FDF3A7", "#D9ECFF", "#FFD6E7", "#D8F6C3"];

export default function Board() {
  const api = useApi();

  const [cards, setCards] = useState<ApiBoardCard[]>([]);
  const [positions, setPositions] = useState<PosState>(() => {
    try { return JSON.parse(localStorage.getItem(POS_KEY) || "{}"); } catch { return {}; }
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newText, setNewText] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newStatus, setNewStatus] = useState<ColumnType>("Backlog");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ColumnType>("");

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await api.getCards();
        const normalized = (all ?? []).map(toClientCard);
        setCards(normalized);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? "Nie udało się pobrać kart");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setCardPos = (id: string, pos: Pos) => {
    setPositions(prev => {
      const next = { ...prev, [id]: pos };
      localStorage.setItem(POS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const txt = newText.trim();
    if (!txt) return;
    try {
      const created = await api.addCard({ text: txt, color: newColor, column: newStatus });
      const card = toClientCard(created);
      setCards(prev => [card, ...prev]);

      setCardPos(card.id, autoPlace(positions));

      setNewText("");
    } catch (e: any) {
      setErr(e?.message ?? "Błąd dodawania");
    }
  };

  const editCard = async (id: string, patch: { text?: string; color?: string }) => {
    const idx = cards.findIndex(c => c.id === id);
    if (idx < 0) return;
    const before = cards[idx];
    const updated = { ...before, ...patch };
    setCards(prev => {
      const copy = [...prev]; copy[idx] = updated; return copy;
    });
    try {
      await api.updateCard(id, { text: updated.text, color: updated.color });
    } catch (e: any) {
      setCards(prev => { const copy = [...prev]; copy[idx] = before; return copy; });
      setErr(e?.message ?? "Błąd edycji");
    }
  };

  const changeStatus = async (id: string, column: ColumnType) => {
    const idx = cards.findIndex(c => c.id === id);
    if (idx < 0) return;
    const before = cards[idx];
    const updated = { ...before, column };
    setCards(prev => { const copy = [...prev]; copy[idx] = updated; return copy; });

    try {
      await api.moveCard(id, column);
    } catch (e: any) {
      setCards(prev => { const copy = [...prev]; copy[idx] = before; return copy; });
      setErr(e?.message ?? "Błąd zmiany statusu");
    }
  };

  const deleteCard = async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    if (!window.confirm(`Usunąć kartę: "${card.text.slice(0, 60)}"?`)) return;

    const prevCards = cards;
    setCards(prev => prev.filter(c => c.id !== id));
    setPositions(prev => {
      const next = { ...prev }; delete next[id]; localStorage.setItem(POS_KEY, JSON.stringify(next)); return next;
    });

    try { await api.deleteCard(id); }
    catch (e: any) {
      setCards(prevCards);
      setErr(e?.message ?? "Błąd usuwania");
    }
  };

  const startDrag = (id: string, e: React.MouseEvent) => {
    const wrap = canvasRef.current!;
    const rect = wrap.getBoundingClientRect();
    const current = positions[id] ?? { x: 12, y: 12 };
    const startX = e.clientX;
    const startY = e.clientY;
    const offsetX = startX - (rect.left + current.x);
    const offsetY = startY - (rect.top + current.y);

    const onMove = (ev: MouseEvent) => {
      const x = Math.max(0, ev.clientX - rect.left - offsetX);
      const y = Math.max(0, ev.clientY - rect.top - offsetY);
      setCardPos(id, snapToGrid({ x, y }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cards.filter(c => {
      const okStatus = !statusFilter || c.column === statusFilter;
      const okQ = !term || c.text.toLowerCase().includes(term);
      return okStatus && okQ;
    });
  }, [cards, q, statusFilter]);

  return (
    <div className="board">
      {err && <div className="card text-red-600 dark:text-red-400 mb-3">{err}</div>}

      <div className="board-toolbar">
        <div className="swatch" style={{ background: COLORS[0] }} />
        <div className="swatch" style={{ background: COLORS[1] }} />
        <div className="swatch" style={{ background: COLORS[2] }} />
        <div className="swatch" style={{ background: COLORS[3] }} />
        <span className="muted">przeciągnij karteczkę i puść — zostanie na miejscu</span>
      </div>

      <form className="canvas-toolbar" onSubmit={addCard}>
        <input
          className="input"
          placeholder="Dodaj kartę…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <select className="select" value={newStatus} onChange={(e) => setNewStatus(e.target.value as ColumnType)}>
          {COLS.map(c => (<option key={c} value={c}>{COL_LABEL[c]}</option>))}
        </select>
        <input className="input color" type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
        <button className="btn-primary">Dodaj</button>

        <div className="spacer" />

        <input
          className="input"
          placeholder="Szukaj…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="">Wszystkie</option>
          {COLS.map(c => (<option key={c} value={c}>{COL_LABEL[c]}</option>))}
        </select>
      </form>

      <div ref={canvasRef} className="canvas">
        {loading ? (
          <div className="muted">Ładowanie…</div>
        ) : (
          filtered.map(card => {
            const pos = positions[card.id] ?? { x: 12, y: 12 };
            return (
              <div
                key={card.id}
                className="free-card-wrap"
                style={{ left: pos.x, top: pos.y }}
                onMouseDown={(e) => startDrag(card.id, e)}
              >
                <CanvasCard
                  card={card}
                  onChangeText={(text) => editCard(card.id, { text })}
                  onChangeColor={(color) => editCard(card.id, { color })}
                  onChangeStatus={(st) => changeStatus(card.id, st)}
                  onDelete={() => deleteCard(card.id)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CanvasCard({
  card,
  onChangeText,
  onChangeColor,
  onChangeStatus,
  onDelete,
}: {
  card: ApiBoardCard;
  onChangeText: (t: string) => void;
  onChangeColor: (c: string) => void;
  onChangeStatus: (s: ColumnType) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(card.text);
  const [color, setColor] = useState(card.color);

  const save = () => {
    onChangeText(text);
    onChangeColor(color);
    setEditing(false);
  };

  return (
    <div className="note-card" style={{ background: color }}>
      {!editing ? (
        <>
          <p className="note-text">{card.text}</p>
          <div className="card-actions">
            <select
              className="select small"
              value={card.column}
              onChange={(e) => onChangeStatus(e.target.value as ColumnType)}
              title="Status"
            >
              {COLS.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
            <button className="btn-ghost small" onClick={() => setEditing(true)}>Edytuj</button>
            <button className="btn-danger small" onClick={onDelete}>Usuń</button>
          </div>
        </>
      ) : (
        <>
          <textarea
            className="textarea"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Treść…"
          />
          <div className="edit-row compact">
            <label className="color-picker">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Kolor"
              />
              <span>Kolor</span>
            </label>
            <div className="edit-actions">
              <button className="btn-primary" onClick={save}>Zapisz</button>
              <button className="btn-secondary" onClick={() => setEditing(false)}>Anuluj</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function snapToGrid(p: Pos, grid = 8): Pos {
  return { x: Math.round(p.x / grid) * grid, y: Math.round(p.y / grid) * grid };
}
function autoPlace(all: PosState): Pos {
  const ys = Object.values(all).map(p => p.y);
  const y = ys.length ? Math.max(...ys) + 96 : 12;
  return { x: 12, y };
}
