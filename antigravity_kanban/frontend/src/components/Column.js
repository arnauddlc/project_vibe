"use client";

import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Card } from './Card';
import { useKanbanStore } from '../store/useKanbanStore';

export function Column({ column, cards }) {
  const { id, title, cardIds } = column;
  const { renameColumn, addCard } = useKanbanStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');

  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'Column',
      column,
    },
  });

  const handleRename = (e) => {
    renameColumn(id, e.target.value);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      addCard(id, newTitle.trim(), newDetails.trim());
      setNewTitle('');
      setNewDetails('');
      setIsAdding(false);
    }
  };

  return (
    <div className="column">
      <div className="column-header">
        <input
          className="column-title-input"
          value={title}
          onChange={handleRename}
          aria-label="Rename Column"
        />
      </div>
      
      <div className="column-body" ref={setNodeRef}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cardIds.map((cardId) => (
            <Card key={cardId} id={cardId} card={cards[cardId]} />
          ))}
        </SortableContext>
      </div>

      <div className="add-card-container">
        {isAdding ? (
          <form className="add-card-form" onSubmit={handleAddSubmit}>
            <input
              autoFocus
              className="add-card-input"
              placeholder="Card Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              className="add-card-textarea"
              placeholder="Card Details..."
              rows={2}
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
            />
            <div className="add-card-actions">
              <button type="submit" className="btn-primary" disabled={!newTitle.trim()}>Add</button>
              <button type="button" className="btn-cancel" onClick={() => setIsAdding(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <button className="add-card-btn" onClick={() => setIsAdding(true)}>
            + Add a card
          </button>
        )}
      </div>
    </div>
  );
}
