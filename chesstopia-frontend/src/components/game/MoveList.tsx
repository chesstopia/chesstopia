import { useEffect, useRef } from 'react';
import type { MoveRecord } from '@chesstopia/openapi-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatMove, pairMoves } from '@/lib/moveList';

interface MoveListProps {
  moves: MoveRecord[];
}

export function MoveList({ moves }: MoveListProps) {
  const last = moves[moves.length - 1];
  const listRef = useRef<HTMLOListElement>(null);

  // Neuester Halbzug soll sichtbar bleiben. Nur den Viewport der Liste scrollen:
  // `scrollIntoView` scrollt auch die Seite mit und schiebt das Brett aus dem Bild,
  // sobald die Liste unter dem Brett steht.
  useEffect(() => {
    const viewport = listRef.current?.closest('[data-slot="scroll-area-viewport"]');
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [moves.length]);

  const halfMove = (record: MoveRecord) => (
    <span
      aria-current={record === last ? 'true' : undefined}
      className={record === last ? 'rounded bg-muted px-1 font-semibold' : 'px-1'}
    >
      {formatMove(record)}
    </span>
  );

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Züge</CardTitle>
      </CardHeader>
      <CardContent>
        {moves.length === 0 ? (
          <p className="text-muted-foreground">Noch keine Züge</p>
        ) : (
          <ScrollArea className="[&>[data-slot=scroll-area-viewport]]:max-h-64">
            <ol ref={listRef} className="flex flex-col gap-1 font-mono">
              {pairMoves(moves).map((row) => (
                <li key={row.number} className="grid grid-cols-[2rem_1fr_1fr] items-center">
                  <span className="text-muted-foreground">{row.number}.</span>
                  {halfMove(row.white)}
                  {row.black ? halfMove(row.black) : <span />}
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
