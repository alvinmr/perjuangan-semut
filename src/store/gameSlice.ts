import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WritableDraft } from 'immer'; // Import WritableDraft
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

// Helper function to apply explosion damage and check game over
const applyExplosionDamage = (state: WritableDraft<GameState>, explosionX: number, explosionY: number, explosionRadius: number, explosionDamage: number, sourcePlayerId: string) => {
  // No need to return gameOverTriggered as the state.gameOver is modified directly
  state.players.forEach(targetPlayer => {
    // Don't damage the player who fired the shot with their own terrain explosion immediately
    // Allow self-damage from direct hits (handled in checkCollision)
    // if (targetPlayer.id === sourcePlayerId) return; // Re-evaluate if self-damage from terrain explosion is desired

    const dx = targetPlayer.position.x - explosionX;
    const dy = targetPlayer.position.y - explosionY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const playerHitboxRadius = Math.max(targetPlayer.hitbox.width, targetPlayer.hitbox.height) / 2; // Approximate radius

    if (distance < explosionRadius + playerHitboxRadius) {
      // Apply damage (consider distance falloff later?)
      targetPlayer.health -= explosionDamage;
      audioManager.play('hit');

      if (targetPlayer.health <= 0) {
        targetPlayer.health = 0; // Clamp health at 0
        // Check game over state after applying damage
        const livingPlayers = state.players.filter(p => p.health > 0);
        if (livingPlayers.length <= 1) {
          state.gameOver = true;
          // Winner is the source player if they are the only one left, or if only one other player was left and just died.
          state.winner = livingPlayers.length === 1 ? livingPlayers[0].id : sourcePlayerId;
          // No need to set gameOverTriggered = true;
        }
      }
    }
  });
  // No return needed
};

// Helper function to advance turn to the next living player
const advanceTurn = (state: WritableDraft<GameState>) => {
  if (state.gameOver) return; // Don't advance turn if game is over

  const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentTurn);
  if (currentPlayerIndex === -1) { // Should not happen, but safety check
      state.currentTurn = state.players.find(p => p.health > 0)?.id || ''; // Find first living player
      return;
  }

  let nextTurnFound = false;
  for (let i = 1; i < state.players.length; i++) {
    const nextPlayerIndex = (currentPlayerIndex + i) % state.players.length;
    if (state.players[nextPlayerIndex].health > 0) {
      state.currentTurn = state.players[nextPlayerIndex].id;
      nextTurnFound = true;
      break;
    }
  }

  // If no other living player is found, the game should be over (handled by applyExplosionDamage check)
  if (!nextTurnFound && state.players.filter(p => p.health > 0).length <= 1 && !state.gameOver) {
      state.gameOver = true;
      const living = state.players.filter(p => p.health > 0);
      state.winner = living.length === 1 ? living[0].id : null; // Handle draw?
  }
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
        player.position = action.payload.position;
      }
    },
    updatePlayerPhysicsState: (state, action: PayloadAction<{ id: string; velocityX?: number; velocityY?: number; isGrounded?: boolean }>) => {
       const player = state.players.find(p => p.id === action.payload.id);
       if (player) {
         if (action.payload.velocityX !== undefined) player.velocityX = action.payload.velocityX;
         if (action.payload.velocityY !== undefined) player.velocityY = action.payload.velocityY;
         if (action.payload.isGrounded !== undefined) player.isGrounded = action.payload.isGrounded;
       }
    },
    movePlayer: (state, action: PayloadAction<{ playerId: string; direction: number }>) => {
      const player = state.players.find(p => p.id === action.payload.playerId);
      const moveSpeed = 3;
      if (player && player.isGrounded) {
        player.velocityX = action.payload.direction * moveSpeed;
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
        player.angle = Math.max(0, Math.min(180, player.angle + action.payload.delta));
      }
    },
    setAngle: (state, action: PayloadAction<{ playerId: string; angle: number }>) => {
      const player = state.players.find(p => p.id === action.payload.playerId);
      if (player) {
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
      if (!player || state.isProjectileInMotion || state.gameOver) return;

      const weapon = WEAPONS[player.currentWeapon];
      const currentTime = Date.now();

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
      // This is called when projectile goes out of bounds, doesn't cause explosion
      state.projectile = null;
      state.isProjectileInMotion = false;
      advanceTurn(state); // Advance turn even if projectile missed everything
    },
    checkCollision: (state) => {
      if (!state.projectile || !state.isProjectileInMotion || state.gameOver) return;

      const weapon = WEAPONS[state.projectile.weapon];
      const projX = state.projectile.x;
      const projY = state.projectile.y;
      const sourcePlayerId = state.currentTurn; // Player who shot

      let hitPlayer = null; // Track which player was hit directly

      for (const player of state.players) {
        // Don't check collision with the player who fired the shot initially
        // if (player.id === sourcePlayerId) continue; // Allow self-damage

        const hitLeft = player.position.x - player.hitbox.width / 2;
        const hitRight = player.position.x + player.hitbox.width / 2;
        const hitTop = player.position.y - player.hitbox.height / 2;
        const hitBottom = player.position.y + player.hitbox.height / 2;

        if (projX >= hitLeft && projX <= hitRight && projY >= hitTop && projY <= hitBottom) {
          hitPlayer = player;
          break; // Found the player hit
        }
      }

      if (hitPlayer) {
        // --- Direct Hit Occurred ---
        const explosionX = projX;
        const explosionY = projY;
        const explosionRadius = weapon.radius;
        const explosionDamage = weapon.damage;

        // Create main explosion visual
        state.explosions.push({
          x: explosionX, y: explosionY, radius: explosionRadius, currentFrame: 0, maxFrames: 20
        });
        audioManager.play('explosion'); // Play explosion sound on direct hit too

        // Handle cluster weapon special effect (visual only for now, damage is from main explosion)
        if (weapon.special?.type === 'cluster') {
          for (let i = 0; i < weapon.special.value; i++) {
            const angle = (Math.PI * 2 * i) / weapon.special.value;
            const distance = 30;
            state.explosions.push({
              x: explosionX + Math.cos(angle) * distance,
              y: explosionY + Math.sin(angle) * distance,
              radius: explosionRadius * 0.5, currentFrame: 0, maxFrames: 20
            });
          }
        }

        // Apply direct damage FIRST
        hitPlayer.health -= explosionDamage;
        audioManager.play('hit');
        if (hitPlayer.health <= 0) {
          hitPlayer.health = 0; // Clamp health
          // Check for game over immediately after direct hit damage
          const livingPlayers = state.players.filter(p => p.health > 0);
          if (livingPlayers.length <= 1) {
            state.gameOver = true;
            state.winner = livingPlayers.length === 1 ? livingPlayers[0].id : sourcePlayerId;
          }
        }

        // Apply explosion splash damage to ALL players (including the one hit, potentially again)
        // The helper function handles game over checks within it
        applyExplosionDamage(state, explosionX, explosionY, explosionRadius, explosionDamage, sourcePlayerId); // Removed unused variable assignment

        // Projectile is consumed
        state.projectile = null;
        state.isProjectileInMotion = false;

        // Advance turn if the game didn't end
        if (!state.gameOver) {
          advanceTurn(state);
        }
      }
    },
    resetGame: (state) => {
      // Reset players
      state.players.forEach(player => {
        player.health = 100;
        // Keep existing positions or reset them? Resetting for now.
        // player.position = { x: /* initial x */, y: /* initial y */ }; // Need initial positions
        player.angle = player.id === 'player1' ? 45 : 135; // Reset angle/power
        player.power = 50;
        player.lastShotTime = 0;
        player.weapons = ['cannon', 'rocket', 'mortar', 'grenade'];
        player.velocityX = 0;
        player.velocityY = 0;
        player.isGrounded = false;
      });

      // Reset game state
      state.gameOver = false;
      state.winner = null;
      state.currentTurn = state.players.length > 0 ? state.players[0].id : ''; // Start with player 1 if exists
      state.projectile = null;
      state.isProjectileInMotion = false;
      state.explosions = [];
      state.windSpeed = Math.random() * 2 - 1; // Reset wind

      // Re-initialize terrain (assuming dimensions are known or passed)
      // This part might need adjustment based on how dimensions are handled on reset
      if (state.terrain) {
         // Assuming terrain has width/height properties or can be recreated
         // state.terrain = createTerrainMap(state.terrain.width, state.terrain.height);
         // If dimensions aren't stored, this needs the Game component to dispatch initializeTerrain again
      }
      // Mark as uninitialized? Depends on Game component logic
      // state.isInitialized = false; // If Game component uses this flag
    },
    initializeTerrain: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.terrain = createTerrainMap(action.payload.width, action.payload.height);
      // Place players on the new terrain?
      // This might be better handled in the Game component after terrain is initialized
    },
    deformTerrain: (state, action: PayloadAction<{ x: number; y: number; radius: number }>) => {
      if (state.terrain) {
        state.terrain.deformTerrain(action.payload.x, action.payload.y, action.payload.radius);
      }
    },
    checkTerrainCollision: (state) => {
      if (!state.projectile || !state.terrain || state.gameOver) return;

      const weapon = WEAPONS[state.projectile.weapon];
      const projX = state.projectile.x;
      const projY = state.projectile.y;
      const sourcePlayerId = state.currentTurn;

      if (state.terrain.checkCollision(projX, projY)) {
        // Handle bounce weapon special effect
        if (weapon.special?.type === 'bounce' && state.projectile.bounces < weapon.special.value) {
          state.projectile.velocityY *= -0.6; // Bounce effect
          state.projectile.velocityX *= 0.8; // Lose some horizontal speed
          state.projectile.bounces++;
          // Move projectile slightly out of terrain to prevent immediate re-collision?
          // state.projectile.y -= 1; // Simple upward nudge
          return; // Don't explode yet
        }

        // Handle penetration weapon special effect
        if (weapon.special?.type === 'penetrate') {
          state.terrain.deformTerrain(projX, projY, weapon.radius * 0.5); // Smaller deformation?
          if (state.projectile.bounces < weapon.special.value) {
            state.projectile.bounces++;
            // Reduce velocity slightly?
            state.projectile.velocityX *= 0.9;
            state.projectile.velocityY *= 0.9;
            return; // Continue penetrating
          }
          // Explode after max penetrations
        }

        // --- Terrain Hit Explosion ---
        const explosionX = projX;
        const explosionY = projY;
        const explosionRadius = weapon.radius;
        const explosionDamage = weapon.damage;

        // Create explosion visual
        state.explosions.push({
          x: explosionX, y: explosionY, radius: explosionRadius, currentFrame: 0, maxFrames: 20
        });
        audioManager.play('explosion');

        // Deform terrain
        state.terrain.deformTerrain(explosionX, explosionY, explosionRadius);

        // Apply explosion splash damage to ALL players
        applyExplosionDamage(state, explosionX, explosionY, explosionRadius, explosionDamage, sourcePlayerId); // Removed unused variable assignment

        // Projectile is consumed
        state.projectile = null;
        state.isProjectileInMotion = false;

        // Advance turn if the game didn't end
        if (!state.gameOver) {
          advanceTurn(state);
        }
      }
    },
    addExplosion: (state, action: PayloadAction<{ x: number; y: number }>) => {
      // This seems like a manual way to add explosions, might not be needed if checkCollision/checkTerrainCollision handle it
      state.explosions.push({
        x: action.payload.x,
        y: action.payload.y,
        radius: 5, // Default small radius?
        currentFrame: 0,
        maxFrames: 20
      });
    },
    updateExplosions: (state) => {
      // Update animation frame and remove finished explosions
      state.explosions = state.explosions
        .map(exp => ({
          ...exp,
          currentFrame: exp.currentFrame + 1
        }))
        .filter(exp => exp.currentFrame < exp.maxFrames);
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
