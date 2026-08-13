import { Chessboard } from '@/components/board/Chessboard';
import { useBoardState } from '@/hooks/useBoardState';

function App() {
  const { board, sideToMove, error, loading, pending, playMove } = useBoardState();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-900">
      {loading && <p className="text-stone-400">Lade Brett…</p>}
      {board && (
        <Chessboard
          board={board}
          sideToMove={sideToMove ?? 'w'}
          onMove={playMove}
          disabled={pending}
        />
      )}
      {board && (
        <p className="text-stone-400">
          {pending ? 'Zug wird gespielt…' : `${sideToMove === 'w' ? 'Weiß' : 'Schwarz'} am Zug`}
        </p>
      )}
      {error && <p className="text-red-400">Fehler: {error.message}</p>}
    </main>
  );
}

export default App;
