import { create } from 'zustand';

const initialColumns = [
  { id: 'col-1', title: 'To Do', cardIds: ['card-1', 'card-2'] },
  { id: 'col-2', title: 'In Progress', cardIds: ['card-3'] },
  { id: 'col-3', title: 'Review', cardIds: [] },
  { id: 'col-4', title: 'Testing', cardIds: [] },
  { id: 'col-5', title: 'Done', cardIds: ['card-4'] },
];

const initialCards = {
  'card-1': { id: 'card-1', title: 'Setup Next.js', details: 'Install dependencies, configure Vanilla CSS.' },
  'card-2': { id: 'card-2', title: 'Create Store', details: 'Setup Zustand with dummy data and actions.' },
  'card-3': { id: 'card-3', title: 'Design Board', details: 'Build the layout for columns and cards.' },
  'card-4': { id: 'card-4', title: 'Gather Requirements', details: 'Read strategy.md thoroughly for constraints.' },
};

export const useKanbanStore = create((set) => ({
  columns: initialColumns,
  cards: initialCards,

  renameColumn: (colId, newTitle) => set((state) => ({
    columns: state.columns.map((col) => 
      col.id === colId ? { ...col, title: newTitle } : col
    )
  })),

  addCard: (colId, title, details) => set((state) => {
    const newCardId = `card-${Date.now()}`;
    const newCard = { id: newCardId, title, details };
    
    return {
      cards: { ...state.cards, [newCardId]: newCard },
      columns: state.columns.map((col) => 
        col.id === colId 
          ? { ...col, cardIds: [...col.cardIds, newCardId] } 
          : col
      )
    };
  }),

  deleteCard: (cardId, colId) => set((state) => {
    const { [cardId]: _, ...remainingCards } = state.cards;
    
    return {
      cards: remainingCards,
      columns: state.columns.map((col) => 
        col.id === colId 
          ? { ...col, cardIds: col.cardIds.filter(id => id !== cardId) } 
          : col
      )
    };
  }),

  moveCard: (activeId, sourceColId, destColId, sourceIndex, destIndex) => set((state) => {
    const newColumns = [...state.columns];
    
    const sourceColIndex = newColumns.findIndex(c => c.id === sourceColId);
    const destColIndex = newColumns.findIndex(c => c.id === destColId);
    
    // Safety check
    if (sourceColIndex === -1 || destColIndex === -1) return state;

    if (sourceColId === destColId) {
      // Re-order within same column
      const col = newColumns[sourceColIndex];
      const newCardIds = [...col.cardIds];
      newCardIds.splice(sourceIndex, 1);
      newCardIds.splice(destIndex, 0, activeId);
      
      newColumns[sourceColIndex] = { ...col, cardIds: newCardIds };
    } else {
      // Move to different column
      const sourceCol = newColumns[sourceColIndex];
      const destCol = newColumns[destColIndex];
      
      const newSourceCardIds = [...sourceCol.cardIds];
      newSourceCardIds.splice(sourceIndex, 1);
      
      const newDestCardIds = [...destCol.cardIds];
      newDestCardIds.splice(destIndex, 0, activeId);
      
      newColumns[sourceColIndex] = { ...sourceCol, cardIds: newSourceCardIds };
      newColumns[destColIndex] = { ...destCol, cardIds: newDestCardIds };
    }
    
    return { columns: newColumns };
  }),
}));
