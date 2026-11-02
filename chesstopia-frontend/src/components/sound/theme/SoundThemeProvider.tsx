import { createContext, useContext, type ReactNode } from 'react';
import { STANDARD, type SoundTheme } from './soundTheme';

const SoundThemeContext = createContext<SoundTheme>(STANDARD);

export function SoundThemeProvider({
  theme = STANDARD,
  children,
}: {
  theme?: SoundTheme;
  children: ReactNode;
}) {
  return <SoundThemeContext.Provider value={theme}>{children}</SoundThemeContext.Provider>;
}

/** Ohne Provider gilt das Theme Standard. */
// eslint-disable-next-line react-refresh/only-export-components
export function useSoundTheme(): SoundTheme {
  return useContext(SoundThemeContext);
}
