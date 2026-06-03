# Plan: Schachbrett und Figuren darstellen

Ticket: Initialer Schachbrettzustand vom Backend ans Frontend schicken und darstellen.

---

## Übersicht

```
openapi.yaml  →  Backend (GameController)  →  GET /api/v1/game/board
                                                        ↓
                                              Frontend (useBoardState Hook)
                                                        ↓
                                              <Chessboard> Komponente
```

Keine Datenbank nötig für dieses Ticket — der initiale Zustand ist immer die Standard-Startstellung (FEN: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`).

---

## Schritt 1: OpenAPI Spec erweitern (`docs/api/openapi.yaml`)

Neuen Endpunkt und Schema hinzufügen:

```yaml
paths:
  /api/v1/game/board:
    get:
      operationId: getBoard
      tags: [game]
      summary: Initialen Schachbrettzustand abrufen
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BoardStateResponse'

components:
  schemas:
    BoardStateResponse:
      type: object
      required: [fen]
      properties:
        fen:
          type: string
          description: Aktuelle Stellung in FEN-Notation
          example: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
```

FEN als einziges Feld — das Frontend nutzt die chess-engine zur Interpretation. Kein strukturiertes Pieces-Array nötig (würde Daten duplizieren, die in FEN bereits stecken).

Danach: `./gradlew openApiGenerate generateOpenApiClient` ausführen, damit `GameApi` (Backend) und der TypeScript-Client (Frontend) regeneriert werden.

---

## Schritt 2: Backend — Controller implementieren

### 2a. Neues Package `game` anlegen

```
chesstopia-backend/src/main/java/io/chesstopia/backend/game/
└── GameController.java
```

### 2b. `GameController.java`

```java
@RestController
public class GameController implements GameApi {

    private static final String INITIAL_FEN =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    @Override
    public ResponseEntity<BoardStateResponse> getBoard() {
        return ResponseEntity.ok(new BoardStateResponse(INITIAL_FEN));
    }
}
```

Kein Service, kein Repository — der Zustand ist statisch. Wenn später Partien aus der DB geladen werden, wird der Controller um einen `GameService` erweitert.

---

## Schritt 3: Frontend — FEN-Parser Utility

Datei: `chesstopia-frontend/src/lib/fen.ts`

FEN-Zeichenfeld (Zeile 1 des FEN) parsen → 8×8-Array mit Piece-Bezeichnern.

```typescript
export type PieceCode =
  | 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP'
  | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP'
  | null;

// Returns board[rank][file], rank 0 = rank 8 (black's back rank)
export function parseFenBoard(fen: string): PieceCode[][] {
  const fenBoard = fen.split(' ')[0];
  return fenBoard.split('/').map((rank) => {
    const squares: PieceCode[] = [];
    for (const char of rank) {
      if (/\d/.test(char)) {
        squares.push(...Array(Number(char)).fill(null));
      } else {
        const color = char === char.toUpperCase() ? 'w' : 'b';
        squares.push(`${color}${char.toUpperCase()}` as PieceCode);
      }
    }
    return squares;
  });
}
```

---

## Schritt 4: Frontend — API Hook

Datei: `chesstopia-frontend/src/hooks/useBoardState.ts`

```typescript
import { useEffect, useState } from 'react';
import { GameApi, BoardStateResponse } from '@chesstopia/openapi-client';

export function useBoardState() {
  const [boardState, setBoardState] = useState<BoardStateResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    new GameApi().getBoard()
      .then((res) => setBoardState(res.data))
      .catch(setError);
  }, []);

  return { boardState, error };
}
```

---

## Schritt 5: Frontend — Komponenten

### Dateistruktur

```
chesstopia-frontend/src/components/board/
├── Chessboard.tsx      # 8×8-Grid, koordiniert Squares und Pieces
├── Square.tsx          # Einzelnes Feld (Farbe, optionaler Piece-Slot)
└── Piece.tsx           # Einzelne Figur (Unicode-Symbol)
```

### `Piece.tsx`

Unicode-Figuren als erste Implementierung — einfach austauschbar durch SVG-Sprites später.

```typescript
const SYMBOLS: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

export function Piece({ code }: { code: string }) {
  return <span className="text-4xl select-none leading-none">{SYMBOLS[code]}</span>;
}
```

### `Square.tsx`

```typescript
type SquareProps = {
  light: boolean;
  piece: PieceCode;
};

export function Square({ light, piece }: SquareProps) {
  return (
    <div className={`flex items-center justify-center w-full aspect-square
      ${light ? 'bg-amber-100' : 'bg-amber-800'}`}>
      {piece && <Piece code={piece} />}
    </div>
  );
}
```

### `Chessboard.tsx`

```typescript
export function Chessboard({ fen }: { fen: string }) {
  const board = parseFenBoard(fen);
  return (
    <div className="grid grid-cols-8 w-[min(90vw,560px)] aspect-square border border-stone-700">
      {board.flatMap((rank, rankIdx) =>
        rank.map((piece, fileIdx) => (
          <Square
            key={`${rankIdx}-${fileIdx}`}
            light={(rankIdx + fileIdx) % 2 === 0}
            piece={piece}
          />
        ))
      )}
    </div>
  );
}
```

---

## Schritt 6: Integration in `App.tsx`

```typescript
function App() {
  const { boardState, error } = useBoardState();

  if (error) return <p>Fehler beim Laden: {error.message}</p>;
  if (!boardState) return <p>Lade Brett…</p>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-900">
      <Chessboard fen={boardState.fen} />
    </main>
  );
}
```

---

## Reihenfolge der Umsetzung

| # | Aufgabe | Datei(en) |
|---|---------|-----------|
| 1 | OpenAPI Spec erweitern | `docs/api/openapi.yaml` |
| 2 | Code regenerieren | `./gradlew openApiGenerate generateOpenApiClient` |
| 3 | `GameController` implementieren | `backend/.../game/GameController.java` |
| 4 | FEN-Parser schreiben + testen | `frontend/src/lib/fen.ts` |
| 5 | `Piece`, `Square`, `Chessboard` bauen | `frontend/src/components/board/` |
| 6 | `useBoardState` Hook bauen | `frontend/src/hooks/useBoardState.ts` |
| 7 | In `App.tsx` integrieren | `frontend/src/App.tsx` |
| 8 | Manuell im Browser prüfen | — |

---

## Offene Entscheidungen

- **Piece-Darstellung:** Unicode-Symbole sind der Startpunkt. SVG-Sprites (z.B. lichess-Figuren unter Open Licence) können später drop-in ersetzt werden — `Piece.tsx` ist der einzige Änderungspunkt.
- **Brett-Orientierung:** Weiß unten (Rank 8 oben in FEN → wird zuerst gerendert). Flip-Button ist Out-of-Scope für dieses Ticket.
- **CORS:** `SecurityConfig` muss `localhost:5173` (Vite Dev Server) erlauben — prüfen ob bereits konfiguriert.
