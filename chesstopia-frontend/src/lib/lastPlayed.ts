const relative = new Intl.RelativeTimeFormat('de', { style: 'short' });
const clock = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const dayMonth = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' });
const dayMonthYear = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

const MINUTE = 60_000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Zeitangabe für Partielisten, z. B. „vor 5 Min.“, „gestern, 21:14“, „24.10.“. */
export function formatLastPlayed(iso: string, now: Date): string {
  const then = new Date(iso);
  const minutes = Math.floor((now.getTime() - then.getTime()) / MINUTE);
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return relative.format(-minutes, 'minute');

  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (dayDiff === 0) return relative.format(-Math.floor(minutes / 60), 'hour');
  if (dayDiff === 1) return `gestern, ${clock.format(then)}`;
  if (then.getFullYear() === now.getFullYear()) return dayMonth.format(then);
  return dayMonthYear.format(then);
}
