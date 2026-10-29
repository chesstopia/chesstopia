import { Copy, Link } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface InviteButtonsProps {
  inviteLink: string;
  spectatorLink: string;
}

/** Kopiert den Link; ohne nutzbare Zwischenablage (z. B. unsicherer Kontext) steht er im Toast zum Selbstkopieren. */
async function copyLink(link: string) {
  try {
    await navigator.clipboard.writeText(link);
    toast.success('Link kopiert');
  } catch {
    toast.error(`Kopieren nicht möglich. Link bitte von Hand kopieren: ${link}`, { duration: 15000 });
  }
}

export function InviteButtons({ inviteLink, spectatorLink }: InviteButtonsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" data-link={inviteLink} onClick={() => void copyLink(inviteLink)}>
        <Copy /> Einladungslink kopieren
      </Button>
      <Button variant="outline" data-link={spectatorLink} onClick={() => void copyLink(spectatorLink)}>
        <Link /> Zuschauerlink kopieren
      </Button>
    </div>
  );
}
