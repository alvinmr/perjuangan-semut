import styled from 'styled-components';

export const GameOverScreenContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  z-index: 50; /* Ensure it's above canvas but potentially below controls */
`;

export const ResetButton = styled.button`
  padding: 10px 20px;
  margin-top: 10px;
  background: #2ecc71;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;

  &:hover {
    background: #27ae60;
  }
`;

interface GameOverScreenProps {
  winner: string | null;
  onReset: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner, onReset }) => (
  <GameOverScreenContainer>
    <h2>Game Over!</h2>
    <p>Player {winner} wins!</p>
    <ResetButton onClick={onReset}>Play Again</ResetButton>
  </GameOverScreenContainer>
);
