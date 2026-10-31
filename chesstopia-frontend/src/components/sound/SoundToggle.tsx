import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSoundMuted } from '@/lib/soundSettings';

/** Lautsprecher-Schalter für die Töne der Partieseite. */
export function SoundToggle() {
  const [muted, setMuted] = useSoundMuted();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={muted}
      aria-label={muted ? 'Ton einschalten' : 'Ton ausschalten'}
      onClick={() => setMuted(!muted)}
    >
      {muted ? <VolumeX /> : <Volume2 />}
    </Button>
  );
}
