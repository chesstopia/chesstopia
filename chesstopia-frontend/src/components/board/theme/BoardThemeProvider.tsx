import { createContext, useContext, type ReactNode } from 'react';
import { FLACH, type BoardTheme } from './boardTheme';

const BoardThemeContext = createContext<BoardTheme>(FLACH);

export function BoardThemeProvider({
  theme = FLACH,
  children,
}: {
  theme?: BoardTheme;
  children: ReactNode;
}) {
  return <BoardThemeContext.Provider value={theme}>{children}</BoardThemeContext.Provider>;
}

/** Ohne Provider gilt das Theme Flach. */
// eslint-disable-next-line react-refresh/only-export-components
export function useBoardTheme(): BoardTheme {
  return useContext(BoardThemeContext);
}
