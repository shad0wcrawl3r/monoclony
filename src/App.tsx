// React is used via JSX transform — no explicit import needed
import { useGameStore } from './store/gameStore';
import { TitlePage } from './pages/TitlePage';
import { GamePage } from './pages/GamePage';
import { WinPage } from './pages/WinPage';

export default function App() {
  const game = useGameStore(s => s.game);

  // No game started yet → title screen
  if (!game) {
    return <TitlePage />;
  }

  // Someone won → win screen
  if (game.winner !== null) {
    const winner = game.players[game.winner];
    return <WinPage winner={winner} />;
  }

  // Game in progress
  return <GamePage game={game} />;
}
