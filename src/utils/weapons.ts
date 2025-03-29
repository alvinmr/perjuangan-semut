export interface Weapon {
  id: string;
  name: string;
  damage: number;
  radius: number;
  velocity: number;
  reloadTime: number;
  special?: {
    type: 'cluster' | 'bounce' | 'penetrate';
    value: number;
  };
}

export const WEAPONS: { [key: string]: Weapon } = {
  cannon: {
    id: 'cannon',
    name: 'Cannon',
    damage: 25,
    radius: 30,
    velocity: 1,
    reloadTime: 1
  },
  rocket: {
    id: 'rocket',
    name: 'Rocket Launcher',
    damage: 35,
    radius: 40,
    velocity: 1.2,
    reloadTime: 2,
    special: {
      type: 'cluster',
      value: 3 // Creates 3 smaller explosions
    }
  },
  mortar: {
    id: 'mortar',
    name: 'Mortar',
    damage: 45,
    radius: 50,
    velocity: 0.8,
    reloadTime: 3,
    special: {
      type: 'penetrate',
      value: 2 // Can penetrate through terrain
    }
  },
  grenade: {
    id: 'grenade',
    name: 'Grenade Launcher',
    damage: 30,
    radius: 35,
    velocity: 0.9,
    reloadTime: 2,
    special: {
      type: 'bounce',
      value: 2 // Number of bounces before explosion
    }
  }
};