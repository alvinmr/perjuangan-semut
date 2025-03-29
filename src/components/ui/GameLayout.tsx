import styled from 'styled-components';

export const GameContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #87CEEB;
  position: relative;
  overflow: hidden;
`;

export const Canvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
  border: none;
`;

// This overlay specifically holds the health bars at the top
export const TopOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 10; /* Ensure it's above canvas */
`;
