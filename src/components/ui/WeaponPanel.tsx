import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { Player } from '../../store/gameSlice'; // Import Player type
import { WEAPONS } from '../../utils/weapons'; // Import WEAPONS, removed unused Weapon type
import { switchWeapon } from '../../store/gameSlice'; // Import switchWeapon action

export const WeaponPanelContainer = styled.div`
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
  z-index: 10; /* Ensure it's above canvas */
`;

export const WeaponButton = styled.button<{ isActive: boolean }>`
  padding: 8px 12px;
  background: ${props => props.isActive ? '#2ecc71' : '#34495e'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left; /* Align text left */
  width: 100%; /* Make buttons fill panel width */

  &:hover {
    background: ${props => props.isActive ? '#27ae60' : '#2c3e50'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const WeaponInfo = styled.div`
  font-size: 0.8em;
  color: #bdc3c7;
  margin-top: 2px;
`;

interface WeaponPanelProps {
  currentPlayer: Player | undefined;
  currentTurn: string; // Needed for dispatching switchWeapon
}

export const WeaponPanel: React.FC<WeaponPanelProps> = ({ currentPlayer, currentTurn }) => {
  const dispatch = useDispatch();

  if (!currentPlayer) {
    return null;
  }

  return (
    <WeaponPanelContainer>
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
    </WeaponPanelContainer>
  );
};
