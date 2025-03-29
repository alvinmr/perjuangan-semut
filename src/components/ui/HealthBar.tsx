import styled from 'styled-components';

export const HealthBar = styled.div<{ health: number }>`
  width: 200px;
  height: 20px;
  background: #ddd;
  border: 2px solid #000;
  position: relative;
  color: black; /* Ensure text is visible */
  text-align: center; /* Center text */
  line-height: 20px; /* Vertically center text */
  font-size: 0.9em;
  font-weight: bold;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.health}%;
    background: ${props => props.health > 50 ? '#2ecc71' : props.health > 25 ? '#f1c40f' : '#e74c3c'};
    transition: all 0.3s ease;
  }
`;
