'use client';

import { Board as BoardType, Column as ColumnType, Card as CardType } from '@/lib/types';
import { useState } from 'react';
import Column from './Column';
import { dummyBoard } from '@/lib/dummy-data';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export default function Board() {
  const [board, setBoard] = useState<BoardType>(dummyBoard);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddCard = (columnId: string, title: string, details: string) => {
    const newCardId = `card-${Date.now()}`;
    const newCard: CardType = {
      id: newCardId,
      title,
      details,
    };

    setBoard((prevBoard) => ({
      ...prevBoard,
      cards: {
        ...prevBoard.cards,
        [newCardId]: newCard,
      },
      columns: prevBoard.columns.map((col) =>
        col.id === columnId
          ? { ...col, cardIds: [...col.cardIds, newCardId] }
          : col
      ),
    }));
  };

  const handleDeleteCard = (cardId: string) => {
    setBoard((prevBoard) => {
      const newCards = { ...prevBoard.cards };
      delete newCards[cardId];

      return {
        ...prevBoard,
        cards: newCards,
        columns: prevBoard.columns.map((col) => ({
          ...col,
          cardIds: col.cardIds.filter((id) => id !== cardId),
        })),
      };
    });
  };

  const handleEditCard = (cardId: string, title: string, details: string) => {
    setBoard((prevBoard) => ({
      ...prevBoard,
      cards: {
        ...prevBoard.cards,
        [cardId]: {
          ...prevBoard.cards[cardId],
          title,
          details,
        },
      },
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeCardId = active.id as string;
    const overColumnId = over.id as string;

    setBoard((prevBoard) => {
      const sourceColumnId = prevBoard.columns.find((col) =>
        col.cardIds.includes(activeCardId)
      )?.id;

      if (!sourceColumnId) return prevBoard;

      // Moving to a different column or reordering
      const updatedColumns = prevBoard.columns.map((col) => {
        if (col.id === sourceColumnId) {
          return {
            ...col,
            cardIds: col.cardIds.filter((id) => id !== activeCardId),
          };
        }
        if (col.id === overColumnId) {
          if (!col.cardIds.includes(activeCardId)) {
            return {
              ...col,
              cardIds: [...col.cardIds, activeCardId],
            };
          }
        }
        return col;
      });

      return {
        ...prevBoard,
        columns: updatedColumns,
      };
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 p-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark-navy mb-2">
            Project Board
          </h1>
          <p className="text-gray-text text-base">
            Organize your tasks across the workflow
          </p>
        </div>

        <div className="flex gap-8 overflow-x-auto pb-6 flex-1">
          {board.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              cards={column.cardIds.map((cardId) => board.cards[cardId])}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              onEditCard={handleEditCard}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
