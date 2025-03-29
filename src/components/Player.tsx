export const drawPlayer = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  power: number,
  isCurrentTurn: boolean
) => {
  ctx.save();
  ctx.translate(x, y);
  
  const bodyColor = isCurrentTurn ? '#A0522D' : '#8B4513'; // Lighter brown for current turn
  const legColor = '#000000';
  const eyeColor = '#FFFFFF';

  // Ant Body (Head, Thorax, Abdomen)
  ctx.fillStyle = bodyColor;
  // Head
  ctx.beginPath();
  ctx.ellipse(10, 0, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Thorax
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Abdomen
  ctx.beginPath();
  ctx.ellipse(-12, 0, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(12, -1.5, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(12, 1.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 2;
  // Front legs
  ctx.beginPath();
  ctx.moveTo(5, 2); ctx.lineTo(10, 8); ctx.lineTo(13, 12);
  ctx.moveTo(5, -2); ctx.lineTo(10, -8); ctx.lineTo(13, -12);
  // Middle legs
  ctx.moveTo(0, 3); ctx.lineTo(0, 10); ctx.lineTo(3, 14);
  ctx.moveTo(0, -3); ctx.lineTo(0, -10); ctx.lineTo(3, -14);
  // Back legs
  ctx.moveTo(-5, 3); ctx.lineTo(-10, 8); ctx.lineTo(-13, 12);
  ctx.moveTo(-5, -3); ctx.lineTo(-10, -8); ctx.lineTo(-13, -12);
  ctx.stroke();

  // Draw aiming indicator (simple line from thorax)
  if (isCurrentTurn) {
    ctx.save();
    // Rotate context for aiming line
    const angleRad = angle * Math.PI / 180;
    // We need to adjust the rotation point if the ant isn't centered at (0,0) visually
    // Let's aim from the thorax center (0,0) in this local coordinate system
    
    // Draw aiming line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; // Red aiming line
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]); // Dashed line
    const lineLength = power * 0.6 + 10; // Scale power to line length
    const endX = Math.cos(angleRad) * lineLength;
    const endY = -Math.sin(angleRad) * lineLength; // Use negative sin because y is down
    ctx.moveTo(0, 0); // Start from thorax center
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore(); // Restore rotation and line dash
  }

  ctx.restore(); // Restore translation
};
