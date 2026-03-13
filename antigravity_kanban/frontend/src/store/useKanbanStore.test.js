import { describe, it, expect, beforeEach } from 'vitest';
import { useKanbanStore } from './useKanbanStore';

describe('Kanban Store', () => {
  beforeEach(() => {
    // Reset store to initial state if needed, here we recreate
    useKanbanStore.setState({
      columns: [
        { id: 'col-1', title: 'To Do', cardIds: ['card-1'] },
        { id: 'col-2', title: 'Done', cardIds: [] },
      ],
      cards: {
        'card-1': { id: 'card-1', title: 'Test', details: 'Details' }
      }
    });
  });

  it('renames a column', () => {
    useKanbanStore.getState().renameColumn('col-1', 'New To Do');
    expect(useKanbanStore.getState().columns[0].title).toBe('New To Do');
  });

  it('adds a card', () => {
    useKanbanStore.getState().addCard('col-1', 'New Card', 'New Details');
    const cols = useKanbanStore.getState().columns;
    const cards = useKanbanStore.getState().cards;
    expect(cols[0].cardIds.length).toBe(2);
    
    const newCardId = cols[0].cardIds[1];
    expect(cards[newCardId].title).toBe('New Card');
  });

  it('deletes a card', () => {
    useKanbanStore.getState().deleteCard('card-1', 'col-1');
    const cols = useKanbanStore.getState().columns;
    const cards = useKanbanStore.getState().cards;
    expect(cols[0].cardIds.length).toBe(0);
    expect(cards['card-1']).toBeUndefined();
  });

  it('moves a card within the same column', () => {
    useKanbanStore.setState({
      columns: [{ id: 'col-1', title: 'To Do', cardIds: ['A', 'B', 'C'] }],
      cards: { 'A': {}, 'B': {}, 'C': {} }
    });
    // Move 'A' from index 0 to index 2
    useKanbanStore.getState().moveCard('A', 'col-1', 'col-1', 0, 2);
    expect(useKanbanStore.getState().columns[0].cardIds).toEqual(['B', 'C', 'A']);
  });

  it('moves a card between columns', () => {
    useKanbanStore.setState({
      columns: [
        { id: 'col-1', title: 'To Do', cardIds: ['A'] },
        { id: 'col-2', title: 'Done', cardIds: ['B'] },
      ],
      cards: { 'A': {}, 'B': {} }
    });
    // Move 'A' from col-1 to col-2 at index 0
    useKanbanStore.getState().moveCard('A', 'col-1', 'col-2', 0, 0);
    expect(useKanbanStore.getState().columns[0].cardIds).toEqual([]);
    expect(useKanbanStore.getState().columns[1].cardIds).toEqual(['A', 'B']);
  });
});
