import type { LoadedGame } from '@/hooks/useGameState';
import type { FeedbackEvent } from './feedback';
import type { Role } from './gameModel';
import { checkedSide, kingSquare } from './position';
import type { KingMarker, Side } from './position';

export type TurnState = 'zuschauer' | 'zug-wird-gespielt' | 'du-bist-am-zug' | 'gegner-ist-am-zug';

export type RowView = { side: Side; label: string; active: boolean; check: boolean; note?: string };

export type GameViewModel = {
  over: boolean;
  orientation: Side;
  kingMarker: KingMarker | null;
  boardDisabled: boolean;
  animateCheck: boolean;
  top: RowView;
  bottom: RowView;
  /** Wert für `data-turn-indicator`; `undefined`, wenn keine Zuganzeige erscheint. */
  turnIndicator: TurnState | undefined;
};

const SIDE_NAME: Record<Side, string> = { w: 'Weiß', b: 'Schwarz' };

/** Leitet aus Partie, Rolle und Seitenzustand ab, was die Partieseite anzeigt. */
export function deriveGameView(a: {
  game: LoadedGame;
  role: Role;
  pending: boolean;
  deleted: boolean;
  /** Zuschauer wählen die Ansicht selbst; Spieler sehen immer aus ihrer Sicht. */
  spectatorFlipped: boolean;
  feedbackEvent: FeedbackEvent | null;
}): GameViewModel {
  const { game, role, pending, deleted, spectatorFlipped, feedbackEvent } = a;
  const over = game.status !== 'ONGOING';
  const myTurn = role !== null && role === game.sideToMove;
  const orientation: Side = role ?? (spectatorFlipped ? 'b' : 'w');
  const opponentSide: Side = orientation === 'w' ? 'b' : 'w';
  const showTurn = !over && !deleted;

  // Wer im Schach steht, sagt die Engine über `checkState`; nach dem Matt bleibt der König markiert.
  const checked = checkedSide(game.checkState);
  const checkedKing = checked ? kingSquare(game.board, checked) : null;
  const kingMarker: KingMarker | null = checkedKing ? { square: checkedKing, kind: over ? 'mate' : 'check' } : null;

  const label = (side: Side) =>
    role === null ? SIDE_NAME[side] : `${side === role ? 'Du' : 'Gegner'} · ${SIDE_NAME[side]}`;
  const turnState: TurnState =
    role === null ? 'zuschauer' : pending ? 'zug-wird-gespielt' : myTurn ? 'du-bist-am-zug' : 'gegner-ist-am-zug';
  // Hinweis in der eigenen Zeile; beim Zug des Gegners spricht dessen hervorgehobene Zeile.
  const ownNote = { zuschauer: undefined, 'zug-wird-gespielt': 'Zug wird gespielt…', 'du-bist-am-zug': 'Du bist am Zug', 'gegner-ist-am-zug': undefined }[turnState];
  const row = (side: Side, note?: string): RowView => ({
    side,
    label: label(side),
    active: !over && game.sideToMove === side,
    check: !over && checked === side,
    note,
  });

  return {
    over,
    orientation,
    kingMarker,
    boardDisabled: deleted || pending || over || !myTurn,
    // Der König wackelt, solange das letzte Ereignis ein Schach ist.
    animateCheck: feedbackEvent === 'check-given' || feedbackEvent === 'check-received',
    top: row(opponentSide),
    bottom: row(orientation, showTurn ? ownNote : undefined),
    turnIndicator: showTurn ? turnState : undefined,
  };
}
