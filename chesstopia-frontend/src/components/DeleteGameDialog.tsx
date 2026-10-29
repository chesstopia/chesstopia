import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteGameDialog({ open, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="delete-game-title"
      onCancel={(event) => {
        // Zustand bleibt maßgeblich: der Effekt schließt den Dialog über `open`.
        event.preventDefault();
        onCancel();
      }}
      className="m-auto rounded-md bg-stone-800 p-6 text-stone-200 backdrop:bg-black/60"
    >
      <h2 id="delete-game-title" className="mb-2 text-lg font-semibold">
        Partie löschen?
      </h2>
      <p className="mb-4">Partie wirklich löschen? Das lässt sich nicht rückgängig machen.</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Löschen
        </Button>
      </div>
    </dialog>
  );
}
