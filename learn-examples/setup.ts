// React verlangt dieses Flag, sonst warnt jedes `act()` in der Konsole.
// Es gehört zur Testumgebung und nicht zur Sprosse — deshalb steht es hier
// und nicht in den Beispieldateien, die etwas anderes zeigen sollen.
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
