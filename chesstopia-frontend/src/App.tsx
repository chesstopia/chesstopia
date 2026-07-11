import { Chessboard } from '@/components/board/Chessboard';
import { useBoardState } from '@/hooks/useBoardState';

function App() {
  const { board, error, loading } = useBoardState();

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-900">
      {loading && <p className="text-stone-400">Lade Brett…</p>}
      {error && <p className="text-red-400">Fehler: {error.message}</p>}
      {board && <Chessboard board={board} />}
    </main>
  );
}

export default App;
