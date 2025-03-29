interface TerrainPoint {
  x: number;
  y: number;
}

class TerrainMap {
  private terrainPoints: TerrainPoint[];
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.terrainPoints = this.generateTerrain();
  }

  private generateTerrain(): TerrainPoint[] {
    const points: TerrainPoint[] = [];
    for (let x = 0; x < this.width; x++) {
      const y = this.height - 100 + Math.sin(x * 0.02) * 20 + Math.sin(x * 0.05) * 15;
      points.push({ x, y });
    }
    return points;
  }

  public deformTerrain(x: number, y: number, radius: number): void {
    const explosionStrength = 20;
    this.terrainPoints = this.terrainPoints.map(point => {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (distance < radius) {
        const deformation = explosionStrength * (1 - distance / radius);
        return {
          x: point.x,
          y: point.y + deformation // Push terrain down at explosion point
        };
      }
      return point;
    });
  }

  public getTerrainPoints(): TerrainPoint[] {
    return this.terrainPoints;
  }

  public checkCollision(x: number, y: number): boolean {
    // Find the closest terrain point by rounding x and clamping index
    // const nearestPoint = this.terrainPoints[Math.round(x)]; // Removed duplicate
    // if (!nearestPoint) return false; // Removed duplicate
    const index = Math.max(0, Math.min(this.terrainPoints.length - 1, Math.round(x)));
    const nearestPoint = this.terrainPoints[index];
    if (!nearestPoint) return false; // Should not happen if index is clamped
    return y >= nearestPoint.y;
  }

  public getTerrainHeightAt(x: number): number {
    // Find the closest terrain point by rounding x and return its y value
    const index = Math.max(0, Math.min(this.terrainPoints.length - 1, Math.round(x)));
    const nearestPoint = this.terrainPoints[index];
    // Return a default height (e.g., canvas height) if point not found, though it shouldn't happen
    return nearestPoint ? nearestPoint.y : this.height; 
  }
}

export const createTerrainMap = (width: number, height: number): TerrainMap => {
  return new TerrainMap(width, height);
};

export const drawTerrain = (
  ctx: CanvasRenderingContext2D, 
  terrainMap: TerrainMap
): void => {
  const points = terrainMap.getTerrainPoints();
  
  ctx.beginPath();
  ctx.fillStyle = '#3B7A57';
  ctx.moveTo(points[0].x, points[0].y);
  
  points.forEach(point => {
    ctx.lineTo(point.x, point.y);
  });
  
  ctx.lineTo(points[points.length - 1].x, ctx.canvas.height);
  ctx.lineTo(0, ctx.canvas.height);
  ctx.closePath();
  ctx.fill();
};

export type { TerrainMap };
