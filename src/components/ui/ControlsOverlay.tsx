import styled from 'styled-components';

export const ControlsOverlayContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 20px;
  border-radius: 10px;
  z-index: 100; /* Ensure it's above everything else */
`;

export const ControlsList = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 10px 20px;
  margin: 15px 0;
`;

export const ControlItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const KeyHint = styled.span`
  background: #34495e;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2em;

  &:hover {
    color: #e74c3c;
  }
`;

interface ControlsOverlayProps {
  onClose: () => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({ onClose }) => (
  <ControlsOverlayContainer>
    <h2>Game Controls</h2>
    <CloseButton onClick={onClose}>×</CloseButton>
    <ControlsList>
      <ControlItem>
        <KeyHint>←</KeyHint>
        <span>Decrease Angle</span>
      </ControlItem>
      <ControlItem>
        <KeyHint>→</KeyHint>
        <span>Increase Angle</span>
      </ControlItem>
      <ControlItem>
        <KeyHint>↑</KeyHint>
        <span>Increase Power</span>
      </ControlItem>
      <ControlItem>
        <KeyHint>↓</KeyHint>
        <span>Decrease Power</span>
      </ControlItem>
      <ControlItem>
        <KeyHint>A</KeyHint>
        <span>Move Left</span>
      </ControlItem>
      <ControlItem>
        <KeyHint>D</KeyHint>
        <span>Move Right</span>
      </ControlItem>
      <ControlItem>
        <KeyHint>1-4</KeyHint>
        <span>Select Weapon</span>
      </ControlItem>
      <ControlItem>
        <KeyHint>Space</KeyHint>
        <span>Fire Weapon</span>
      </ControlItem>
      <ControlItem>
        <KeyHint>H</KeyHint>
        <span>Show/Hide Controls</span>
      </ControlItem>
       <ControlItem>
        <KeyHint>Mouse</KeyHint>
        <span>Aim Weapon</span>
      </ControlItem>
    </ControlsList>
    <p>Press H to hide this panel.</p>
  </ControlsOverlayContainer>
);
