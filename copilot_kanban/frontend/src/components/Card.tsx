'use client';

import { Card as CardType } from '@/lib/types';
import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface CardProps {
  card: CardType;
  onDelete: (cardId: string) => void;
  onEdit: (cardId: string, title: string, details: string) => void;
}

export default function Card({ card, onDelete, onEdit }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: card.title, details: card.details });

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEditSubmit = () => {
    if (editForm.title.trim()) {
      onEdit(card.id, editForm.title, editForm.details);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-5 shadow-lg border-2 border-primary-blue space-y-4">
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          autoFocus
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-blue focus:ring-2 focus:ring-primary-blue focus:ring-opacity-50 outline-none transition-colors font-semibold"
        />
        <textarea
          value={editForm.details}
          onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-blue focus:ring-2 focus:ring-primary-blue focus:ring-opacity-50 outline-none transition-colors resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={handleEditSubmit}
            className="flex-1 bg-secondary-purple text-white py-2 px-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95"
          >
            Save
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditForm({ title: card.title, details: card.details });
            }}
            className="flex-1 bg-gray-200 text-dark-navy py-2 px-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg p-5 shadow-md hover:shadow-xl border-l-4 border-accent-yellow transition-all duration-200 ${
        isDragging ? 'opacity-50 ring-2 ring-primary-blue' : 'hover:translate-y-[-2px]'
      } cursor-grab active:cursor-grabbing`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-dark-navy mb-2 break-words text-base leading-snug">
            {card.title}
          </h3>
          <p className="text-sm text-gray-text leading-relaxed whitespace-pre-wrap">
            {card.details}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-text hover:text-primary-blue transition-colors p-1.5 rounded-md hover:bg-blue-50"
            title="Edit card"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="text-gray-text hover:text-secondary-purple transition-colors p-1.5 rounded-md hover:bg-red-50"
            title="Delete card"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
