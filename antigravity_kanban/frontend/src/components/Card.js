"use client";

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useKanbanStore } from '../store/useKanbanStore';

export function Card({ id, card, active }) {
  const { deleteCard } = useKanbanStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'Card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // prevent drag start
    // Find the column this card belongs to
    const state = useKanbanStore.getState();
    const col = state.columns.find(c => c.cardIds.includes(id));
    if (col) {
      deleteCard(id, col.id);
    }
  };

  // If this card is currently being dragged, we render a placeholder-like state (handled by opacity above)
  // And the DragOverlay will render a clone
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card ${active ? 'active-card' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="card-actions">
        <button 
          className="delete-btn" 
          onClick={handleDelete}
          title="Delete Card"
          onPointerDown={(e) => e.stopPropagation()} // critical to not start drag
        >
          &times;
        </button>
      </div>
      <div className="card-title">{card.title}</div>
      {card.details && <div className="card-details">{card.details}</div>}
    </div>
  );
}
