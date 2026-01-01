
// CHECKPOINT: Defender V20.0
// VERSION: V20.0 - Advanced Lunar Mechanics
import { ShipConfig, Weapon, Shield, WeaponType, Planet, QuadrantType } from './types';

export const INITIAL_CREDITS = 50000;

export const SHIPS: ShipConfig[] = [
  {
    id: 'vanguard',
    name: 'Vanguard X-1',
    description: 'A balanced fighter suitable for most missions. Standard Earth Union issue.',
    price: 10000,
    maxEnergy: 100,
    maxCargo: 50,
    speed: 5,
    shape: 'arrow',
    canLayMines: false,
    defaultColor: '#10b981'
  },
  {
    id: 'interceptor',
    name: 'Interstelar Wasp',
    description: 'Extremely fast with high energy for laser systems. Low cargo space.',
    price: 25000,
    maxEnergy: 250,
    maxCargo: 30,
    speed: 8,
    shape: 'stealth',
    canLayMines: false,
    defaultColor: '#3b82f6'
  },
  {
    id: 'juggernaut',
    name: 'The Titan',
    description: 'Slow but heavy. Massive cargo and energy. The only ship capable of laying space mines.',
    price: 35000,
    maxEnergy: 400,
    maxCargo: 300,
    speed: 3,
    shape: 'mine-layer',
    canLayMines: true,
    defaultColor: '#f59e0b'
  },
  {
    id: 'wraith',
    name: 'Void Wraith',
    description: 'Experimental ship with high energy capacity but fragile hull.',
    price: 45000,
    maxEnergy: 600,
    maxCargo: 40,
    speed: 6,
    shape: 'wing',
    canLayMines: false,
    defaultColor: '#a855f7'
  },
  {
    id: 'hauler',
    name: 'Terra Hauler',
    description: 'Modified cargo ship. Huge ammo capacity but very slow.',
    price: 15000,
    maxEnergy: 100,
    maxCargo: 600,
    speed: 2,
    shape: 'block',
    canLayMines: false,
    defaultColor: '#94a3b8'
  }
];

export const WEAPONS: Weapon[] = [
  { id: 'gun_basic', name: 'Auto-Cannon', type: WeaponType.PROJECTILE, price: 5000, damage: 10, fireRate: 6, energyCost: 20, cargoWeight: 5, isAmmoBased: false },
  { id: 'laser_red', name: 'Ruby Beam', type: WeaponType.LASER, price: 12000, damage: 15, fireRate: 10, energyCost: 60, cargoWeight: 2, isAmmoBased: false },
  { id: 'missile_seeker', name: 'Stalker Missile', type: WeaponType.MISSILE, price: 1200, damage: 35, fireRate: 1.5, energyCost: 10, cargoWeight: 2, isAmmoBased: true },
  { id: 'mine_rack', name: 'Static Mine', type: WeaponType.MINE, price: 2000, damage: 120, fireRate: 0.5, energyCost: 5, cargoWeight: 5, isAmmoBased: true }
];

export const SHIELDS: Shield[] = [
  { id: 'shield_light', name: 'Plasma Skin', price: 3000, capacity: 100, regenRate: 2, energyCost: 10, visualType: 'forward' },
  { id: 'shield_heavy', name: 'Aegis Core', price: 10000, capacity: 500, regenRate: 5, energyCost: 30, visualType: 'full' }
];

const getBaseSpeed = (radius: number) => 0.0052 / Math.sqrt(radius);

export interface ExtendedPlanet extends Planet {
  atmosphereColor?: string;
}

export const PLANETS: ExtendedPlanet[] = [
  { 
    id: 'p1', name: 'Gliese Prime', description: 'A lush garden world and key human colony. Peaceful and high-tech.', 
    difficulty: 1, status: 'friendly', orbitRadius: 38, orbitSpeed: getBaseSpeed(38), orbitDirection: 1, size: 2.2, color: '#064e3b',
    quadrant: QuadrantType.ALFA,
    atmosphereColor: 'rgba(52, 211, 153, 0.3)',
    moons: [
      { id: 'm1_1', name: 'Gliese Alpha', difficulty: 1, angle: 0, distance: 65, color: '#94a3b8', size: 0.5, orbitDirection: 1, inclination: 0 },
      { id: 'm1_2', name: 'Gliese Beta', difficulty: 1, angle: 160, distance: 95, color: '#475569', size: 0.3, orbitDirection: 1, inclination: 0 }
    ]
  },
  { 
    id: 'p_alfa_3', name: 'Krios IV', description: 'Harsh rocky world used as an outpost.', 
    difficulty: 2, status: 'occupied', orbitRadius: 98, orbitSpeed: getBaseSpeed(98), orbitDirection: 1, size: 2.0, color: '#431407',
    quadrant: QuadrantType.ALFA, 
    moons: [
      { id: 'm_alfa_3_1', name: 'Krios Rock', difficulty: 2, angle: 45, distance: 60, color: '#334155', size: 0.4, orbitDirection: -1, inclination: 0 },
      { id: 'm_alfa_3_2', name: 'Krios Sentinel', difficulty: 2, angle: 180, distance: 90, color: '#1e293b', size: 0.3, orbitDirection: 1, inclination: 0 }
    ]
  },
  { 
    id: 'p2', name: 'Novus-7', description: 'A mining world completely overrun by hostile insectoids.', 
    difficulty: 3, status: 'occupied', orbitRadius: 28, orbitSpeed: getBaseSpeed(28), orbitDirection: 1, size: 1.5, color: '#450a0a',
    quadrant: QuadrantType.BETA, moons: [
      { id: 'm_beta_2_1', name: 'Obsidian', difficulty: 3, angle: 0, distance: 55, color: '#18181b', size: 0.4, orbitDirection: 1, inclination: 0 }
    ]
  },
  { 
    id: 'p_beta_3', name: 'Midas Prime', description: 'Rich in gold-based electronics. A high priority for the aliens.', 
    difficulty: 4, status: 'occupied', orbitRadius: 45, orbitSpeed: getBaseSpeed(45), orbitDirection: 1, size: 2.1, color: '#3f2b05',
    quadrant: QuadrantType.BETA,
    moons: [{ id: 'm_beta_3_1', name: 'Luster Moon', difficulty: 3, angle: 90, distance: 65, color: '#64748b', size: 0.35, orbitDirection: 1, inclination: 0 }]
  },
  { 
    id: 'p_beta_4', name: 'Vesperia', description: 'Cloud world with suspended research stations.', 
    difficulty: 4, status: 'siege', orbitRadius: 65, orbitSpeed: getBaseSpeed(65), orbitDirection: -1, size: 1.4, color: '#2e1065',
    quadrant: QuadrantType.BETA, moons: [],
    atmosphereColor: 'rgba(167, 139, 250, 0.3)'
  },
  { 
    id: 'p_beta_5', name: 'Iron Rock', description: 'Industrial graveyard. Useful for salvage.', 
    difficulty: 2, status: 'occupied', orbitRadius: 85, orbitSpeed: getBaseSpeed(85), orbitDirection: 1, size: 1.1, color: '#334155',
    quadrant: QuadrantType.BETA, moons: []
  },
  { 
    id: 'p_gama_2', name: 'Triton Station', description: 'The outer gateway to the Gama Quadrant.', 
    difficulty: 5, status: 'siege', orbitRadius: 35, orbitSpeed: getBaseSpeed(35), orbitDirection: -1, size: 1.0, color: '#075985',
    quadrant: QuadrantType.GAMA,
    moons: [],
    atmosphereColor: 'rgba(125, 211, 252, 0.2)'
  },
  { 
    id: 'p_gama_3', name: 'Nephthys', description: 'Dark volcanic world. Aliens are extracting core energy.', 
    difficulty: 6, status: 'occupied', orbitRadius: 55, orbitSpeed: getBaseSpeed(55), orbitDirection: 1, size: 1.5, color: '#450a0a',
    quadrant: QuadrantType.GAMA, moons: [],
    atmosphereColor: 'rgba(248, 113, 113, 0.3)'
  },
  { 
    id: 'p3', name: 'Calyx V', description: 'Gigantic crimson gas giant with multiple stable lunar orbits.', 
    difficulty: 0, status: 'occupied', orbitRadius: 80, orbitSpeed: getBaseSpeed(80), orbitDirection: 1, size: 4.0, color: '#b91c1c',
    quadrant: QuadrantType.GAMA, isGasGiant: true, hasRings: true,
    atmosphereColor: 'rgba(239, 68, 68, 0.2)',
    moons: [
      { id: 'm_gama_1', name: 'Aeolus', difficulty: 5, angle: 0, distance: 80, color: '#451a03', size: 0.8, orbitDirection: 1, inclination: 0 },
      { id: 'm_gama_2', name: 'Boreas', difficulty: 6, angle: 120, distance: 110, color: '#064e3b', size: 0.7, orbitDirection: 1, inclination: 0 },
      { id: 'm_gama_3', name: 'Zephyrus', difficulty: 5, angle: 240, distance: 140, color: '#082f49', size: 0.9, orbitDirection: -1, inclination: 0 }
    ]
  },
  { 
    id: 'p5', name: 'Xenon Rift', description: 'A nebula where the alien mothership was first spotted.', 
    difficulty: 8, status: 'occupied', orbitRadius: 45, orbitSpeed: getBaseSpeed(45), orbitDirection: 1, size: 1.8, color: '#5b21b6',
    quadrant: QuadrantType.DELTA, moons: []
  },
  { 
    id: 'p_delta_2', name: 'Abyssus', description: 'Pitch black world. Visibility is near zero.', 
    difficulty: 9, status: 'occupied', orbitRadius: 70, orbitSpeed: getBaseSpeed(70), orbitDirection: -1, size: 1.4, color: '#3f3f46',
    quadrant: QuadrantType.DELTA, moons: []
  },
  { 
    id: 'p_delta_3', name: 'Erebus Prime', description: 'A massive red gas giant looming in the dark.', 
    difficulty: 10, status: 'siege', orbitRadius: 105, orbitSpeed: getBaseSpeed(105), orbitDirection: 1, size: 4.5, color: '#ef4444',
    quadrant: QuadrantType.DELTA, isGasGiant: true, hasRings: true,
    atmosphereColor: 'rgba(220, 38, 38, 0.4)',
    moons: [
      { id: 'm_delta_3_1', name: 'Umbra', difficulty: 9, angle: 45, distance: 85, color: '#4b5563', size: 0.8, orbitDirection: 1, inclination: 0 },
      { id: 'm_delta_3_2', name: 'Phobos Delta', difficulty: 10, angle: 180, distance: 115, color: '#450a0a', size: 1.0, orbitDirection: 1, inclination: 0 }
    ]
  },
  { 
    id: 'p_delta_4', name: 'Styx', description: 'Hostile icy world. No warmth left.', 
    difficulty: 8, status: 'occupied', orbitRadius: 145, orbitSpeed: getBaseSpeed(145), orbitDirection: -1, size: 1.1, color: '#4b5563',
    quadrant: QuadrantType.DELTA, moons: [],
    atmosphereColor: 'rgba(148, 163, 184, 0.2)'
  },
  { 
    id: 'p_delta_6', name: 'Phlegethon', description: 'Rivers of fire. Hell on earth.', 
    difficulty: 10, status: 'occupied', orbitRadius: 185, orbitSpeed: getBaseSpeed(185), orbitDirection: -1, size: 1.3, color: '#7f1d1d',
    quadrant: QuadrantType.DELTA, moons: [],
    atmosphereColor: 'rgba(249, 115, 22, 0.3)'
  },
  { 
    id: 'p_delta_7', name: 'Acheron', description: 'The final barrier before the alien core.', 
    difficulty: 9, status: 'occupied', orbitRadius: 235, orbitSpeed: getBaseSpeed(235), orbitDirection: 1, size: 1.8, color: '#27272a',
    quadrant: QuadrantType.DELTA, moons: []
  }
];
