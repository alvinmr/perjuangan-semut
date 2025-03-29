import styled from 'styled-components';
import { Player } from '../../store/gameSlice'; // Corrected import: Player instead of PlayerState
import { WEAPONS, Weapon } from '../../utils/weapons'; // Assuming Weapon type is exported

export const GameStatsContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  display: flex;
  gap: 20px;
  z-index: 10; /* Ensure it's above canvas */
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  span:first-child {
    font-size: 0.8em;
    opacity: 0.8;
  }

  span:last-child {
    font-size: 1.2em;
    font-weight: bold;
  }
`;

interface GameStatsProps {
  currentPlayer: Player | undefined; // Use Player type from slice
}

export const GameStats: React.FC<GameStatsProps> = ({ currentPlayer }) => {
  if (!currentPlayer) {
    return null; // Don't render if no current player
  }

  // Ensure currentPlayer and weapons exist before accessing
  const currentWeapon: Weapon | undefined = currentPlayer.currentWeapon && WEAPONS[currentPlayer.currentWeapon]
    ? WEAPONS[currentPlayer.currentWeapon]
    : undefined;

  return (
    <GameStatsContainer>
      <StatItem>
        <span>WEAPON</span>
        {/* Use optional chaining and provide fallback */}
        <span>{currentWeapon?.name ?? 'N/A'}</span>
      </StatItem>
      <StatItem>
        <span>ANGLE</span>
        <span>{currentPlayer.angle}°</span>
      </StatItem>
      <StatItem>
        <span>POWER</span>
        <span>{currentPlayer.power}%</span>
      </StatItem>
    </GameStatsContainer>
  );
};
