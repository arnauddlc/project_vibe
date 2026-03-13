import { Board } from '../components/Board';

export default function Home() {
  return (
    <main className="app-container">
      <header className="app-header">
        <h1>Kanban Board</h1>
      </header>
      <div className="board-wrapper">
        <Board />
      </div>
    </main>
  );
}
