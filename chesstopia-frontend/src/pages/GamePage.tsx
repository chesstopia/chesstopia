import { useParams } from 'react-router';

export function GamePage() {
  const { gameId } = useParams() as { gameId: string };
  return <main>GamePage {gameId}</main>;
}
