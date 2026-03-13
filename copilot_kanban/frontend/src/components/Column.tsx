'use client';

import { Column as ColumnType, Card as CardType } from '@/lib/types';
import Card from './Card';
import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (cardId: string) => void;
  onEditCard: (cardId: string, title: string, details: string) => void;
}

export default function Column({
  column,
  cards,
  onAddCard,
  onDeleteCard,
  onEditCard,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', details: '' });
  const formRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onAddCard(column.id, formData.title, formData.details);
      setFormData({ title: '', details: '' });
      setShowForm(false);
    }
  };

  // Scroll form into view when it opens
  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showForm]);

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-xl shadow-lg flex flex-col h-full min-w-[360px] overflow-hidden transition-all duration-200 ${
        isOver ? 'ring-2 ring-accent-yellow ring-opacity-50 shadow-xl' : ''
      }`}
    >
      {/* Column Header */}
      <div className="bg-gradient-to-r from-dark-navy to-dark-navy text-white p-5 rounded-t-xl">
        <h2 className="text-lg font-bold">{column.title}</h2>
        <p className="text-sm opacity-80 mt-2">{cards.length} {cards.length === 1 ? 'item' : 'items'}</p>
      </div>

      {/* Cards Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {cards.length === 0 && !showForm && (
          <p className="text-center text-gray-text text-sm py-12 opacity-60">
            No cards yet
          </p>
        )}
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onDelete={onDeleteCard}
            onEdit={onEditCard}
          />
        ))}
      </div>

      {/* Add Card Form */}
      {showForm && (
        <div ref={formRef} className="p-5 border-t-2 border-gray-100 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Card title..."
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-blue focus:ring-2 focus:ring-primary-blue focus:ring-opacity-50 outline-none transition-colors"
            />
            <textarea
              placeholder="Card details..."
              value={formData.details}
              onChange={(e) =>
                setFormData({ ...formData, details: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-blue focus:ring-2 focus:ring-primary-blue focus:ring-opacity-50 outline-none transition-colors resize-none"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-secondary-purple text-white py-3 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95 shadow-md"
              >
                Add Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', details: '' });
                }}
                className="flex-1 bg-gray-200 text-dark-navy py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Card Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full p-5 text-primary-blue border-t-2 border-gray-100 hover:bg-blue-50 font-semibold transition-colors text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Card
        </button>
      )}
    </div>
  );
}
