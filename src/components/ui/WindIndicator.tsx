import styled from 'styled-components';

export const WindIndicatorContainer = styled.div`
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 15px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 10; /* Ensure it's above canvas */
`;

export const WindArrow = styled.span<{ direction: number }>`
  transform: rotate(${props => props.direction < 0 ? '180deg' : '0deg'});
  font-size: 1.2em;
`;

interface WindIndicatorProps {
  windSpeed: number;
}

export const WindIndicator: React.FC<WindIndicatorProps> = ({ windSpeed }) => (
  <WindIndicatorContainer>
    <span>Wind:</span>
    <WindArrow direction={windSpeed}>➜</WindArrow>
    <span>{Math.abs(windSpeed).toFixed(2)}</span>
  </WindIndicatorContainer>
);
