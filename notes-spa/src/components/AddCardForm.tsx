import { useState } from "react";
import type { BoardColumn as ColumnType } from "../useApi";

export function AddCardForm({
  column,
  onAdd,
}: {
  column: ColumnType;
  onAdd: (column: ColumnType, text: string) => void;
}) {
  const [text, setText] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onAdd(column, value);
    setText("");
  };

  return (
    <form onSubmit={submit} className="add-form">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="input"
        placeholder="Dodaj kartę…"
      />
    </form>
  );
}
