import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TerrainMap, createTerrainMap } from '../components/Terrain';
import { Explosion } from '../components/Explosion';
import { audioManager } from '../utils/AudioManager';
import { WEAPONS } from '../utils/weapons'; // Removed unused Weapon import

export interface Player { // Export the interface
  id: string;
  position: { x: number; y: number };
  health: number;
  currentWeapon: string;
  angle: number;
  power: number;
  hitbox: {
    width: number;
    height: number;
  };
  lastShotTime: number;
  weapons: string[];
  // Physics state
  velocityX: number;
  velocityY: number;
  isGrounded: boolean;
}

interface Projectile {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  weapon: string;
  bounces: number;
}

// Export GameState if needed elsewhere, or keep internal
export interface GameState { // Export the interface
  players: Player[];
  currentTurn: string;
  turnTime: number;
  windSpeed: number;
  projectile: Projectile | null;
  isProjectileInMotion: boolean;
  gameOver: boolean;
  winner: string | null;
  terrain: TerrainMap | null;
  explosions: Explosion[];
}

// Removed unnecessary ProjectileState alias
// export interface ProjectileState extends Projectile {}

const initialState: GameState = {
  players: [],
  currentTurn: '',
  turnTime: 30,
  windSpeed: 0,
  projectile: null,
  isProjectileInMotion: false,
  gameOver: false,
  winner: null,
  terrain: null,
  explosions: [],
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addPlayer: (state, action: PayloadAction<Omit<Player, 'lastShotTime' | 'weapons' | 'velocityX' | 'velocityY' | 'isGrounded'>>) => {
      state.players.push({
        ...action.payload,
        lastShotTime: 0,
        weapons: ['cannon', 'rocket', 'mortar', 'grenade'],
        // Initialize physics state
        velocityX: 0,
        velocityY: 0,
        isGrounded: false, 
      });
    },
    updatePlayerPosition: (state, action: PayloadAction<{ id: string; position: { x: number; y: number } }>) => {
      const player = state.players.find(p => p.id === action.payload.id);
      if (player) {
        // Update position and potentially reset grounded status if moved vertically
        const movedVertically = player.position.y !== action.payload.position.y;
        player.position = action.payload.position;
        if (movedVertically) {
           // player.isGrounded = false; // Let physics update handle this
        }
      }
    },
    // New reducer to update physics properties
    updatePlayerPhysicsState: (state, action: PayloadAction<{ id: string; velocityX?: number; velocityY?: number; isGrounded?: boolean }>) => {
       const player = state.players.find(p => p.id === action.payload.id);
       if (player) {
         if (action.payload.velocityX !== undefined) player.velocityX = action.payload.velocityX;
         if (action.payload.velocityY !== undefined) player.velocityY = action.payload.velocityY;
         if (action.payload.isGrounded !== undefined) player.isGrounded = action.payload.isGrounded;
       }
    },
    // New reducer for movement input
    movePlayer: (state, action: PayloadAction<{ playerId: string; direction: number }>) => {
      const player = state.players.find(p => p.id === action.payload.playerId);
      const moveSpeed = 3; // Adjust speed as needed
      if (player && player.isGrounded) { // Only allow move if grounded
        player.velocityX = action.payload.direction * moveSpeed;
        // Optional: Set isGrounded false immediately if moving? Or let physics handle?
        // player.isGrounded = false; 
      }
    },
    setCurrentTurn: (state, action: PayloadAction<string>) => {
      state.currentTurn = action.payload;
    },
    updateWindSpeed: (state, action: PayloadAction<number>) => {
      state.windSpeed = action.payload;
    },
    adjustAngle: (state, action: PayloadAction<{ playerId: string; delta: number }>) => {
      const player = state.players.find(p => p.id === action.payload.playerId);
      if (player) {
        // Keep adjustAngle for potential future use (e.g., fine-tuning with keys)
        player.angle = Math.max(0, Math.min(180, player.angle + action.payload.delta)); 
      }
    },
    setAngle: (state, action: PayloadAction<{ playerId: string; angle: number }>) => {
      const player = state.players.find(p => p.id === action.payload.playerId);
      if (player) {
        // Clamp angle between 0 and 180 degrees
        player.angle = Math.max(0, Math.min(180, action.payload.angle));
      }
    },
    adjustPower: (state, action: PayloadAction<{ playerId: string; delta: number }>) => {
      const player = state.players.find(p => p.id === action.payload.playerId);
      if (player) {
        player.power = Math.max(10, Math.min(100, player.power + action.payload.delta));
      }
    },
    switchWeapon: (state, action: PayloadAction<{ playerId: string; weaponId: string }>) => {
      const player = state.players.find(p => p.id === action.payload.playerId);
      if (player && player.weapons.includes(action.payload.weaponId)) {
        player.currentWeapon = action.payload.weaponId;
      }
    },
    shoot: (state, action: PayloadAction<{ playerId: string }>) => {
      const player = state.players.find(p => p.id === action.payload.playerId);
      if (!player || state.isProjectileInMotion) return;

      const weapon = WEAPONS[player.currentWeapon];
      const currentTime = Date.now();
      
      // Check weapon reload time
      if (currentTime - player.lastShotTime < weapon.reloadTime * 1000) return;

      const angleRad = player.angle * Math.PI / 180;
      const velocity = player.power * 0.5 * weapon.velocity;
      
      state.projectile = {
        x: player.position.x,
        y: player.position.y,
        velocityX: Math.cos(angleRad) * velocity,
        velocityY: Math.sin(angleRad) * velocity * -1,
        weapon: player.currentWeapon,
        bounces: 0,
      };
      
      state.isProjectileInMotion = true;
      player.lastShotTime = currentTime;
      audioManager.play('shoot');
    },
    updateProjectile: (state, action: PayloadAction<{ x: number; y: number; velocityX: number; velocityY: number }>) => {
      if (state.projectile) {
        state.projectile = {
          ...state.projectile,
          ...action.payload
        };
      }
    },
    endProjectileMotion: (state) => {
      state.projectile = null;
      state.isProjectileInMotion = false;
      const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentTurn);
      const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
      state.currentTurn = state.players[nextPlayerIndex].id;
    },
    checkCollision: (state) => {
      if (!state.projectile || !state.isProjectileInMotion) return;

      const weapon = WEAPONS[state.projectile.weapon];

      state.players.forEach(player => {
        if (player.id === state.currentTurn) return;

        const hitLeft = player.position.x - player.hitbox.width / 2;
        const hitRight = player.position.x + player.hitbox.width / 2;
        const hitTop = player.position.y - player.hitbox.height / 2;
        const hitBottom = player.position.y + player.hitbox.height / 2;

        if (state.projectile &&
            state.projectile.x >= hitLeft &&
            state.projectile.x <= hitRight &&
            state.projectile.y >= hitTop &&
            state.projectile.y <= hitBottom) {
          
          // Create main explosion
          state.explosions.push({
            x: state.projectile.x,
            y: state.projectile.y,
            radius: weapon.radius,
            currentFrame: 0,
            maxFrames: 20
          });

          // Handle cluster weapon special effect
          if (weapon.special?.type === 'cluster') {
            for (let i = 0; i < weapon.special.value; i++) {
              const angle = (Math.PI * 2 * i) / weapon.special.value;
              const distance = 30;
              state.explosions.push({
                x: state.projectile.x + Math.cos(angle) * distance,
                y: state.projectile.y + Math.sin(angle) * distance,
                radius: weapon.radius * 0.5,
                currentFrame: 0,
                maxFrames: 20
              });
            }
          }
          
          player.health -= weapon.damage;
          audioManager.play('hit');
          
          if (player.health <= 0) {
            state.gameOver = true;
            state.winner = state.currentTurn;
          }

          state.projectile = null;
          state.isProjectileInMotion = false;
          
          const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentTurn);
          const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
          state.currentTurn = state.players[nextPlayerIndex].id;
        }
      });
    },
    resetGame: (state) => {
      state.players.forEach(player => {
        player.health = 100;
        player.angle = player.id === 'player1' ? 45 : 135;
        player.power = 50;
        player.lastShotTime = 0;
        player.weapons = ['cannon', 'rocket', 'mortar', 'grenade'];
        // Reset physics state
        player.velocityX = 0;
        player.velocityY = 0;
        player.isGrounded = false; // Will be updated by physics loop
      });
      state.gameOver = false;
      state.winner = null;
      state.currentTurn = 'player1';
      state.projectile = null;
      state.isProjectileInMotion = false;
      state.explosions = [];
      if (state.terrain) {
        state.terrain = createTerrainMap(800, 600);
      }
    },
    initializeTerrain: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.terrain = createTerrainMap(action.payload.width, action.payload.height);
    },
    deformTerrain: (state, action: PayloadAction<{ x: number; y: number; radius: number }>) => {
      if (state.terrain) {
        state.terrain.deformTerrain(action.payload.x, action.payload.y, action.payload.radius);
      }
    },
    checkTerrainCollision: (state) => {
      if (!state.projectile || !state.terrain) return;

      const weapon = WEAPONS[state.projectile.weapon];

      if (state.terrain.checkCollision(state.projectile.x, state.projectile.y)) {
        // Handle bounce weapon special effect
        if (weapon.special?.type === 'bounce' && state.projectile.bounces < weapon.special.value) {
          state.projectile.velocityY *= -0.6;
          state.projectile.bounces++;
          return;
        }

        // Handle penetration weapon special effect
        if (weapon.special?.type === 'penetrate') {
          state.terrain.deformTerrain(state.projectile.x, state.projectile.y, weapon.radius);
          if (state.projectile.bounces < weapon.special.value) {
            state.projectile.bounces++;
            return;
          }
        }

        state.explosions.push({
          x: state.projectile.x,
          y: state.projectile.y,
          radius: weapon.radius,
          currentFrame: 0,
          maxFrames: 20
        });

        audioManager.play('explosion');
        state.terrain.deformTerrain(state.projectile.x, state.projectile.y, weapon.radius);
        
        state.projectile = null;
        state.isProjectileInMotion = false;
        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentTurn);
        const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
        state.currentTurn = state.players[nextPlayerIndex].id;
      }
    },
    addExplosion: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.explosions.push({
        x: action.payload.x,
        y: action.payload.y,
        radius: 5,
        currentFrame: 0,
        maxFrames: 20
      });
    },
    updateExplosions: (state) => {
      state.explosions = state.explosions
        .filter(exp => exp.currentFrame < exp.maxFrames)
        .map(exp => ({
          ...exp,
          currentFrame: exp.currentFrame + 1
        }));
    },
  },
});

export const { 
  addPlayer, 
  updatePlayerPosition, 
  setCurrentTurn, 
  updateWindSpeed,
  adjustAngle,
  setAngle, // Export the new action
  adjustPower,
  switchWeapon,
  shoot,
  updateProjectile,
  endProjectileMotion,
  checkCollision,
  resetGame,
  initializeTerrain,
  deformTerrain,
  checkTerrainCollision,
  addExplosion,
  updateExplosions,
  updatePlayerPhysicsState, // Export new action
  movePlayer, // Export new action
} = gameSlice.actions;

export default gameSlice.reducer;
