import * as ChessEngineModule from '@chesstopia/chess-engine';
import type { MoveRequest, Position, Square } from '@chesstopia/openapi-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- CJS/UMD interop: everything lives under the io.chesstopia.engine namespace at runtime
const engine = (ChessEngineModule as any).io.chesstopia.engine;
const {
  CastlingRights, Color, File, Move, PieceType, PlacedPiece, Piece,
  Position: EnginePosition, Rank, RuleSet, Square: EngineSquare, Variant, validateMove,
} = engine;

const FILE: Record<string, unknown> = {
  A: File.A, B: File.B, C: File.C, D: File.D, E: File.E, F: File.F, G: File.G, H: File.H,
};
const RANK: Record<string, unknown> = {
  ONE: Rank.ONE, TWO: Rank.TWO, THREE: Rank.THREE, FOUR: Rank.FOUR,
  FIVE: Rank.FIVE, SIX: Rank.SIX, SEVEN: Rank.SEVEN, EIGHT: Rank.EIGHT,
};
const COLOR: Record<string, unknown> = { WHITE: Color.WHITE, BLACK: Color.BLACK };
const TYPE: Record<string, unknown> = {
  KING: PieceType.KING, QUEEN: PieceType.QUEEN, ROOK: PieceType.ROOK,
  BISHOP: PieceType.BISHOP, KNIGHT: PieceType.KNIGHT, PAWN: PieceType.PAWN,
};

// Der Frontend-Kontrakt kennt in diesem Vorhaben nur Standard-Regeln (Spec §6.1).
const STANDARD_RULES = new RuleSet(Variant.STANDARD, true, true);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Kotlin/JS-@JsExport-Typen sind opak
function square(s: Square): any {
  return new EngineSquare(FILE[s.file], RANK[s.rank]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function position(p: Position): any {
  const board = p.board.map(
    (pp) => new PlacedPiece(square(pp.square), new Piece(TYPE[pp.piece.type], COLOR[pp.piece.color])),
  );
  return new EnginePosition(
    board,
    COLOR[p.sideToMove],
    new CastlingRights(
      p.castlingRights.whiteKingSide, p.castlingRights.whiteQueenSide,
      p.castlingRights.blackKingSide, p.castlingRights.blackQueenSide,
    ),
    p.enPassantTarget ? square(p.enPassantTarget) : null,
    p.halfmoveClock,
    p.fullmoveNumber,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function move(m: MoveRequest): any {
  return new Move(square(m.from), square(m.to), m.promotion ? TYPE[m.promotion] : null);
}

/** Ob der Zug nach den Schachregeln legal ist. Die Engine ist die einzige Instanz, die das entscheidet (ADR-0001). */
export function isLegalMove(p: Position, m: MoveRequest): boolean {
  return validateMove(position(p), move(m), STANDARD_RULES);
}
