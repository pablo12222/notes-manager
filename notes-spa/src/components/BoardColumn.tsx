import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import type { BoardCard, BoardColumn as ColumnType } from "../useApi";
import { CardItem } from "./CardItem";

type Props = {
  column: ColumnType;
  cards: BoardCard[];
  onAddCard: (column: ColumnType, text: string) => Promise<void> | void;
  onEditCard: (id: string, patch: { text: string; color: string }) => Promise<void>;
  onChangeStatus: (id: string, target: ColumnType) => Promise<void>;
  onDeleteCard: (id: string) => Promise<void>;
};

export function BoardColumn({ column, cards, onAddCard, onEditCard, onChangeStatus, onDeleteCard }: Props) {
  const [newText, setNewText] = useState("");

  async function add() {
    const t = newText.trim();
    if (!t) return;
    await onAddCard(column, t);
    setNewText("");
  }

  return (
    <div className="w-[340px]">
      <h3 className="font-semibold mb-2">{column} <span className="opacity-60">({cards.length})</span></h3>

      <Droppable droppableId={column}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="bg-white/80 rounded-2xl shadow p-3 flex flex-col gap-3 min-h-[280px]"
          >
            <input
              className="input w-full"
              placeholder="Dodaj kartę…"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />

            {cards.map((card, index) => (
              <Draggable draggableId={card.id} index={index} key={card.id}>
                {(p) => (
                  <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                    <CardItem
                      card={card}
                      onSave={onEditCard}
                      onChangeStatus={onChangeStatus}
                      onDelete={onDeleteCard}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
