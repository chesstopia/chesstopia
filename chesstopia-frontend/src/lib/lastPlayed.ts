const relative = new Intl.RelativeTimeFormat('de', { style: 'short' });
const clock = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const dayMonth = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' });
const dayMonthYear = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

const MINUTE = 60_000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

type Zeitangabe = { text: string; absolute: boolean };

function describe(iso: string, now: Date): Zeitangabe {
  const then = new Date(iso);
  const minutes = Math.floor((now.getTime() - then.getTime()) / MINUTE);
  if (minutes < 1) return { text: 'gerade eben', absolute: false };
  if (minutes < 60) return { text: relative.format(-minutes, 'minute'), absolute: false };

  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (dayDiff === 0) return { text: relative.format(-Math.floor(minutes / 60), 'hour'), absolute: false };
  if (dayDiff === 1) return { text: `gestern, ${clock.format(then)}`, absolute: false };
  if (then.getFullYear() === now.getFullYear()) return { text: dayMonth.format(then), absolute: true };
  return { text: dayMonthYear.format(then), absolute: true };
}

/** Zeitangabe für Partielisten, z. B. „vor 5 Min.“, „gestern, 21:14“, „24.10.“. */
export function formatLastPlayed(iso: string, now: Date): string {
  return describe(iso, now).text;
}

/** Wie `formatLastPlayed`, mit grammatisch passendem Präfix: „beendet vor 5 Min.“, „beendet am 24.10.“. */
export function formatEndedAt(iso: string, now: Date): string {
  const { text, absolute } = describe(iso, now);
  return `beendet ${absolute ? 'am ' : ''}${text}`;
}
