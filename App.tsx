
// CHECKPOINT: Defender V5.60
// VERSION: V5.60 - Optimized Maps & Flickering Stars
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GameState, Planet, Moon, MissionType, ShipConfig, Weapon, Shield, GameSettings, EquippedWeapon, WeaponType, QuadrantType, ShipFitting } from './types';
import { INITIAL_CREDITS, SHIPS, WEAPONS, SHIELDS, PLANETS } from './constants';
import GameEngine from './components/GameEngine';
import LandingScene from './components/LandingScene';
import { getMissionBriefing } from './services/geminiService';
import { audioService } from './services/audioService';

const SAVE_KEY = 'raptor_save_v5_16';

const ShipIcon = ({ shape, isActive, color, weaponCount = 0, shield = null, canLayMines = false }: any) => {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {shield && (
        <circle cx="50" cy="50" r="45" fill="none" stroke={isActive ? "#60a5fa" : "#3f3f46"} strokeWidth="1" strokeDasharray="4 4" className="animate-spin-slow opacity-40" />
      )}
      <g transform="translate(50, 50) scale(0.8)" filter={isActive ? "url(#glow)" : ""}>
        <path
          d={
            shape === 'arrow' ? "M0,-40 L35,40 L0,25 L-35,40 Z" :
            shape === 'stealth' ? "M0,-45 L25,-10 L45,35 L0,20 L-45,35 L-25,-10 Z" :
            shape === 'block' ? "M-30,-30 L30,-30 L30,30 L-30,30 Z" :
            shape === 'mine-layer' ? "M-25,-35 L25,-35 L25,35 L-25,35 Z M-35,-10 L-25,-10 L-25,20 L-35,20 Z M25,-10 L35,-10 L35,20 L25,20 Z" :
            "M0,-35 C40,-35 50,15 45,40 L0,20 L-45,40 C-50,15 -40,-35 0,-35" // wing
          }
          fill={color}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="2"
        />
        <ellipse cx="0" cy={shape === 'block' ? "0" : "-5"} rx="6" ry="10" fill="rgba(0,0,0,0.4)" />
        {weaponCount > 0 && (
          <g fill="#71717a">
            <rect x="-42" y="10" width="4" height="15" />
            <rect x="38" y="10" width="4" height="15" />
          </g>
        )}
        {canLayMines && <circle cx="0" cy="30" r="5" fill="#f59e0b" />}
      </g>
    </svg>
  );
};

const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-zinc-900 border-2 border-zinc-700 w-full max-w-2xl p-8 rounded-lg shadow-2xl space-y-6">
      <h3 className="retro-font text-2xl text-emerald-400 border-b border-zinc-800 pb-4 uppercase tracking-widest text-left">Tactical Manual</h3>
      <div className="grid grid-cols-2 gap-8 text-[11px] font-mono text-zinc-300 text-left">
        <div className="space-y-4">
          <p className="text-emerald-500 font-bold uppercase">Navigation</p>
          <ul className="space-y-2 list-disc pl-4">
            <li>WASD or Arrows: Move</li>
            <li>Space: Primary Weapons</li>
            <li>1, 2, 3: Weapon Groups</li>
            <li>ESC: Pause Menu</li>
          </ul>
        </div>
        <div className="space-y-4">
          <p className="text-blue-500 font-bold uppercase">Combat Rules</p>
          <ul className="space-y-2 list-disc pl-4">
            <li>Shields regenerate when not hit</li>
            <li>Laser/Cannon: Unlimited</li>
            <li>Missiles/Mines: Buy Ammo</li>
            <li>Pick up HP/Ammo drops</li>
          </ul>
        </div>
      </div>
      <button onClick={onClose} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white retro-font text-xs uppercase tracking-widest transition-all">Close Manual</button>
    </div>
  </div>
);

const SettingsModal = ({ gameState, onUpdateGameState, onUpdateSettings, onClose }: any) => {
  const resetGame = () => {
    if (confirm("CRITICAL: ALL MISSION DATA WILL BE PURGED. RESET FLEET?")) {
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-zinc-900 border-2 border-zinc-700 w-full max-w-xl p-8 rounded shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
        <h3 className="retro-font text-xl text-blue-400 uppercase tracking-widest border-b border-zinc-800 pb-4">Terminal Config</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
             <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2">Pilot Name</label>
                <input 
                  type="text" 
                  maxLength={12}
                  value={gameState.pilotName} 
                  onChange={(e) => onUpdateGameState({ pilotName: e.target.value.toUpperCase() })}
                  className="w-full bg-black border border-zinc-700 text-emerald-400 p-3 retro-font text-[10px] outline-none focus:border-emerald-500"
                />
             </div>
             <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-3">Service Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                  {['👨‍🚀', '👩‍🚀', '👾', '🤖', '🚀', '👽', '💀', '💂'].map(a => (
                    <button 
                      key={a} 
                      onClick={() => onUpdateGameState({ pilotAvatar: a })}
                      className={`w-10 h-10 flex items-center justify-center text-xl rounded border transition-all ${gameState.pilotAvatar === a ? 'bg-emerald-900/40 border-emerald-500' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-black/40 border border-zinc-800 rounded">
                   <span className="text-[10px] font-mono text-zinc-300 uppercase">Autosave</span>
                   <button 
                    onClick={() => onUpdateSettings({ autosaveEnabled: !gameState.settings.autosaveEnabled })}
                    className={`px-3 py-1 rounded text-[9px] retro-font transition-all ${gameState.settings.autosaveEnabled ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
                   >
                     {gameState.settings.autosaveEnabled ? 'ON' : 'OFF'}
                   </button>
                </div>
                <div className="flex justify-between items-center p-3 bg-black/40 border border-zinc-800 rounded">
                   <span className="text-[10px] font-mono text-zinc-300 uppercase">Audio</span>
                   <button 
                    onClick={() => onUpdateSettings({ musicEnabled: !gameState.settings.musicEnabled })}
                    className={`px-3 py-1 rounded text-[9px] retro-font transition-all ${gameState.settings.musicEnabled ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
                   >
                     {gameState.settings.musicEnabled ? 'ACTIVE' : 'MUTED'}
                   </button>
                </div>
             </div>
             
             <div className="pt-4 border-t border-zinc-800">
                <button 
                  onClick={resetGame}
                  className="w-full py-4 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 retro-font text-[9px] uppercase tracking-widest transition-all"
                >
                  Purge Mission Data
                </button>
             </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white retro-font text-[10px] uppercase tracking-widest border-b-4 border-blue-900 shadow-xl transition-all">Synchronize Terminal</button>
      </div>
    </div>
  );
};

const SystemMenuModal = ({ onResume, onReturnToCommand, onExitToTitle }: { onResume: () => void, onReturnToCommand: () => void, onExitToTitle: () => void }) => (
  <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
    <div className="bg-zinc-900 border-4 border-zinc-800 max-sm w-full p-8 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col items-center space-y-10 animate-in zoom-in-90 duration-150">
      <div className="text-center space-y-2">
        <h3 className="retro-font text-xl text-emerald-500 uppercase tracking-tighter">System Intercept</h3>
        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Awaiting Command Input...</p>
      </div>
      
      <div className="w-full space-y-4">
        <button 
          onClick={onResume}
          className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white border-b-4 border-zinc-950 retro-font text-[10px] uppercase tracking-widest transition-all"
        >
          Resume Operations
        </button>
        <button 
          onClick={onReturnToCommand}
          className="w-full py-4 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-900/50 retro-font text-[9px] uppercase tracking-widest transition-all"
        >
          Return to Hangar
        </button>
        <button 
          onClick={onExitToTitle}
          className="w-full py-4 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 retro-font text-[9px] uppercase tracking-widest transition-all"
        >
          Save & Exit
        </button>
      </div>

      <div className="pt-4 border-t border-zinc-800 w-full text-center">
         <span className="text-[8px] font-mono text-zinc-600 uppercase">Sector Data Synchronization Active</span>
      </div>
    </div>
  </div>
);

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.3,
  sfxVolume: 0.5,
  musicEnabled: true,
  sfxEnabled: true,
  displayMode: 'windowed',
  autosaveEnabled: true
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    const baseState: GameState = {
      credits: INITIAL_CREDITS,
      selectedShipId: 'vanguard',
      ownedShips: ['vanguard'],
      shipFittings: {
        'vanguard': { weapons: [], shieldId: null }
      },
      shipColors: {},
      currentPlanet: null,
      currentMoon: null,
      currentMission: null,
      currentQuadrant: QuadrantType.ALFA,
      conqueredMoonIds: [],
      shipMapPosition: {
        [QuadrantType.ALFA]: { x: 50, y: 50 },
        [QuadrantType.BETA]: { x: 50, y: 50 },
        [QuadrantType.GAMA]: { x: 50, y: 50 },
        [QuadrantType.DELTA]: { x: 50, y: 50 },
      },
      shipRotation: 0,
      orbitingEntityId: null,
      orbitAngle: 0,
      dockedPlanetId: null,
      tutorialCompleted: false,
      settings: DEFAULT_SETTINGS,
      taskForceShipIds: [],
      activeTaskForceIndex: 0,
      pilotName: 'STRIKER',
      pilotAvatar: '👨‍🚀'
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...baseState,
        ...parsed,
        settings: { ...baseState.settings, ...(parsed.settings || {}) }
      };
    }
    return baseState;
  });

  const [screen, setScreenState] = useState<'intro' | 'hangar' | 'galaxy_map' | 'map' | 'briefing' | 'game' | 'results' | 'landing'>('intro');
  const [briefing, setBriefing] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; reward: number } | null>(null);
  const [activeOrdnanceTab, setActiveOrdnanceTab] = useState<'energy' | 'explosive' | 'defense'>('energy');
  const [hangarTab, setHangarTab] = useState<'specs' | 'fitting'>('specs');
  const [mobileHangarView, setMobileHangarView] = useState<'fleet' | 'profile'>('fleet');
  
  const [isTaskForceVisible, setIsTaskForceVisible] = useState(true);
  const [isObjectListVisible, setIsObjectListVisible] = useState(true);

  const setScreen = useCallback((newScreen: typeof screen) => {
    if (newScreen !== screen) {
      audioService.playSfx('transition');
      setScreenState(newScreen);
    }
  }, [screen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (screen === 'galaxy_map' || screen === 'map') {
          audioService.playSfx('click');
          setIsSystemMenuOpen(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen]);

  const saveGame = useCallback(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    if (gameState.settings.autosaveEnabled) {
      saveGame();
    }
  }, [gameState, saveGame]);

  useEffect(() => {
    audioService.setEnabled(gameState.settings.musicEnabled);
    audioService.updateVolume(gameState.settings.musicVolume);
  }, [gameState.settings.musicEnabled, gameState.settings.musicVolume]);

  useEffect(() => {
    switch (screen) {
      case 'intro': audioService.playTrack('intro'); break;
      case 'hangar': audioService.playTrack('command'); break;
      case 'galaxy_map':
      case 'map': audioService.playTrack('map'); break;
      case 'game': audioService.playTrack('combat'); break;
      default: break;
    }
  }, [screen]);

  const activeShipId = useMemo(() => {
    if (screen === 'game' || screen === 'map' || screen === 'briefing') {
      return gameState.taskForceShipIds[gameState.activeTaskForceIndex] || gameState.selectedShipId;
    }
    return gameState.selectedShipId;
  }, [screen, gameState.taskForceShipIds, gameState.activeTaskForceIndex, gameState.selectedShipId]);

  const currentShip = useMemo(() => SHIPS.find(s => s.id === activeShipId), [activeShipId]);
  const selectedHangarShip = useMemo(() => SHIPS.find(s => s.id === gameState.selectedShipId), [gameState.selectedShipId]);

  const getShipFitting = useCallback((shipId: string): ShipFitting => {
    return gameState.shipFittings[shipId] || { weapons: [], shieldId: null };
  }, [gameState.shipFittings]);

  const selectShip = (id: string) => {
    audioService.playSfx('click');
    setGameState(prev => ({ ...prev, selectedShipId: id }));
  };

  const buyShip = (id: string) => {
    const ship = SHIPS.find(item => item.id === id)!;
    if (gameState.ownedShips.length >= 3) { audioService.playSfx('denied'); alert("FLEET FULL"); return; }
    if (gameState.credits >= ship.price) {
      audioService.playSfx('buy');
      setGameState(prev => ({ ...prev, credits: prev.credits - ship.price, ownedShips: [...prev.ownedShips, id], shipFittings: { ...prev.shipFittings, [id]: { weapons: [], shieldId: null } } }));
    } else { audioService.playSfx('denied'); }
  };

  const sellShip = (id: string) => {
    audioService.playSfx('buy');
    const ship = SHIPS.find(s => s.id === id)!;
    const refund = Math.floor(ship.price * 0.6);
    setGameState(prev => {
      const newOwned = prev.ownedShips.filter(sId => sId !== id);
      return { ...prev, credits: prev.credits + refund, ownedShips: newOwned, selectedShipId: newOwned.length > 0 ? newOwned[0] : prev.selectedShipId };
    });
  };

  const setWeaponCount = (weaponId: string, count: number) => {
    const shipId = gameState.selectedShipId;
    if (!shipId) return;
    const w = WEAPONS.find(item => item.id === weaponId)!;
    const currentFitting = getShipFitting(shipId);
    const weaponEntry = currentFitting.weapons.find(ew => ew.id === weaponId);
    const prevCount = weaponEntry?.count || 0;
    const costDiff = (count - prevCount) * w.price;
    if (costDiff > gameState.credits) { audioService.playSfx('denied'); return; }
    setGameState(prev => {
      const shipId = prev.selectedShipId!;
      const fitting = prev.shipFittings[shipId] || { weapons: [], shieldId: null };
      const newWeapons = [...fitting.weapons];
      const index = newWeapons.findIndex(ew => ew.id === weaponId);
      if (index > -1) newWeapons[index] = { ...newWeapons[index], count };
      else newWeapons.push({ id: weaponId, count });
      return { ...prev, credits: prev.credits - costDiff, shipFittings: { ...prev.shipFittings, [shipId]: { ...fitting, weapons: newWeapons.filter(ew => ew.count > 0) } } };
    });
  };

  const setEquippedShield = (shieldId: string) => {
    const shipId = gameState.selectedShipId;
    if (!shipId) return;
    const currentFitting = getShipFitting(shipId);
    if (currentFitting.shieldId === shieldId) {
      setGameState(prev => ({ ...prev, shipFittings: { ...prev.shipFittings, [shipId]: { ...prev.shipFittings[shipId], shieldId: null } } }));
      return;
    }
    const s = SHIELDS.find(item => item.id === shieldId)!;
    if (gameState.credits >= s.price) {
      audioService.playSfx('buy');
      setGameState(prev => ({ ...prev, credits: prev.credits - s.price, shipFittings: { ...prev.shipFittings, [shipId]: { ...prev.shipFittings[shipId], shieldId: shieldId } } }));
    } else { audioService.playSfx('denied'); }
  };

  const updateGameState = (updates: Partial<GameState>) => { setGameState(prev => ({ ...prev, ...updates })); };

  const onArrival = async (entity: any) => {
    if (gameState.taskForceShipIds.length === 0) { alert("TASK FORCE DEPLETED"); return; }
    if (entity?.id === 'sun') return; 
    audioService.playSfx('click');
    setIsLoading(true);
    
    let targetPlanet: Planet | null = null;
    let targetMoon: Moon | null = null;
    let missionType = MissionType.ATTACK;
    let targetName = "Unknown Target";

    if (entity?.id === 'comet_boss') {
      missionType = MissionType.COMET;
      targetName = "NEMESIS COMET";
    } else if (entity && 'moons' in entity) {
      targetPlanet = entity as Planet;
      targetName = targetPlanet.name;
    } else if (entity) {
      targetMoon = entity as Moon;
      targetPlanet = PLANETS.find(p => p.moons.some(m => m.id === targetMoon?.id)) || null;
      targetName = targetMoon.name;
    }

    setGameState(prev => ({ 
      ...prev, 
      currentPlanet: targetPlanet, 
      currentMoon: targetMoon, 
      currentMission: missionType
    }));
    
    const briefingText = missionType === MissionType.COMET 
      ? "COMM-INTERCEPT: Massive celestial body detected on collision course. Solar pressure has ignited its atmosphere into a lethal plasma tail. Destroy the nucleus before it escapes the sector."
      : await getMissionBriefing(targetName, MissionType.ATTACK);

    setBriefing(briefingText);
    setIsLoading(false);
    setScreen('briefing');
  };

  const onGameOver = (success: boolean) => {
    const targetDifficulty = (gameState.currentMoon?.difficulty || gameState.currentPlanet?.difficulty || 1);
    const reward = success ? (gameState.currentMission === MissionType.COMET ? 35000 : targetDifficulty * 8000) : 1000;
    setLastResult({ success, reward });
    setGameState(prev => {
      const newConquered = success && prev.currentMoon ? [...prev.conqueredMoonIds, prev.currentMoon.id] : prev.conqueredMoonIds;
      let newTaskForce = [...prev.taskForceShipIds];
      if (!success) newTaskForce.splice(prev.activeTaskForceIndex, 1);
      return { 
        ...prev, 
        credits: prev.credits + reward, 
        conqueredMoonIds: Array.from(new Set(newConquered)), 
        tutorialCompleted: true,
        taskForceShipIds: newTaskForce, 
        activeTaskForceIndex: Math.max(0, Math.min(prev.activeTaskForceIndex, newTaskForce.length - 1))
      };
    });
    setScreen('results');
  };

  const showHeader = useMemo(() => { if (screen === 'intro' || screen === 'landing') return false; if (screen === 'game' && gameState.settings.displayMode === 'fullscreen') return false; return true; }, [screen, gameState.settings.displayMode]);
  const sectorPlanets = useMemo(() => PLANETS.filter(p => p.quadrant === gameState.currentQuadrant), [gameState.currentQuadrant]);

  const introStars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.05 + 0.02
    }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-0 bg-zinc-950 text-emerald-50 overflow-hidden select-none">
      {showHeader && (
        <div className="fixed top-0 left-0 right-0 p-0 bg-zinc-900/80 backdrop-blur border-b border-zinc-700 grid grid-cols-3 items-center z-50 h-16 px-6">
          <div className="flex flex-col justify-center text-left">
            <div className="retro-font text-[10px] md:text-sm text-emerald-400 uppercase tracking-tighter">GALACTIC DEFENDER</div>
            <div className="text-[8px] text-zinc-500 font-mono uppercase">SYSTEM REV. V5.60</div>
          </div>
          <div className="flex items-center justify-center gap-3">
             <div className="w-10 h-10 rounded border border-zinc-700 bg-black flex items-center justify-center text-xl">{gameState.pilotAvatar}</div>
             <div className="flex flex-col hidden sm:flex text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-tighter">Command Authority</span>
                <span className="retro-font text-[10px] text-white uppercase">{gameState.pilotName}</span>
             </div>
             
             {currentShip && (
               <div className="flex flex-col border-l border-zinc-800 pl-3 hidden lg:flex text-left animate-in fade-in duration-500">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-tighter">Active Vessel</span>
                  <span className="retro-font text-[10px] text-blue-400 uppercase">{currentShip.name}</span>
               </div>
             )}

             {screen === 'map' && (
               <div className="flex gap-2 ml-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {!isObjectListVisible && (
                    <button onClick={() => setIsObjectListVisible(true)} className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 text-[8px] retro-font text-emerald-400 hover:bg-emerald-800/40 transition-all rounded shadow-[0_0_10px_rgba(16,185,129,0.1)]">RECOVER SENSORS</button>
                  )}
                  {!isTaskForceVisible && (
                    <button onClick={() => setIsTaskForceVisible(true)} className="px-3 py-1.5 bg-blue-950/40 border border-blue-500/30 text-[8px] retro-font text-blue-400 hover:bg-blue-800/40 transition-all rounded shadow-[0_0_10px_rgba(59,130,246,0.1)]">RECOVER FLEET</button>
                  )}
               </div>
             )}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">Budget Term</span>
            <span className="retro-font text-xs md:text-lg text-yellow-400">₿{gameState.credits.toLocaleString()}</span>
          </div>
        </div>
      )}

      <main className={`w-full flex flex-col items-center transition-all ${showHeader ? 'h-[calc(100vh-64px)] mt-16' : 'h-screen mt-0'} ${screen === 'game' && gameState.settings.displayMode === 'fullscreen' ? 'h-screen' : ''} overflow-hidden`}>
        {screen === 'intro' && (
          <div className="relative w-full h-full flex flex-col items-center overflow-hidden bg-black">
            <div className="absolute inset-0 z-0">
               {introStars.map((s, i) => (
                 <div 
                   key={i} 
                   className="absolute bg-white rounded-full opacity-60 animate-pulse"
                   style={{ 
                     left: s.x + '%', 
                     top: s.y + '%', 
                     width: s.size + 'px', 
                     height: s.size + 'px',
                     animationDelay: (Math.random() * 5) + 's'
                   }} 
                 />
               ))}
            </div>

            <div className="z-20 mt-12 md:mt-20 text-center px-4">
              <h1 className="retro-font text-3xl md:text-7xl text-emerald-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)] uppercase animate-in slide-in-from-top duration-1000">Galactic Defender</h1>
              <div className="h-1 w-32 md:w-64 bg-emerald-600 mx-auto mt-4 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>

            <div className="z-10 flex-grow w-full max-w-4xl relative overflow-hidden mt-4">
              <div className="absolute inset-0 flex justify-center">
                <div className="w-[80%] md:w-[60%] text-center text-yellow-400 retro-font text-[12px] md:text-lg uppercase leading-loose animate-crawl">
                  <p className="mb-20">A long time ago in a sector far, far away...</p>
                  <p className="mb-20">The Earth Union has expanded its reach to the stars, colonizing distant worlds in the Gamma and Delta sectors.</p>
                  <p className="mb-20">But a mysterious alien force has emerged from the shadows of the Xenon Rift. Colonized worlds are falling one by one.</p>
                  <p className="mb-20">As a top-tier pilot of the Union Task Force, you are our only hope to stabilize the colony network.</p>
                  <p className="mb-20">Defend the colonies. Reclaim our future. Good luck, Commander.</p>
                </div>
              </div>
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent pointer-events-none z-30" />
            </div>

            <div className="z-50 w-full max-w-2xl px-8 pb-12 md:pb-20 flex flex-col md:flex-row gap-6 mt-auto">
               <button 
                onClick={() => { audioService.playSfx('click'); setScreen('hangar'); }} 
                className="flex-1 retro-font bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-5 rounded-sm border-b-4 border-emerald-800 active:translate-y-1 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] text-xs md:text-base uppercase tracking-widest"
              >
                Initialize
              </button>
              {gameState.tutorialCompleted && (
                <button 
                  onClick={() => { audioService.playSfx('click'); setScreen('galaxy_map'); }} 
                  className="flex-1 retro-font bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-sm border-b-4 border-blue-800 active:translate-y-1 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] text-xs md:text-base uppercase tracking-widest"
                >
                  Resume
                </button>
              )}
            </div>

            <style>{`
              @keyframes crawl {
                0% { transform: translateY(100%); }
                100% { transform: translateY(-150%); }
              }
              .animate-crawl { animation: crawl 45s linear infinite; }
            `}</style>
          </div>
        )}

        {screen === 'hangar' && (
          <div className="w-full h-full max-w-7xl px-4 py-4 md:py-8 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center mb-0 md:mb-2 shrink-0">
               <h2 className="retro-font text-lg md:text-2xl text-zinc-400 uppercase tracking-[0.2em]">Fleet Operations</h2>
               <div className="flex md:hidden bg-zinc-800 rounded p-1">
                 <button onClick={() => setMobileHangarView('fleet')} className={`px-4 py-2 retro-font text-[8px] rounded ${mobileHangarView === 'fleet' ? 'bg-emerald-600 text-white' : 'text-zinc-500'}`}>FLEET</button>
                 <button onClick={() => setMobileHangarView('profile')} className={`px-4 py-2 retro-font text-[8px] rounded ${mobileHangarView === 'profile' ? 'bg-emerald-600 text-white' : 'text-zinc-500'}`}>PILOT</button>
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-grow min-h-0">
               <div className={`bg-zinc-900 border border-zinc-700 rounded-lg flex flex-col overflow-hidden shadow-2xl transition-all ${mobileHangarView === 'fleet' ? 'flex h-[310px] md:h-full md:w-1/3' : 'hidden md:flex md:w-1/3'}`}>
                  <div className="p-4 border-b border-zinc-800 bg-zinc-800/20 flex justify-between items-center shrink-0">
                    <h3 className="retro-font text-[10px] text-zinc-400 uppercase tracking-tighter">Vessel Registry</h3>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{gameState.ownedShips.length}/3 IN USE</span>
                  </div>
                  <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-0">
                    {SHIPS.map(ship => {
                      const isOwned = gameState.ownedShips.includes(ship.id);
                      const isSelected = gameState.selectedShipId === ship.id;
                      const shipFitting = isOwned ? getShipFitting(ship.id) : { weapons: [], shieldId: null };
                      return (
                        <div key={ship.id} onClick={() => selectShip(ship.id)} className={`p-4 border-2 rounded transition-all cursor-pointer flex justify-between items-center ${isSelected ? 'border-emerald-500 bg-emerald-900/10' : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-600'}`}>
                          <div className="flex flex-col text-left"><span className={`font-bold text-xs uppercase ${isSelected ? 'text-emerald-400' : 'text-zinc-300'}`}>{ship.name}</span><span className="text-[9px] text-zinc-500 uppercase font-mono">{isOwned ? 'ACTIVE' : 'AVAILABLE'}</span></div>
                          <div className="w-10 h-10"><ShipIcon shape={ship.shape} isActive={isSelected} color={gameState.shipColors[ship.id] || ship.defaultColor || '#10b981'} weaponCount={shipFitting.weapons.reduce((a,b)=>a+b.count, 0)} shield={SHIELDS.find(s=>s.id===shipFitting.shieldId)} canLayMines={ship.canLayMines}/></div>
                        </div>
                      );
                    })}
                  </div>
               </div>

               <div className={`bg-zinc-900 border border-zinc-700 rounded-lg flex flex-col overflow-hidden shadow-2xl transition-all ${mobileHangarView === 'fleet' ? 'flex flex-1 md:w-1/3' : 'hidden md:flex md:w-1/3'}`}>
                  <div className="flex bg-black/40 border-b border-zinc-800 shrink-0">
                    <button onClick={() => setHangarTab('specs')} className={`flex-1 py-4 retro-font text-[9px] uppercase tracking-tighter transition-colors ${hangarTab === 'specs' ? 'text-emerald-400 bg-emerald-900/10' : 'text-zinc-600 hover:text-zinc-400'}`}>SPECS</button>
                    <button onClick={() => setHangarTab('fitting')} className={`flex-1 py-4 retro-font text-[9px] uppercase tracking-tighter transition-colors ${hangarTab === 'fitting' ? 'text-emerald-400 bg-emerald-900/10' : 'text-zinc-600 hover:text-zinc-400'}`}>FITTING</button>
                  </div>
                  <div className="flex-grow overflow-y-auto p-5 custom-scrollbar flex flex-col min-h-0">
                    {selectedHangarShip ? (
                      hangarTab === 'specs' ? (
                        <div className="flex flex-col h-full animate-in fade-in duration-300">
                           <div className="flex flex-col items-center gap-4 md:gap-6 mb-4 md:mb-8 mt-2 shrink-0">
                              <div className="w-24 h-24 md:w-32 md:h-32 p-4 bg-black/40 rounded-full border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                                <ShipIcon shape={selectedHangarShip.shape} isActive={true} color={gameState.shipColors[selectedHangarShip.id] || selectedHangarShip.defaultColor || '#10b981'} weaponCount={gameState.ownedShips.includes(selectedHangarShip.id) ? getShipFitting(selectedHangarShip.id).weapons.reduce((a,b)=>a+b.count, 0) : 0} shield={gameState.ownedShips.includes(selectedHangarShip.id) ? SHIELDS.find(s=>s.id===getShipFitting(selectedHangarShip.id).shieldId) : null} canLayMines={selectedHangarShip.canLayMines}/>
                              </div>
                              <div className="text-center">
                                <span className="text-[10px] retro-font text-emerald-400 uppercase tracking-widest">{selectedHangarShip.name}</span>
                                <p className="text-[9px] font-mono text-zinc-500 mt-2 italic uppercase line-clamp-2 md:line-clamp-none">"{selectedHangarShip.description}"</p>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3 md:gap-4 mb-auto">
                              <div className="p-3 bg-black/20 border border-zinc-800 rounded text-left">
                                <span className="text-[7px] font-mono text-zinc-500 uppercase block mb-1">Combat Role</span>
                                <span className="text-[10px] retro-font text-blue-400 uppercase">{selectedHangarShip.id === 'hauler' ? 'TRANSPORT' : selectedHangarShip.id === 'interceptor' ? 'SPEED' : 'MULTI-ROLE'}</span>
                              </div>
                              <div className="p-3 bg-black/20 border border-zinc-800 rounded text-left">
                                <span className="text-[10px] retro-font text-red-400 uppercase">{selectedHangarShip.speed * 10} KM/S</span>
                              </div>
                           </div>
                           <div className="mt-6 md:mt-8 shrink-0 pb-4 md:pb-0">
                             {gameState.ownedShips.includes(selectedHangarShip.id) ? (
                               <button onClick={() => sellShip(selectedHangarShip.id)} className="w-full py-4 bg-red-900/20 hover:bg-red-900/40 text-red-500 border-2 border-red-900/50 retro-font text-[9px] uppercase tracking-widest transition-all">DECOMMISSION (₿{Math.floor(selectedHangarShip.price * 0.6)})</button>
                             ) : (
                               <button onClick={() => buyShip(selectedHangarShip.id)} className="w-full py-4 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border-2 border-blue-900/50 retro-font text-[9px] uppercase tracking-widest transition-all">ACQUIRE (₿{selectedHangarShip.price.toLocaleString()})</button>
                             )}
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-6 animate-in fade-in duration-300">
                          <div className="flex border-b border-zinc-800 bg-black/10 shrink-0">
                            <button onClick={() => setActiveOrdnanceTab('energy')} className={`flex-1 py-3 text-[8px] retro-font transition-all ${activeOrdnanceTab === 'energy' ? 'text-emerald-400 bg-emerald-900/10' : 'text-zinc-600'}`}>ENERGY</button>
                            <button onClick={() => setActiveOrdnanceTab('explosive')} className={`flex-1 py-3 text-[8px] retro-font transition-all ${activeOrdnanceTab === 'explosive' ? 'text-blue-400 bg-blue-900/10' : 'text-zinc-600'}`}>EXPLOSIVE</button>
                            <button onClick={() => setActiveOrdnanceTab('defense')} className={`flex-1 py-3 text-[8px] retro-font transition-all ${activeOrdnanceTab === 'defense' ? 'text-cyan-400 bg-cyan-900/10' : 'text-zinc-600'}`}>SHIELD</button>
                          </div>
                          <div className="space-y-4 pb-4">
                            {activeOrdnanceTab !== 'defense' ? (
                              WEAPONS.filter(w => activeOrdnanceTab === 'energy' ? (w.type === WeaponType.PROJECTILE || w.type === WeaponType.LASER) : (w.type === WeaponType.MISSILE || w.type === WeaponType.MINE)).map(w => {
                                const currentFitting = getShipFitting(selectedHangarShip.id);
                                const weaponEntry = currentFitting.weapons.find(ew => ew.id === w.id);
                                const count = weaponEntry?.count || 0;
                                return (
                                  <div key={w.id} className="p-3 bg-black/30 border border-zinc-800 rounded text-left">
                                    <div className="flex justify-between text-[9px] mb-3 uppercase font-bold"><span className="text-zinc-300">{w.name}</span><span className="text-yellow-600 font-mono">₿{w.price}</span></div>
                                    <div className="flex items-center gap-3">
                                      <input type="range" min="0" max={w.isAmmoBased ? 200 : 2} value={count} onChange={(e) => setWeaponCount(w.id, parseInt(e.target.value))} className="flex-grow accent-emerald-500" />
                                      <span className="text-[10px] font-mono w-10 text-right text-emerald-400">{count}</span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              SHIELDS.map(s => (
                                <div key={s.id} onClick={() => setEquippedShield(s.id)} className={`p-4 border-2 rounded transition-all cursor-pointer flex justify-between items-center ${getShipFitting(selectedHangarShip.id).shieldId === s.id ? 'border-cyan-500 bg-cyan-950/20' : 'border-zinc-800 bg-zinc-800/30'}`}>
                                  <div className="flex flex-col text-left"><span className="font-bold text-[10px] uppercase text-zinc-300">{s.name}</span><span className="text-[8px] font-mono text-cyan-600 uppercase">CAP: {s.capacity}</span></div>
                                  <span className="text-[10px] font-mono text-yellow-600">₿{s.price.toLocaleString()}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-700 text-[10px] retro-font uppercase animate-pulse">Select a Vessel</div>
                    )}
                  </div>
               </div>

               <div className={`bg-zinc-900 border border-zinc-700 rounded-lg flex flex-col overflow-hidden shadow-2xl transition-all ${mobileHangarView === 'profile' ? 'flex flex-1 md:w-1/3' : 'hidden md:flex md:w-1/3'}`}>
                  <div className="p-4 border-b border-zinc-800 bg-zinc-800/20 shrink-0 text-left"><h3 className="retro-font text-[10px] text-emerald-400 uppercase tracking-tighter">Command Profile</h3></div>
                  <div className="flex-grow p-6 flex flex-col min-h-0">
                    <div className="p-4 bg-black/60 border border-zinc-800 rounded-lg flex items-center gap-4 mb-6 shrink-0 text-left">
                       <div className="w-16 h-16 bg-emerald-900/20 border border-emerald-500/30 rounded flex items-center justify-center text-4xl">{gameState.pilotAvatar}</div>
                       <div className="flex flex-col gap-1"><span className="text-[8px] text-zinc-500 uppercase font-mono tracking-widest">Operator-ID</span><span className="retro-font text-[12px] text-white uppercase">{gameState.pilotName}</span></div>
                    </div>
                    <div className="space-y-4 mb-auto shrink-0">
                      <div className="flex justify-between items-center text-[10px] font-mono border-b border-zinc-800 pb-2"><span className="text-zinc-500 uppercase">Budget</span><span className="text-yellow-500 font-bold">₿{gameState.credits.toLocaleString()}</span></div>
                      <div className="flex justify-between items-center text-[10px] font-mono border-b border-zinc-800 pb-2"><span className="text-zinc-500 uppercase">Fleet Size</span><span className="text-white font-bold">{gameState.ownedShips.length} UNITS</span></div>
                    </div>
                    <div className="mt-auto pt-6 space-y-4 shrink-0 pb-4 md:pb-0">
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setIsTutorialOpen(true)} className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded retro-font text-[8px] uppercase tracking-widest transition-all">MANUAL</button>
                        <button onClick={() => setIsSettingsOpen(true)} className="py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded retro-font text-[8px] uppercase tracking-widest transition-all">CONFIG</button>
                      </div>
                      <button 
                        onClick={() => { audioService.playSfx('click'); saveGame(); setScreen('intro'); }} 
                        className="w-full py-3 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded retro-font text-[8px] uppercase tracking-widest transition-all"
                      >
                        Save & Exit to Title
                      </button>
                      <button disabled={gameState.ownedShips.length === 0} onClick={() => setScreen('galaxy_map')} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white retro-font text-[11px] uppercase tracking-[0.2em] border-b-4 border-emerald-900 rounded-sm transition-all shadow-xl active:translate-y-1 disabled:opacity-20 disabled:cursor-not-allowed">JUMP TO SECTOR</button>
                    </div>
                  </div>
               </div>
            </div>
            {isTutorialOpen && <HelpModal onClose={() => setIsTutorialOpen(false)} />}
            {isSettingsOpen && <SettingsModal gameState={gameState} onUpdateGameState={updateGameState} onUpdateSettings={(s: any) => updateGameState({ settings: {...gameState.settings, ...s}})} onClose={() => setIsSettingsOpen(false)} />}
          </div>
        )}

        {screen === 'galaxy_map' && (
          <GalaxyMapScreen onSelectQuadrant={(q) => {
            setGameState(prev => ({ 
              ...prev, currentQuadrant: q, orbitingEntityId: null,
              taskForceShipIds: [...prev.ownedShips], activeTaskForceIndex: 0
            }));
            setScreen('map');
          }} onReturn={() => setScreen('hangar')} />
        )}

        {screen === 'map' && (
          <MapScreen 
            planets={sectorPlanets} 
            taskForceShipIds={gameState.taskForceShipIds}
            activeTaskForceIndex={gameState.activeTaskForceIndex}
            onSelectTaskForceShip={(index: number) => setGameState(prev => ({ ...prev, activeTaskForceIndex: index }))}
            onArrival={onArrival} 
            onReturn={() => setScreen('galaxy_map')} 
            currentQuadrant={gameState.currentQuadrant}
            getShipFitting={getShipFitting}
            isTaskForceVisible={isTaskForceVisible}
            isObjectListVisible={isObjectListVisible}
            setIsTaskForceVisible={setIsTaskForceVisible}
            setIsObjectListVisible={setIsObjectListVisible}
          />
        )}

        {screen === 'briefing' && <BriefingScreen isLoading={isLoading} briefing={briefing} planet={gameState.currentPlanet} moon={gameState.currentMoon} type={gameState.currentMission} onAbort={() => setScreen('map')} onLaunch={() => setScreen('game')} />}
        {screen === 'game' && currentShip && (
          <div className={`w-full h-full flex items-center justify-center transition-all ${gameState.settings.displayMode === 'fullscreen' ? 'h-screen' : ''}`}>
            <GameEngine 
              ship={currentShip} 
              weapons={getShipFitting(currentShip.id).weapons.map(ew => ({...WEAPONS.find(w => w.id === ew.id)!, count: ew.count}))} 
              shield={SHIELDS.find(s=>s.id===getShipFitting(currentShip.id).shieldId) || null} 
              missionType={gameState.currentMission!} 
              difficulty={(gameState.currentMoon?.difficulty || gameState.currentPlanet?.difficulty || 1)} 
              onGameOver={onGameOver} 
              isFullScreen={gameState.settings.displayMode === 'fullscreen'} 
              playerColor={gameState.shipColors[currentShip.id] || currentShip.defaultColor || '#10b981'}
            />
          </div>
        )}
        {screen === 'results' && lastResult && <ResultsScreen result={lastResult} onReturn={() => setScreen('map')} />}
      </main>

      {isSystemMenuOpen && (
        <SystemMenuModal 
          onResume={() => { audioService.playSfx('click'); setIsSystemMenuOpen(false); }}
          onReturnToCommand={() => { audioService.playSfx('click'); saveGame(); setIsSystemMenuOpen(false); setScreen('hangar'); }}
          onExitToTitle={() => { audioService.playSfx('click'); saveGame(); setIsSystemMenuOpen(false); setScreen('intro'); }}
        />
      )}
    </div>
  );
};

const GalaxyMapScreen = ({ onSelectQuadrant, onReturn }: { onSelectQuadrant: (q: QuadrantType) => void, onReturn: () => void }) => {
  const quadrants = useMemo(() => {
    const base = [
      { id: QuadrantType.ALFA, name: 'ALFA SECTOR', colorClass: 'text-yellow-400', desc: 'Inner colonies and trade routes.', diff: 'Standard' },
      { id: QuadrantType.BETA, name: 'BETA SECTOR', colorClass: 'text-red-500', desc: 'Industrial mining hub under siege.', diff: 'Moderate' },
      { id: QuadrantType.GAMA, name: 'GAMA SECTOR', colorClass: 'text-sky-300', desc: 'Research outposts in volatile space.', diff: 'High Risk' },
      { id: QuadrantType.DELTA, name: 'DELTA SECTOR', colorClass: 'text-orange-500', desc: 'Dark void. Origin of alien signatures.', diff: 'Extreme' },
    ];

    return base.map(q => {
      const sectorPlanets = PLANETS.filter(p => p.quadrant === q.id);
      const stats = sectorPlanets.reduce((acc, p) => {
        acc.planets++;
        acc.moons += p.moons.length;
        if (p.status === 'friendly') acc.friendly++;
        else acc.occupied++;
        acc.maxHazard = Math.max(acc.maxHazard, p.difficulty);
        return acc;
      }, { planets: 0, moons: 0, friendly: 0, occupied: 0, maxHazard: 0 });

      return { ...q, ...stats };
    });
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center py-6 px-4 animate-in fade-in duration-500 overflow-y-auto">
      <div className="text-center mb-4 shrink-0">
        <h2 className="retro-font text-2xl text-emerald-400 mb-2 tracking-widest uppercase">Galaxy Map Sectors</h2>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Command Intelligence Feed: Active</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl w-full px-4 mb-6">
        {quadrants.map(q => (
          <div 
            key={q.id} 
            onClick={() => { audioService.playSfx('click'); onSelectQuadrant(q.id); }} 
            className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all cursor-pointer group shadow-2xl relative flex flex-col min-h-[160px]"
          >
            <div className={`absolute top-0 left-0 bottom-0 w-1 opacity-20 group-hover:opacity-100 transition-opacity bg-current ${q.colorClass.replace('text-', 'bg-')}`}></div>
            
            <div className="flex justify-between items-start mb-2">
              <h3 className={`retro-font text-base ${q.colorClass} uppercase tracking-wide`}>{q.name}</h3>
              <div className="px-2 py-0.5 bg-black/50 border border-zinc-800 rounded text-[10px] font-mono text-red-400 uppercase">
                Hazard: {q.maxHazard}
              </div>
            </div>

            <p className="text-[13px] text-zinc-300 font-mono italic mb-2 leading-tight text-left">"{q.desc}"</p>
            
            <div className="mt-auto pt-2 border-t border-zinc-800/50">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest">Planets</span>
                  <span className="text-sm font-mono text-white font-bold">{q.planets}</span>
                </div>
                <div className="flex flex-col border-l border-zinc-800/30 pl-2 text-left">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest">Moons</span>
                  <span className="text-sm font-mono text-white font-bold">{q.moons}</span>
                </div>
                <div className="flex flex-col border-l border-zinc-800/30 pl-2 text-left">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest">Status</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-mono text-emerald-500">{q.friendly}F</span>
                    <span className="text-[10px] font-mono text-red-500">{q.occupied}O</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => { audioService.playSfx('click'); onReturn(); }} 
        className="text-zinc-500 hover:text-white bg-zinc-900/30 px-10 py-4 border border-zinc-800 rounded retro-font text-[9px] uppercase transition-all mb-6 tracking-[0.2em] shrink-0"
      >
        Return to Hangar
      </button>

      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent)]" />
    </div>
  );
};

const StarfieldLayer = ({ stars, userOffset, localTime }: { stars: any[], userOffset: { x: number, y: number }, localTime: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        sizeRef.current = { w: window.innerWidth, h: window.innerHeight };
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);
    
    const centerX = w / 2;
    const centerY = h / 2;

    stars.forEach(s => {
      const parallaxX = userOffset.x * s.depth;
      const parallaxY = userOffset.y * s.depth;
      
      const rx = ((s.x - 50) * s.depth) + centerX + parallaxX;
      const ry = ((s.y - 50) * s.depth) + centerY + parallaxY;
      
      if (rx > -5 && rx < w + 5 && ry > -5 && ry < h + 5) {
        const flicker = 0.7 + 0.3 * Math.sin(localTime * 0.1 + s.flickerPeriod);
        ctx.globalAlpha = s.opacity * flicker;
        ctx.fillStyle = s.tint;
        ctx.beginPath();
        ctx.arc(rx, ry, s.sizePx, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [stars, userOffset, localTime]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

const MapScreen = ({ planets, taskForceShipIds, activeTaskForceIndex, onSelectTaskForceShip, onArrival, onReturn, currentQuadrant, getShipFitting, isTaskForceVisible, isObjectListVisible, setIsTaskForceVisible, setIsObjectListVisible }: any) => {
  const [localTime, setLocalTime] = useState(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  const [camZoom, setCamZoom] = useState(0.8);
  const [targetZoom, setTargetZoom] = useState(0.8);
  const [isAutoZooming, setIsAutoZooming] = useState(false);
  const [userOffset, setUserOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  const cometCycle = 45000; 
  const mapScale = 0.8; 

  const startTimeRef = useRef(performance.now());
  const timeRef = useRef(0);

  useEffect(() => {
    let frameId: number;
    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      timeRef.current = elapsed / 50; 
      setLocalTime(timeRef.current);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const sessionSeeds = useMemo(() => {
    const seeds: Record<string, number> = {};
    planets.forEach((p: Planet) => {
      seeds[p.id] = Math.random() * Math.PI * 2;
      p.moons.forEach(m => { seeds[m.id] = Math.random() * Math.PI * 2; });
    });
    seeds['comet_boss'] = Math.random() * cometCycle;
    seeds['belt'] = Math.random() * 1000;
    return seeds;
  }, [currentQuadrant, planets]);

  const sunSizePx = useMemo(() => {
    if (currentQuadrant === QuadrantType.DELTA) return 160;
    return currentQuadrant === QuadrantType.GAMA ? 128 : (currentQuadrant === QuadrantType.BETA ? 64 : 96);
  }, [currentQuadrant]);

  const planetMultiplier = useMemo(() => {
    const maxP = Math.max(...planets.map((p: Planet) => p.size));
    return (sunSizePx * 0.45) / maxP;
  }, [planets, sunSizePx]);

  const globalOrbitShift = useMemo(() => {
    if (planets.length === 0) return 0;
    const minRadius = Math.min(...planets.map((p: Planet) => p.orbitRadius));
    return minRadius * 0.3;
  }, [planets]);

  const moonDiameterPx = useMemo(() => {
    if (planets.length === 0) return 12;
    const minPSize = Math.min(...planets.map((p: Planet) => p.size));
    const smallestPlanetRadiusPx = (minPSize * planetMultiplier) / 2;
    return Math.max(12, Math.floor(smallestPlanetRadiusPx * 0.66));
  }, [planets, planetMultiplier]);

  const safeMoonOrbits = useMemo(() => {
    const map: Record<string, { id: string, safePx: number }[]> = {};
    planets.forEach((p: Planet) => {
      const pRadiusPx = (p.size * planetMultiplier) / 2;
      const firstMoonOrbitRadius = pRadiusPx + (5 * moonDiameterPx);
      const orbitSpacingPx = 2 * moonDiameterPx;
      
      map[p.id] = p.moons.map((m, idx) => {
        const safePx = firstMoonOrbitRadius + (idx * orbitSpacingPx);
        return { id: m.id, safePx };
      });
    });
    return map;
  }, [planets, planetMultiplier, moonDiameterPx]);

  const getCometPos = useCallback((timeVal: number) => {
    if (currentQuadrant !== QuadrantType.GAMA) return null;
    const periRadius = 40 * mapScale; 
    const apoRadius = 141 * mapScale; 
    const a = (periRadius + apoRadius) / 2; 
    const e = (apoRadius - periRadius) / (apoRadius + periRadius); 
    const sessionOffset = sessionSeeds['comet_boss'] || 0;
    const tMod = (timeVal * 1.5 + sessionOffset) % cometCycle;
    const M = (tMod / cometCycle) * 2 * Math.PI;
    let E = M;
    for (let i = 0; i < 10; i++) { E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); }
    const r = a * (1 - e * Math.cos(E));
    const theta = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    const axisRotation = Math.PI * 1.35; 
    const finalAngle = theta + axisRotation;
    const wx = 50 + Math.cos(finalAngle) * r;
    const wy = 50 + Math.sin(finalAngle) * r;
    return { x: wx, y: wy, dist: r, angle: finalAngle, peri: periRadius, id: 'comet_boss', name: 'NEMESIS COMET' };
  }, [currentQuadrant, sessionSeeds, mapScale]);

  const getPlanetWorldPos = useCallback((planet: Planet, timeVal: number) => { 
    if (!planet) return { x: 50, y: 50 }; 
    const direction = planet.orbitDirection || 1; 
    const startOffset = sessionSeeds[planet.id] || 0;
    const shiftedBaseRadius = (planet.orbitRadius + globalOrbitShift) * mapScale;
    const dynamicOrbitSpeed = planet.orbitSpeed * (22 / Math.sqrt(shiftedBaseRadius / mapScale));
    const angle = (timeVal * dynamicOrbitSpeed * direction) + startOffset; 
    return { x: 50 + Math.cos(angle) * shiftedBaseRadius, y: 50 + Math.sin(angle) * shiftedBaseRadius }; 
  }, [globalOrbitShift, sessionSeeds, mapScale]);

  const getMoonWorldPos = useCallback((planetPos: { x: number, y: number }, moon: Moon, planetId: string, timeVal: number) => {
    const direction = moon.orbitDirection || 1;
    const startOffset = sessionSeeds[moon.id] || 0;
    const safeData = safeMoonOrbits[planetId]?.find(sm => sm.id === moon.id);
    const orbitRadiusPx = (safeData?.safePx || 40) * mapScale;
    
    // speed inversely proportional to radius for slightly more realistic feel
    const dynamicMoonSpeed = (0.5 / Math.sqrt(orbitRadiusPx)) * 0.3;
    const angle = (timeVal * dynamicMoonSpeed * direction) + startOffset;
    
    // 10 is the magic factor to convert pixel radii to 0-100 map percentage units safely
    return { 
      x: planetPos.x + (Math.cos(angle) * orbitRadiusPx) / 10, 
      y: planetPos.y + (Math.sin(angle) * orbitRadiusPx) / 10 
    };
  }, [safeMoonOrbits, sessionSeeds, mapScale]);

  const getTargetWorldPos = useCallback((id: string | null, timeVal: number) => {
    if (!id || id === 'sun') return { x: 50, y: 50 };
    if (id === 'comet_boss') {
      const c = getCometPos(timeVal);
      return c ? { x: c.x, y: c.y } : { x: 50, y: 50 };
    }
    const planet = planets.find((p: any) => p.id === id);
    if (planet) return getPlanetWorldPos(planet, timeVal);
    const moon = planets.flatMap((p: any) => p.moons).find((m: any) => m.id === id);
    if (moon) {
      const parent = planets.find((p: any) => p.moons.some((m: any) => m.id === moon.id));
      if (parent) {
        const pPos = getPlanetWorldPos(parent, timeVal);
        return getMoonWorldPos(pPos, moon, parent.id, timeVal);
      }
    }
    return { x: 50, y: 50 };
  }, [planets, getCometPos, getPlanetWorldPos, getMoonWorldPos]);

  const cometData = useMemo(() => getCometPos(localTime), [localTime, getCometPos]);

  const asteroidBelt = useMemo(() => {
    if (currentQuadrant !== QuadrantType.GAMA) return [];
    const count = 150;
    const inner = 130 * mapScale;
    const outer = 210 * mapScale;
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.1);
      const dist = inner + Math.random() * (outer - inner);
      const size = 1.5 + Math.random() * 3.5;
      const seed = Math.random() * 1000;
      return { angle, dist, size, seed };
    });
  }, [currentQuadrant, mapScale]);

  const minZoomLevel = 8 / sunSizePx;

  const handleManualZoom = useCallback((delta: number) => {
    setIsAutoZooming(false);
    setCamZoom(prev => Math.max(minZoomLevel, Math.min(12.0, prev * (delta > 0 ? 0.82 : 1.22))));
  }, [minZoomLevel]);

  const selectEntity = useCallback((id: string | null) => {
    audioService.playSfx('click');
    setSelectedEntityId(id);
    
    if (!id || id === 'sun') {
      setTargetZoom(0.8);
    } else {
      const targetPos = getTargetWorldPos(id, timeRef.current);
      const distFromCenter = Math.hypot(targetPos.x - 50, targetPos.y - 50);
      const screenRadiusRatio = 35; 
      setTargetZoom(Math.max(minZoomLevel, Math.min(12.0, screenRadiusRatio / distFromCenter)));
    }
    setIsAutoZooming(true);
  }, [getTargetWorldPos, planets, sunSizePx, minZoomLevel]);

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      if (isAutoZooming) {
        setCamZoom(prev => {
          const next = prev + (targetZoom - prev) * 0.08;
          if (Math.abs(targetZoom - next) < 0.001) { setIsAutoZooming(false); return targetZoom; }
          return next;
        });
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isAutoZooming, targetZoom]);

  const selectedEntity = useMemo(() => {
    if (selectedEntityId === 'sun') return { id: 'sun', name: currentQuadrant === QuadrantType.DELTA ? 'CORE SINGULARITY' : 'SOLAR CORE' };
    if (selectedEntityId === 'comet_boss') return cometData;
    return planets.find((p: any) => p.id === selectedEntityId) || planets.flatMap((p: any) => p.moons).find((m: any) => m.id === selectedEntityId);
  }, [selectedEntityId, planets, cometData, currentQuadrant]);

  const stars = useMemo(() => {
    return Array.from({ length: 2500 }).map((_, i) => ({
      x: Math.random() * 20000 - 10000, 
      y: Math.random() * 20000 - 10000,
      sizePx: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      depth: 0.05 + Math.pow(Math.random(), 2) * 0.95, 
      tint: Math.random() > 0.9 ? '#93c5fd' : (Math.random() > 0.95 ? '#fca5a5' : '#ffffff'),
      flickerPeriod: Math.random() * 20 + 10 
    }));
  }, []);

  const getSelectionStyles = (objectRadiusMapUnits: number) => {
    const visualRadiusPixels = (objectRadiusMapUnits * camZoom);
    const finalVisualRadius = Math.max(8, visualRadiusPixels + 6);
    const mapWidthHeight = (finalVisualRadius * 2) / camZoom;

    return {
      width: mapWidthHeight + 'px',
      height: mapWidthHeight + 'px',
      borderWidth: (2 / camZoom) + 'px' 
    };
  };

  return (
    <div 
      className={`w-full h-full flex flex-col items-center relative overflow-hidden transition-colors duration-1000 ${currentQuadrant === QuadrantType.DELTA ? 'bg-[#010102]' : 'bg-[#020204]'}`}
      onMouseMove={(e) => { if (!isPanning) return; setUserOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY })); }}
      onMouseUp={() => setIsPanning(false)}
      onMouseLeave={() => setIsPanning(false)}
    >
      <StarfieldLayer stars={stars} userOffset={userOffset} localTime={localTime} />

      <div 
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-75 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={() => { setIsPanning(true); setSelectedEntityId(null); setIsAutoZooming(false); }}
        onWheel={(e) => handleManualZoom(e.deltaY)}
        style={{ transform: `translate(${userOffset.x}px, ${userOffset.y}px) scale(${camZoom})` }}
      >
        <div className="relative w-full h-full max-w-[12000px] aspect-square flex items-center justify-center">
            {asteroidBelt.map((ast, idx) => {
               const ax = Math.cos(ast.angle + (localTime * 0.0001)) * ast.dist;
               const ay = Math.sin(ast.angle + (localTime * 0.0001)) * ast.dist;
               return (
                 <div key={idx} className="absolute rounded-[40%] bg-[#3f3f46]/40 blur-[0.5px]" style={{ left: (50+ax)+'%', top: (50+ay)+'%', width: ast.size+'px', height: ast.size*0.8+'px', transform: `translate(-50%, -50%) rotate(${ast.seed}deg)` }} />
               );
            })}

            {/* Solar Core */}
            {(() => {
              const isSelected = selectedEntityId === 'sun';
              if (currentQuadrant === QuadrantType.DELTA) {
                return (
                  <div onClick={(e) => { e.stopPropagation(); selectEntity('sun'); }} className="absolute z-10 cursor-pointer" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: sunSizePx+'px', height: sunSizePx+'px' }}>
                    <div className="absolute inset-0 rounded-full bg-black shadow-[0_0_60px_rgba(139,92,246,0.8)] border border-purple-900/40" />
                    <div className="absolute inset-[-10%] rounded-full animate-spin-slow opacity-70" style={{ background: 'conic-gradient(from 0deg, transparent, #a855f7, transparent, #3b82f6, transparent)', filter: 'blur(12px)' }} />
                    <div className="absolute inset-[10%] rounded-full bg-black z-20" />
                    {isSelected && <div className="absolute top-1/2 left-1/2 border-sky-400 border-dashed rounded-full animate-rotate-dashed" style={getSelectionStyles(sunSizePx/2)} />}
                  </div>
                );
              }
              const sunColors: Record<string, string> = { [QuadrantType.BETA]: '#ef4444', [QuadrantType.GAMA]: '#7dd3fc', [QuadrantType.ALFA]: '#facc15' };
              return (
                <div onClick={(e) => { e.stopPropagation(); selectEntity('sun'); }} className={`absolute z-10 rounded-full blur-[2px] cursor-pointer transition-all ${isSelected ? 'scale-100' : 'hover:scale-105'}`} style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: sunSizePx+'px', height: sunSizePx+'px', backgroundColor: sunColors[currentQuadrant] || '#facc15', boxShadow: `0 0 ${sunSizePx}px ${sunColors[currentQuadrant] || '#facc15'}` }}>
                    {isSelected && <div className="absolute top-1/2 left-1/2 border-sky-400 border-dashed rounded-full animate-rotate-dashed" style={getSelectionStyles(sunSizePx/2)} />}
                </div>
              );
            })()}

            {cometData && (
              (() => {
                const pressure = Math.pow((cometData.peri || 40) / cometData.dist, 1.2);
                const tailLength = Math.min(500, 100 + (1800 * Math.pow(pressure, 2.0))); 
                const tailWidth = 16 + (30 * pressure); 
                const angle = (cometData.angle * 180) / Math.PI;
                const isSelected = selectedEntityId === 'comet_boss';

                return (
                  <div 
                    onClick={(e) => { e.stopPropagation(); selectEntity('comet_boss'); }}
                    className="absolute z-40 cursor-pointer" 
                    style={{ left: cometData.x + '%', top: cometData.y + '%', transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ opacity: Math.max(0.1, pressure) }}>
                      <div className="absolute top-1/2 left-1/2 origin-left blur-[15px]" style={{ 
                        width: tailLength + 'px', 
                        height: tailWidth * 3.5 + 'px', 
                        background: 'radial-gradient(ellipse at left, rgba(254, 240, 138, 0.45), transparent)', 
                        transform: `translate(0, -50%) rotate(${angle}deg)`,
                        borderRadius: '50% 0 0 50%'
                      }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[12px]" style={{ width: tailWidth * 5 + 'px', height: tailWidth * 5 + 'px', background: 'radial-gradient(circle, rgba(254, 240, 138, 0.3), transparent)' }} />
                    </div>
                    <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_30px_#facc15] relative">
                      {isSelected && <div className="absolute top-1/2 left-1/2 border-sky-400 border-dashed rounded-full animate-rotate-dashed" style={getSelectionStyles(8)} />}
                    </div>
                  </div>
                );
              })()
            )}
            
            {planets.map((p: any) => { 
               const worldPos = getPlanetWorldPos(p, localTime); 
               const isSelected = selectedEntityId === p.id;
               const pRadius = (p.size * planetMultiplier) / 2;

               return ( 
                 <React.Fragment key={p.id}>
                    {p.atmosphereColor && (
                      <div className="absolute z-19 rounded-full blur-md opacity-40 pointer-events-none" style={{ width: (pRadius * 3)+'px', height: (pRadius * 3)+'px', left: worldPos.x+'%', top: worldPos.y+'%', backgroundColor: p.atmosphereColor, transform: 'translate(-50%, -50%)' }} />
                    )}

                    <div onClick={(e)=> { e.stopPropagation(); selectEntity(p.id); }} className={`absolute z-20 rounded-full border-2 border-white/10 cursor-pointer transition-all ${isSelected ? 'scale-100 border-transparent' : 'hover:border-white/40 hover:scale-110'}`} style={{ width: (pRadius * 2)+'px', height: (pRadius * 2)+'px', left: worldPos.x+'%', top: worldPos.y+'%', backgroundColor: p.color, transform: 'translate(-50%, -50%)' }}>
                        {isSelected && <div className="absolute top-1/2 left-1/2 border-sky-400 border-dashed rounded-full animate-rotate-dashed" style={getSelectionStyles(pRadius)} />}
                    </div>
                    {p.moons.map((m: Moon) => {
                      const worldMoonPos = getMoonWorldPos(worldPos, m, p.id, localTime);
                      const isMoonSelected = selectedEntityId === m.id;
                      const mRadius = moonDiameterPx / 2;

                      return (
                        <div key={m.id} onClick={(e) => { e.stopPropagation(); selectEntity(m.id); }} className={`absolute z-30 rounded-full border border-white/20 cursor-pointer transition-all ${isMoonSelected ? 'scale-100 border-transparent' : 'hover:border-white/50'}`} style={{ left: worldMoonPos.x+'%', top: worldMoonPos.y+'%', width: moonDiameterPx + 'px', height: moonDiameterPx + 'px', backgroundColor: m.color || '#94a3b8', transform: 'translate(-50%, -50%)' }}>
                            {isMoonSelected && <div className="absolute top-1/2 left-1/2 border-sky-400 border-dashed rounded-full animate-rotate-dashed" style={getSelectionStyles(mRadius)} />}
                        </div>
                      );
                    })}
                 </React.Fragment> 
               ); 
             })}
        </div>
      </div>

      <div className="absolute top-6 left-6 flex flex-col gap-2 z-[50]">
        <button onClick={() => handleManualZoom(-1)} className="w-10 h-10 bg-zinc-900/80 border border-zinc-700 flex items-center justify-center text-emerald-400 hover:bg-zinc-800 rounded font-bold transition-colors shadow-lg">+</button>
        <button onClick={() => handleManualZoom(1)} className="w-10 h-10 bg-zinc-900/80 border border-zinc-700 flex items-center justify-center text-emerald-400 hover:bg-zinc-800 rounded font-bold transition-colors shadow-lg">-</button>
        <button onClick={() => { setCamZoom(0.6); setTargetZoom(0.6); setIsAutoZooming(false); setUserOffset({x:0, y:0}); setSelectedEntityId(null); audioService.playSfx('click'); }} className="w-10 h-10 bg-zinc-900/80 border border-zinc-700 flex items-center justify-center text-emerald-400 hover:bg-zinc-800 rounded transition-colors shadow-lg" title="Reset Camera">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
        </button>
      </div>

      <div className="absolute top-6 bottom-6 right-6 w-72 md:w-80 flex flex-col gap-4 z-[50]">
        {isObjectListVisible && (
          <div className="flex-grow bg-zinc-950/80 border border-zinc-800 p-5 rounded backdrop-blur-md shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="retro-font text-[9px] text-emerald-400 uppercase tracking-widest text-left">{currentQuadrant} SECTOR</h3>
              <button onClick={() => setIsObjectListVisible(false)} className="w-6 h-6 bg-zinc-800/80 hover:bg-red-900/40 text-zinc-500 hover:text-white flex items-center justify-center text-[10px] retro-font rounded border border-zinc-700 transition-colors">X</button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1">
              <div onClick={() => selectEntity('sun')} className={`p-2.5 rounded text-[9px] font-mono uppercase cursor-pointer transition-all flex justify-between items-center border ${selectedEntityId === 'sun' ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/50'}`}>
                  <span>{currentQuadrant === QuadrantType.DELTA ? 'CORE SINGULARITY' : 'SOLAR CORE'}</span>
                  <span className="text-sky-600">CORE</span>
              </div>

              {cometData && (
                <div onClick={() => selectEntity('comet_boss')} className={`p-2.5 rounded text-[9px] font-mono uppercase cursor-pointer transition-all flex justify-between items-center border ${selectedEntityId === 'comet_boss' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-red-900/20'}`}>
                  <span>NEMESIS COMET</span>
                  <span className="text-red-600">BOSS</span>
                </div>
              )}
              {planets.map((p: Planet) => (
                <div key={p.id}>
                  <div onClick={() => selectEntity(p.id)} className={`p-2.5 rounded text-[9px] font-mono uppercase cursor-pointer transition-all flex justify-between items-center ${selectedEntityId === p.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>
                    <span>{p.name}</span>
                    <span className={p.difficulty > 5 ? 'text-red-500' : 'text-emerald-600'}>LV.{p.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="shrink-0 space-y-4">
          {selectedEntity && (
            <div className="bg-zinc-950/80 border border-zinc-800 p-5 rounded backdrop-blur-md shadow-2xl animate-in slide-in-from-right duration-300 text-left">
               <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest block mb-2">Tactical Intelligence</span>
               <h4 className="retro-font text-xs text-white mb-2 uppercase">{selectedEntity.name || "Unknown Signature"}</h4>
               <p className="text-[9px] font-mono text-zinc-400 leading-relaxed uppercase">
                 {selectedEntityId === 'sun' ? 'THE CENTRAL MASS OF THE SECTOR. HIGH GRAVITY ALERT. MISSION DEPLOYMENT IMPOSSIBLE.' : 
                  selectedEntityId === 'comet_boss' ? 'PRIMARY BOSS THREAT. COLLISION PATH DETECTED. NEUTRALIZE BEFORE SECTOR ESCAPE.' : 
                  ('description' in selectedEntity ? (selectedEntity as Planet).description : `Orbital satellite of ${planets.find((p:any) => p.moons.some((m:any) => m.id === selectedEntity.id))?.name}.`)}
               </p>
            </div>
          )}
          <div className="flex gap-4">
            <button onClick={onReturn} className="flex-1 py-4 bg-zinc-900/90 border-2 border-zinc-800 text-zinc-500 hover:text-white rounded retro-font text-[9px] uppercase transition-all tracking-widest shadow-xl">RETURN</button>
            <button disabled={!selectedEntityId || selectedEntityId === 'sun' || taskForceShipIds.length === 0} onClick={() => onArrival(selectedEntity)} className={`flex-1 py-4 rounded retro-font text-[9px] uppercase transition-all tracking-widest border-b-4 shadow-xl ${selectedEntityId && selectedEntityId !== 'sun' && taskForceShipIds.length > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 active:translate-y-1' : 'bg-zinc-800 text-zinc-600 border-zinc-950 opacity-40 cursor-not-allowed'}`} > ENGAGE </button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
};

const BriefingScreen = ({ isLoading, briefing, planet, moon, type, onAbort, onLaunch }: any) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
      <div className="max-w-3xl w-full bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="bg-zinc-800 border-b border-zinc-700 p-4 flex justify-between items-center">
          <div className="flex flex-col text-left">
             <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Mission Protocol</span>
             <h2 className="retro-font text-xl text-emerald-400 uppercase tracking-widest">{type === MissionType.COMET ? 'COMET INTERCEPT' : type}</h2>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-mono text-zinc-500 uppercase">Targeting</span>
             <div className="retro-font text-xs text-white uppercase">{type === MissionType.COMET ? 'NEMESIS COMET' : (moon ? moon.name : planet?.name)}</div>
          </div>
        </div>
        <div className="p-8 flex-grow space-y-8 flex flex-col min-h-0">
          <div className="flex gap-8 items-start">
             <div className="w-32 h-32 rounded-full border-4 border-emerald-500/20 bg-black flex items-center justify-center shrink-0 relative overflow-hidden">
                <div className="w-24 h-24 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse" style={{ backgroundColor: type === MissionType.COMET ? '#fff' : (moon?.color || planet?.color || '#3b82f6') }} />
                <div className="absolute inset-0 border border-emerald-500/10 rounded-full animate-spin-slow" />
             </div>
             <div className="flex-grow space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-black/40 border border-zinc-800 rounded">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Environment</span>
                      <span className="text-[10px] retro-font text-white uppercase">{type === MissionType.COMET ? 'PLASMA' : 'Volatile'}</span>
                   </div>
                   <div className="p-3 bg-black/40 border border-zinc-800 rounded">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Target Priority</span>
                      <span className="text-[10px] retro-font text-white uppercase">{type === MissionType.COMET ? 'BOSS - MAX' : 'STANDARD'}</span>
                   </div>
                </div>
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded">
                   <p className="text-[11px] font-mono text-emerald-400 italic uppercase">"Priority directive: Neutralize target nucleus. The Earth Union cannot afford its sector escape."</p>
                </div>
             </div>
          </div>
          <div className="p-6 bg-black/60 border border-zinc-800 rounded-lg flex-grow overflow-y-auto custom-scrollbar">
             <h3 className="retro-font text-[10px] text-zinc-500 mb-4 uppercase tracking-[0.3em] border-b border-zinc-800 pb-2 text-left">Briefing Intelligence</h3>
             {isLoading ? (
               <div className="h-24 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] retro-font text-emerald-600 uppercase animate-pulse">Decrypting Signal...</span>
               </div>
             ) : (
               <p className="font-mono text-[13px] text-zinc-300 leading-relaxed uppercase animate-in fade-in slide-in-from-bottom-2 duration-700 text-left"> {briefing || "Communication error. Confirm mission parameters and engage immediately."} </p>
             )}
          </div>
        </div>
        <div className="p-6 bg-zinc-800/50 border-t border-zinc-700 grid grid-cols-2 gap-4">
           <button onClick={() => { audioService.playSfx('click'); onAbort(); }} className="py-4 bg-zinc-900 border-2 border-zinc-700 text-zinc-500 hover:text-white rounded retro-font text-[10px] uppercase transition-all tracking-widest shadow-xl">Abort Mission</button>
           <button onClick={() => { audioService.playSfx('click'); onLaunch(); }} className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded retro-font text-[11px] uppercase tracking-[0.3em] border-b-4 border-emerald-900 transition-all shadow-xl active:translate-y-1">Launch Attack</button>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
};

const ResultsScreen = ({ result, onReturn }: any) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black p-6">
       <div className={`max-w-xl w-full bg-zinc-900 border-4 ${result.success ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)]'} rounded-lg p-10 text-center space-y-10 animate-in zoom-in-95 duration-300 relative overflow-hidden`}>
          <div className={`absolute top-0 left-0 right-0 h-1 ${result.success ? 'bg-emerald-500' : 'bg-red-600'} animate-pulse`} />
          <div className="space-y-2">
            <h2 className={`retro-font text-4xl md:text-6xl ${result.success ? 'text-emerald-500' : 'text-red-600'} uppercase tracking-widest`}> {result.success ? 'Victory' : 'Defeat'} </h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.5em]">Sector Operations Concluded</p>
          </div>
          <div className="p-8 bg-black/40 border border-zinc-800 rounded-lg space-y-6">
             <div className="flex justify-between items-center text-left">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Status</span>
                <span className={`retro-font text-xs ${result.success ? 'text-emerald-400' : 'text-red-400'} uppercase`}>{result.success ? 'MISSION ACCOMPLISHED' : 'ASSET TERMINATED'}</span>
             </div>
             <div className="flex justify-between items-center text-left border-t border-zinc-800 pt-4">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Resources Recovered</span>
                <span className="retro-font text-lg text-yellow-500 uppercase">₿{result.reward.toLocaleString()}</span>
             </div>
          </div>
          <button onClick={() => { audioService.playSfx('click'); onReturn(); }} className={`w-full py-6 rounded-sm retro-font text-[12px] uppercase tracking-[0.4em] transition-all shadow-xl active:translate-y-1 border-b-4 ${result.success ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-950'}`} > Return to Command </button>
       </div>
    </div>
  );
};

export default App;
