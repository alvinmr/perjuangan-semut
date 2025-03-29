export interface Explosion {
  x: number;
  y: number;
  radius: number;
  currentFrame: number;
  maxFrames: number;
}

export const createExplosion = (x: number, y: number): Explosion => ({
  x,
  y,
  radius: 5,
  currentFrame: 0,
  maxFrames: 20,
});

export const drawExplosion = (
  ctx: CanvasRenderingContext2D,
  explosion: Explosion
): void => {
  const progress = explosion.currentFrame / explosion.maxFrames;
  const alpha = 1 - progress;
  const radius = explosion.radius + (explosion.radius * 5 * progress);

  // Draw explosion circle
  ctx.beginPath();
  ctx.fillStyle = `rgba(255, ${Math.floor(200 * (1 - progress))}, 0, ${alpha})`;
  ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw shockwave
  ctx.beginPath();
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
  ctx.lineWidth = 2;
  ctx.arc(explosion.x, explosion.y, radius * 1.2, 0, Math.PI * 2);
  ctx.stroke();
};