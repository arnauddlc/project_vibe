"use client";

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useKanbanStore } from '../store/useKanbanStore';
import { Column } from './Column';
import { Card } from './Card';

export function Board() {
  const { columns, cards, moveCard } = useKanbanStore();
  const [activeCard, setActiveCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2, // 2px movement required to drag, avoiding accidental clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const { id } = active;
    setActiveCard(cards[id]);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveCard = active.data.current?.type === 'Card';
    const isOverCard = over.data.current?.type === 'Card';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveCard) return;

    // Find the columns
    const activeColumn = columns.find(c => c.cardIds.includes(activeId));
    let overColumn;
    
    if (isOverCard) {
      overColumn = columns.find(c => c.cardIds.includes(overId));
    } else if (isOverColumn) {
      overColumn = columns.find(c => c.id === overId);
    }
    
    if (!activeColumn || !overColumn) return;

    // We defer the move to handleDragEnd so the final state is updated cleanly
    // But since users like seeing immediate feedback dnd-kit normally does this in handleDragOver
    // I will do it here for cross-column drag smoothly:
    if (activeColumn.id !== overColumn.id) {
      const activeIndex = activeColumn.cardIds.indexOf(activeId);
      let overIndex = 0;
      if (isOverCard) {
        overIndex = overColumn.cardIds.indexOf(overId);
        // adjust index if dragging below
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        overIndex = overIndex >= 0 ? overIndex + modifier : overColumn.cardIds.length + 1;
      } else {
        overIndex = overColumn.cardIds.length + 1;
      }

      moveCard(activeId, activeColumn.id, overColumn.id, activeIndex, overIndex);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeColumn = columns.find(c => c.cardIds.includes(activeId));
    
    // Final drop in the same column
    if (activeColumn) {
      const overColumn = columns.find(c => c.cardIds.includes(overId)) || columns.find(c => c.id === overId);
      if (overColumn && activeColumn.id === overColumn.id) {
        const activeIndex = activeColumn.cardIds.indexOf(activeId);
        const overIndex = activeColumn.cardIds.indexOf(overId);
        if (activeIndex !== overIndex && overIndex !== -1) {
          moveCard(activeId, activeColumn.id, activeColumn.id, activeIndex, overIndex);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="board-container">
        {columns.map((col) => (
          <Column key={col.id} column={col} cards={cards} />
        ))}
      </div>
      
      <DragOverlay>
        {activeCard ? (
          <div className="drag-overlay">
            <Card id={activeCard.id} card={activeCard} active />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
