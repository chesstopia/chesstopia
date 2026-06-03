export type PieceCode =
  | 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP'
  | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP';

/** board[rank][file], rank 0 = rank 8 (black's back rank), file 0 = a-file */
export type Board = (PieceCode | null)[][];

const FEN_CHAR_TO_PIECE: Record<string, PieceCode> = {
  K: 'wK', Q: 'wQ', R: 'wR', B: 'wB', N: 'wN', P: 'wP',
  k: 'bK', q: 'bQ', r: 'bR', b: 'bB', n: 'bN', p: 'bP',
};

export function parseFenBoard(fen: string): Board {
  const fenBoard = fen.split(' ')[0];
  return fenBoard.split('/').map((rank) => {
    const squares: (PieceCode | null)[] = [];
    for (const char of rank) {
      if (/\d/.test(char)) {
        squares.push(...Array<null>(Number(char)).fill(null));
      } else {
        squares.push(FEN_CHAR_TO_PIECE[char] ?? null);
      }
    }
    return squares;
  });
}
