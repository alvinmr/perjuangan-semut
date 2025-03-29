import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '../store/store';
import { 
  addPlayer, 
  setCurrentTurn, 
  adjustAngle, 
  adjustPower, 
  shoot, 
  updateProjectile, 
  endProjectileMotion,
  checkCollision,
  resetGame,
  updateWindSpeed,
  initializeTerrain,
  checkTerrainCollision,
  updateExplosions,
  switchWeapon,
  setAngle, // Import setAngle
  movePlayer, // Import movePlayer
  updatePlayerPhysicsState, // Import physics update action
  updatePlayerPosition // Import position update action
} from '../store/gameSlice';
import { drawTerrain } from './Terrain';
import { drawPlayer } from './Player';
import { drawExplosion } from './Explosion';
import { WEAPONS } from '../utils/weapons';

const GameContainer = styled.div`
  width: 100%;
  /* height: 100vh; */ /* Let it inherit height from parent (#root) */
  height: 100%; 
  /* Remove flex centering */
  /* display: flex; */
  /* justify-content: center; */
  /* align-items: center; */
  background: #87CEEB; /* Keep background or adjust as needed */
  position: relative; /* Needed for absolute positioning of overlays */
  overflow: hidden; /* Prevent potential scrollbars from overlays */
`;

// Make canvas fill the container and position it correctly
const Canvas = styled.canvas`
  display: block; /* Remove extra space below canvas */
  width: 100%;
  height: 100%;
  border: none; /* Remove border or adjust as needed */
  /* border: 2px solid #000; */ 
`;

const GameOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
`;

const HealthBar = styled.div<{ health: number }>`
  width: 200px;
  height: 20px;
  background: #ddd;
  border: 2px solid #000;
  position: relative;
  
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

const GameOverScreen = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
`;

const ResetButton = styled.button`
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

const GameStats = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  display: flex;
  gap: 20px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  
  span:first-child {
    font-size: 0.8em;
    opacity: 0.8;
  }
  
  span:last-child {
    font-size: 1.2em;
    font-weight: bold;
  }
`;

const WindIndicator = styled.div`
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
`;

const WindArrow = styled.span<{ direction: number }>`
  transform: rotate(${props => props.direction < 0 ? '180deg' : '0deg'});
  font-size: 1.2em;
`;

const WeaponPanel = styled.div`
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const WeaponButton = styled.button<{ isActive: boolean }>`
  padding: 8px 12px;
  background: ${props => props.isActive ? '#2ecc71' : '#34495e'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.isActive ? '#27ae60' : '#2c3e50'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WeaponInfo = styled.div`
  font-size: 0.8em;
  color: #bdc3c7;
  margin-top: 2px;
`;

const ControlsOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 20px;
  border-radius: 10px;
  z-index: 100;
`;

const ControlsList = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 10px 20px;
  margin: 15px 0;
`;

const ControlItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const KeyHint = styled.span`
  background: #34495e;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
`;

const CloseButton = styled.button`
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

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null); // Ref for the container
  const animationFrameRef = useRef<number | undefined>(undefined);
  const dispatch = useDispatch();
  // Use state for dynamic dimensions, initialize reasonably or wait for resize
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 }); 
  const { players, currentTurn, projectile, gameOver, winner, windSpeed, terrain, explosions } = useSelector((state: RootState) => state.game);
  const [showControls, setShowControls] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // Track if initial setup is done

  const lastExplosionUpdateRef = useRef<number>(0);
  const lastProjectileUpdateRef = useRef<number>(performance.now());

  // Effect to handle resizing and initial setup
  useEffect(() => {
    const gameContainer = gameContainerRef.current;
    if (!gameContainer) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) { // Use const for entry
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });

        // Initialize or re-initialize game elements based on new dimensions
        // Debounce or throttle this if resize events are frequent and setup is expensive
        if (width > 0 && height > 0 && !isInitialized) {
          console.log(`Initializing game with dimensions: ${width}x${height}`);
          // Initialize terrain
          dispatch(initializeTerrain({ width, height }));
          
          // Initialize two players (adjust positions based on new width/height)
          const groundLevel = height - 50; // Example ground level calculation
          const playerY = groundLevel - 100; // Place player above ground
          const playerPadding = width * 0.1; // Padding from edges

          dispatch(addPlayer({
            id: 'player1',
            position: { x: playerPadding, y: playerY },
            health: 100,
            currentWeapon: 'cannon',
            angle: 45,
            power: 50,
            hitbox: { width: 30, height: 20 }
            // weapons: ['cannon', 'rocket', 'mortar', 'grenade'], // Removed: Handled by reducer
            // lastShotTime: 0 // Removed: Handled by reducer
          }));
          
          dispatch(addPlayer({
            id: 'player2',
            position: { x: width - playerPadding, y: playerY },
            health: 100,
            currentWeapon: 'cannon',
            angle: 135,
            power: 50,
            hitbox: { width: 30, height: 20 }
            // weapons: ['cannon', 'rocket', 'mortar', 'grenade'], // Removed: Handled by reducer
            // lastShotTime: 0 // Removed: Handled by reducer
          }));

          dispatch(setCurrentTurn('player1'));
          dispatch(updateWindSpeed(Math.random() * 2 - 1)); // Random wind between -1 and 1
          setIsInitialized(true); // Mark as initialized
        } else if (isInitialized) {
           // Handle potential re-initialization or adjustments on resize if needed
           // For now, we just update dimensions, game loop will use them
           // Consider if terrain/players need repositioning on resize after init
           console.log(`Resized to: ${width}x${height}`);
           // Example: Re-initialize terrain if needed, or adjust player positions
           // dispatch(initializeTerrain({ width, height })); 
        }
      }
    });

    resizeObserver.observe(gameContainer);

    // Initial size check in case ResizeObserver fires late
    const initialWidth = gameContainer.clientWidth;
    const initialHeight = gameContainer.clientHeight;
    if (initialWidth > 0 && initialHeight > 0 && !isInitialized) {
       setDimensions({ width: initialWidth, height: initialHeight });
       // Trigger initialization logic here as well if needed, duplicating the logic above
       // This part might be redundant if ResizeObserver fires immediately
    }


    return () => resizeObserver.disconnect();
  }, [dispatch, isInitialized]); // Rerun if dispatch changes (unlikely) or isInitialized changes

  // Separate effect for player initialization to depend on dimensions
  /* // Combined into resize effect to ensure dimensions are available
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || players.length > 0) return; // Don't init if no dimensions or players exist

    // Initialize terrain
    dispatch(initializeTerrain({ width: dimensions.width, height: dimensions.height }));
    
    // Initialize two players
    dispatch(addPlayer({
      id: 'player1',
      position: { x: 100, y: dimensions.height - 150 }, // Adjust positioning based on dynamic dimensions
      health: 100,
      currentWeapon: 'cannon',
      angle: 45, // Keep initial angle/power
      power: 50,
      hitbox: { width: 30, height: 20 }
    }));
    
    dispatch(addPlayer({
      id: 'player2',
      position: { x: dimensions.width - 100, y: dimensions.height - 150 }, // Adjust positioning
      health: 100,
      currentWeapon: 'cannon',
      angle: 135, // Keep initial angle/power
      power: 50,
      hitbox: { width: 30, height: 20 }
    }));

    dispatch(setCurrentTurn('player1'));
    dispatch(updateWindSpeed(Math.random() * 2 - 1)); 
  }, [dispatch, dimensions, players.length]); // Depend on dimensions and players.length
  */

  useEffect(() => {
    const windInterval = setInterval(() => {
      if (!gameOver) {
        dispatch(updateWindSpeed(Math.random() * 2 - 1));
      }
    }, 10000); // Change wind every 10 seconds

    return () => clearInterval(windInterval);
  }, [dispatch, gameOver]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!currentTurn || gameOver) return;

    switch (e.key) {
      case 'ArrowLeft':
        dispatch(adjustAngle({ playerId: currentTurn, delta: -1 }));
        break;
      case 'ArrowRight':
        dispatch(adjustAngle({ playerId: currentTurn, delta: 1 }));
        break;
      case 'ArrowUp':
        dispatch(adjustPower({ playerId: currentTurn, delta: 1 }));
        break;
      case 'ArrowDown':
        dispatch(adjustPower({ playerId: currentTurn, delta: -1 }));
        break;
      // Add A/D for movement
      case 'a':
      case 'A':
        if (currentTurn) dispatch(movePlayer({ playerId: currentTurn, direction: -1 }));
        break;
      case 'd':
      case 'D':
        if (currentTurn) dispatch(movePlayer({ playerId: currentTurn, direction: 1 }));
        break;
      case ' ': // Space bar
        // Prevent shooting while moving? Optional.
        // const player = players.find(p => p.id === currentTurn);
        // if (player && player.velocityX === 0) {
           dispatch(shoot({ playerId: currentTurn }));
        // }
        break;
      case '1':
      case '2':
      case '3':
      case '4': {
        const weaponIds = ['cannon', 'rocket', 'mortar', 'grenade'];
        const selectedWeapon = weaponIds[parseInt(e.key) - 1];
        if (selectedWeapon) {
          dispatch(switchWeapon({ playerId: currentTurn, weaponId: selectedWeapon }));
        }
        break;
      }
      case 'h': // Help key
        setShowControls(true);
        break;
    }
  }, [dispatch, currentTurn, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]); // Removed players dependency as it's checked inside

  // Key up handler to stop movement
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!currentTurn || gameOver) return;

    const player = players.find(p => p.id === currentTurn);
    if (!player) return;

    // Stop horizontal movement only if the released key is A or D and the player was moving in that direction
    if ((e.key === 'a' || e.key === 'A') && player.velocityX < 0) {
      dispatch(updatePlayerPhysicsState({ id: currentTurn, velocityX: 0 }));
    } else if ((e.key === 'd' || e.key === 'D') && player.velocityX > 0) {
      dispatch(updatePlayerPhysicsState({ id: currentTurn, velocityX: 0 }));
    }
  }, [dispatch, currentTurn, gameOver, players]);

  // Add key up listener
  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [handleKeyUp]);


  // Mouse move handler for aiming
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!currentTurn || gameOver || !gameContainerRef.current || !canvasRef.current) return;

    const currentPlayer = players.find(p => p.id === currentTurn);
    if (!currentPlayer) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    // Calculate mouse position relative to the canvas origin (top-left)
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    // Calculate angle from player position to mouse position
    const dx = mouseX - currentPlayer.position.x;
    const dy = mouseY - currentPlayer.position.y;
    
    // atan2 gives angle in radians from -PI to PI. Convert to degrees (0-360)
    // We want 0 degrees pointing right, 90 up, 180 left, 270 down.
    // atan2(y, x) gives angle relative to positive x-axis.
    // Since canvas y increases downwards, we use -dy for standard Cartesian coordinates.
    const angleRad = Math.atan2(-dy, dx); // Changed to const
    
    // Convert radians to degrees
    let angleDeg = angleRad * (180 / Math.PI);

    // Adjust angle to be within 0-360 range
    if (angleDeg < 0) {
      angleDeg += 360;
    }

    // Invert angle for typical artillery game (0 right, 90 up, 180 left)
    // And clamp between 0 and 180 as per game logic
    const finalAngle = Math.max(0, Math.min(180, angleDeg)); 

    dispatch(setAngle({ playerId: currentTurn, angle: finalAngle }));

  }, [dispatch, currentTurn, gameOver, players]); // Keep players dependency here

  // Add mouse move listener
  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Player physics update logic
  const updatePlayerPhysics = useCallback((playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player || !terrain) return;

    const gravity = 0.5;
    const friction = 0.85; // Slow down horizontal movement when grounded
    const airResistance = 0.99; // Slight horizontal slowdown in air

    let nextVelocityX = player.velocityX;
    let nextVelocityY = player.velocityY + gravity;
    let nextX = player.position.x + nextVelocityX;
    let nextY = player.position.y + nextVelocityY;
    let isGrounded = false;

    // Basic boundary checks (prevent going off-screen horizontally)
    const halfWidth = player.hitbox.width / 2;
    if (nextX - halfWidth < 0) {
      nextX = halfWidth;
      nextVelocityX = 0;
    } else if (nextX + halfWidth > dimensions.width) {
      nextX = dimensions.width - halfWidth;
      nextVelocityX = 0;
    }

    // Terrain Collision Check
    // Check slightly below the player's feet for grounding
    const groundCheckY = nextY + player.hitbox.height / 2 + 1; 
    if (terrain.checkCollision(nextX, groundCheckY)) {
      isGrounded = true;
      nextVelocityY = 0; 
      // Adjust Y to be exactly on terrain - find terrain height at nextX
      const terrainHeight = terrain.getTerrainHeightAt(nextX); 
      nextY = terrainHeight - player.hitbox.height / 2; // Place bottom of hitbox on terrain

      // Apply friction only when grounded and trying to stop
      if (Math.abs(player.velocityX) > 0) { // Check current velocity before update
         nextVelocityX *= friction;
         // Stop completely if velocity is very small
         if (Math.abs(nextVelocityX) < 0.1) {
           nextVelocityX = 0;
         }
      }
    } else {
      isGrounded = false;
      // Apply air resistance
      nextVelocityX *= airResistance;
    }

    // Dispatch updates if position or physics state changed
    if (nextX !== player.position.x || nextY !== player.position.y) {
       dispatch(updatePlayerPosition({ id: playerId, position: { x: nextX, y: nextY } }));
    }
    if (nextVelocityX !== player.velocityX || nextVelocityY !== player.velocityY || isGrounded !== player.isGrounded) {
       dispatch(updatePlayerPhysicsState({ 
         id: playerId, 
         velocityX: nextVelocityX, 
         velocityY: nextVelocityY, 
         isGrounded: isGrounded 
       }));
    }

  }, [players, terrain, dimensions.width, dispatch]);


  const updateProjectilePhysics = useCallback(() => {
    if (!projectile) return;

    const gravity = 0.5;
    
    const nextX = projectile.x + projectile.velocityX;
    const nextY = projectile.y + projectile.velocityY;
    const nextVelocityX = projectile.velocityX + (windSpeed * 0.05);
    const nextVelocityY = projectile.velocityY + gravity;

    // Check if projectile hits ground or goes out of bounds
    if (nextY > dimensions.height || 
        nextX < 0 || 
        nextX > dimensions.width || // Use dynamic width
        nextY < -500 // Add a ceiling check far above screen
        ) { 
      dispatch(endProjectileMotion());
      return;
    }

    // Batch update projectile state and collision checks
    dispatch(updateProjectile({
      x: nextX,
      y: nextY,
      velocityX: nextVelocityX,
      velocityY: nextVelocityY
    }));

    // Check for collisions immediately after updating position
    dispatch(checkCollision());
    dispatch(checkTerrainCollision());
  }, [projectile, dimensions.width, dimensions.height, dispatch, windSpeed]); // Depend on specific dimension values

  useEffect(() => {
    // Only run game loop if dimensions are set and initialized
    if (dimensions.width === 0 || dimensions.height === 0 || !isInitialized) {
      // Optionally clear canvas or show loading state
      const canvas = canvasRef.current;
       if (canvas) {
         const ctx = canvas.getContext('2d');
         if (ctx) {
           ctx.clearRect(0, 0, canvas.width, canvas.height); // Use canvas actual size
           ctx.fillStyle = '#333';
           ctx.fillRect(0, 0, canvas.width, canvas.height);
           ctx.fillStyle = 'white';
           ctx.textAlign = 'center';
           ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);
         }
       }
      return; // Don't start loop yet
    }

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Ensure canvas rendering size matches state dimensions
      // This is crucial because the element size (CSS) and drawing surface size (attributes) can differ
      if (canvas.width !== dimensions.width || canvas.height !== dimensions.height) {
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
      }


      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentTime = performance.now();

      // Clear canvas using dynamic dimensions
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw sky background using dynamic dimensions
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw terrain if initialized
      if (terrain) { // Reverted check: Just check if terrain exists
        // Ensure drawTerrain uses dimensions if needed internally
        drawTerrain(ctx, terrain); // Corrected arguments
      }

      // Draw players
      players.forEach(player => {
        // Ensure drawPlayer uses dimensions if needed internally
        // Corrected arguments: pass individual properties
        drawPlayer(ctx, player.position.x, player.position.y, player.angle, player.power, player.id === currentTurn); 
        
        // Update player physics (do this after drawing current state)
        // Rate limit this? Maybe not necessary unless performance issues arise
        updatePlayerPhysics(player.id);
      });

      // Update and draw projectile with rate limiting
      if (projectile) {
        ctx.beginPath();
        ctx.fillStyle = '#000000';
        ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Rate limit projectile updates to every 16ms (approximately 60fps)
        if (currentTime - lastProjectileUpdateRef.current >= 16) {
          updateProjectilePhysics();
          lastProjectileUpdateRef.current = currentTime;
        }
      }

      // Draw explosions
      explosions.forEach(explosion => {
        drawExplosion(ctx, explosion);
      });

      // Rate limit explosion updates to every 50ms
      if (currentTime - lastExplosionUpdateRef.current >= 50) {
        dispatch(updateExplosions());
        lastExplosionUpdateRef.current = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, players, currentTurn, projectile, updateProjectilePhysics, terrain, explosions, dispatch, isInitialized, updatePlayerPhysics]); // Add updatePlayerPhysics dependency

  const handleReset = () => {
    // Reset needs to re-trigger initialization with current dimensions
    setIsInitialized(false); // Mark as not initialized
    dispatch(resetGame()); // Clear game state
    // The resize effect will re-run due to isInitialized changing and re-setup the game
  };

  // Removed duplicate declaration below
  const currentPlayer = players.find(p => p.id === currentTurn);
  // Ensure currentPlayer and weapons exist before accessing
  const currentWeapon = currentPlayer && currentPlayer.currentWeapon && WEAPONS[currentPlayer.currentWeapon] 
    ? WEAPONS[currentPlayer.currentWeapon] 
    : null;

  return (
    // Add ref to the container
    <GameContainer ref={gameContainerRef}> 
      {isInitialized && ( // Only render overlays if initialized
        <>
          <GameOverlay>
            {players.map(player => (
          <HealthBar key={`health-${player.id}`} health={player.health}>
            {player.id === currentTurn && '➤'} {player.health}%
          </HealthBar>
        ))}
      </GameOverlay>
      
      <WindIndicator>
        <span>Wind:</span>
        <WindArrow direction={windSpeed}>➜</WindArrow>
        <span>{Math.abs(windSpeed).toFixed(2)}</span>
      </WindIndicator>

      {/* Canvas width/height attributes are now set in the gameLoop */}
      <Canvas 
        ref={canvasRef} 
        /* width={dimensions.width} */ /* Removed */
        /* height={dimensions.height} */ /* Removed */
      />

      {showControls && isInitialized && ( // Also check isInitialized
        <ControlsOverlay>
          <h2>Game Controls</h2>
          <CloseButton onClick={() => setShowControls(false)}>×</CloseButton>
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
          </ControlsList>
          <p>Press any key to start playing!</p>
        </ControlsOverlay>
      )}

      {currentPlayer && !gameOver && (
        <>
          <WeaponPanel>
            {Object.values(WEAPONS).map((weapon, index) => {
              // Defensive checks for currentPlayer and weapons array
              const isAvailable = currentPlayer?.weapons?.includes(weapon.id) ?? false;
              const isActive = currentPlayer?.currentWeapon === weapon.id;
              // Defensive check for lastShotTime
              const lastShotTime = currentPlayer?.lastShotTime ?? 0;
              const canUse = Date.now() - lastShotTime >= weapon.reloadTime * 1000;

              return (
                <div key={`weapon-${weapon.id}`}>
                  <WeaponButton
                    isActive={isActive}
                    disabled={!isAvailable || !canUse}
                    onClick={() => dispatch(switchWeapon({ playerId: currentTurn, weaponId: weapon.id }))}
                  >
                    {index + 1}. {weapon.name}
                  </WeaponButton>
                  {isActive && (
                    <WeaponInfo>
                      Damage: {weapon.damage} | Radius: {weapon.radius}
                      {weapon.special && ` | ${weapon.special.type}: ${weapon.special.value}`}
                    </WeaponInfo>
                  )}
                </div>
              );
            })}
          </WeaponPanel>

          <GameStats>
            <StatItem>
              <span>WEAPON</span>
              <span>{currentWeapon?.name}</span>
            </StatItem>
            <StatItem>
              <span>ANGLE</span>
              <span>{currentPlayer.angle}°</span>
            </StatItem>
            <StatItem>
              <span>POWER</span>
              <span>{currentPlayer.power}%</span>
            </StatItem>
          </GameStats>
        </>
      )}

      {gameOver && isInitialized && ( // Also check isInitialized
        <GameOverScreen>
          <h2>Game Over!</h2>
          <p>Player {winner} wins!</p>
          <ResetButton onClick={handleReset}>Play Again</ResetButton>
        </GameOverScreen>
      )}
      </> // Close conditional rendering fragment
     )} 
    </GameContainer>
  );
};

export default Game;
