import { useEffect, useRef, useState } from "react";
import type { BoardCard, BoardColumn } from "../useApi";

type Props = {
  card: BoardCard;
  onSave: (id: string, patch: { text: string; color: string }) => Promise<void>;
  onChangeStatus: (id: string, target: BoardColumn) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
};

const STATUS_LABEL: Record<BoardColumn, string> = {
  Backlog: "Backlog",
  Doing: "Doing",
  Done: "Done",
};

export function CardItem({ card, onSave, onChangeStatus, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(card.text);
  const [color, setColor] = useState(card.color || "#FDF3A7");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(card.text);
    setColor(card.color || "#FDF3A7");
  }, [card.text, card.color]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(card.id, { text: text.trim(), color });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(target: BoardColumn) {
    if (saving || target === card.column) return;
    setSaving(true);
    try {
      await onChangeStatus(card.id, target);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl shadow-sm p-2 text-sm bg-white/60">
      <div
        className="rounded-lg px-2 py-2"
        style={{ background: color }}
        onDoubleClick={() => setEditing(true)}
        title="Kliknij podwójnie, aby edytować"
      >
        {editing ? (
          <input
            ref={inputRef}
            className="w-full rounded-md px-2 py-1 bg-white/85 outline-none"
            value={text}
            disabled={saving}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? save() : e.key === "Escape" ? setEditing(false) : null)}
            onBlur={save}
          />
        ) : (
          <div className="px-1 py-1">{card.text}</div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          onBlur={save}
          title="Zmień kolor"
          className="h-6 w-8 cursor-pointer border rounded"
        />

        <select
          className="input h-8"
          value={card.column}
          onChange={(e) => changeStatus(e.target.value as BoardColumn)}
          disabled={saving}
          title="Zmień status"
        >
          {(["Backlog", "Doing", "Done"] as BoardColumn[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        {onDelete && (
          <button
            className="btn-ghost text-xs"
            onClick={() => onDelete(card.id)}
            disabled={saving}
            title="Usuń"
          >
            Usuń
          </button>
        )}

        {saving && <span className="text-xs opacity-60">zapisywanie…</span>}
      </div>
    </div>
  );
}
